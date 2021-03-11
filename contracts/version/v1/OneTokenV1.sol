// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../../interface/IOneTokenV1.sol";
import "./OneTokenV1Base.sol";

contract OneTokenV1 is IOneTokenV1, OneTokenV1Base {

    using AddressSet for AddressSet.Set;
    using SafeMath for uint;

    uint public fee = PRECISION;

    /// @notice withdrawals are delayed for at least one block (resist flash loan attacks)
    // collateral token => user => balance.
    mapping(address => mapping(address => uint)) public override userBalances;
    mapping(address => mapping(address => uint)) public override userCreditBlocks;
    mapping(address => uint) public liabilities;

    event UserWithdrawal(address sender, address token, uint amount);
    event userBalanceIncreased(address user, address token, uint amount);
    event userBalanceDecreased(address user, address token, uint amount);    
    event Minted(address sender, address collateral, uint oneTokens, uint memberTokens, uint collateralTokens);
    event Redeemed(address sender, address collateral, uint amount);
    event NewFeeSet(address sender, uint fee);
    
    /// @dev there is no constructor for proxy deployment. Use init()
    
    function availableBalance(address user, address token) public view returns(uint) {
        uint userBlock = userCreditBlocks[token][user];
        // there is no case when userBlock is uninitialized and balance > 0
        if(userBlock < block.number) return userBalances[token][user];
        return 0;
    }
    
    /// @notice User withdrawals are delayed 1 block after any balance increase
    function withdraw(address token, uint amount) public override {
        require(amount <= availableBalance(msg.sender, token), "OneTokenV1: insufficient available funds.");
        userBalances[token][msg.sender] = userBalances[token][msg.sender].sub(amount, "OneTokenV1: insufficient funds");
        IERC20(token).transfer(msg.sender, amount);
        IController(controller).periodic();
        emit UserWithdrawal(msg.sender, token, amount);
    }

    function increaseUserBalance(address user, address token, uint amount) private {
        userBalances[token][user] = userBalances[token][user].add(amount);
        liabilities[msg.sender] = liabilities[msg.sender].add(amount);
        userCreditBlocks[token][user] = block.number;
        emit userBalanceIncreased(user, token, amount);
    }

    function decreaseUserBalance(address user, address token, uint amount) private {
        userBalances[token][user] = userBalances[token][user].sub(amount);
        liabilities[msg.sender] = liabilities[msg.sender].sub(amount);
        emit userBalanceDecreased(user, token, amount);        
    }

    /// @notice Will take the lessor of memberTokens allowance or maximum allowed by the minting ration, balance in collateral.

    function mint(address collateralToken, uint oneTokens) external initialized override {
        require(collateralTokenSet.exists(collateralToken), "OneTokenV1: offer a collateral token");
        require(oneTokens > 0, "OneTokenV1: request oneTokens quantity");
        // require(memberTokens > 0, "OneTokenV1: pledge member tokens quantity");
        
        // this will update the member token oracle price history
        (uint mintingRatio, uint maxOrderVolume) = updateMintingRatio();

        // future mintmasters may return a maximum order volume to tamp down on possible manipulation
        require(oneTokens <= maxOrderVolume, "OneTokenV1: orders exceeds temporary limit.");

        // compute the member token value and collateral value requirement
        uint totalCost = oneTokens.add(oneTokens.mul(fee).div(PRECISION));
        uint collateralUSDValue = totalCost.mul(mintingRatio).div(PRECISION);
        uint memberTokensUSDValue = totalCost.sub(collateralUSDValue);

        // compute the member tokens required
        (uint memberTokensReq, /* volatility */) = IOracle(memberToken).amountRequired(memberToken, memberTokensUSDValue);

        // tolerate over-collateralized minting - memberToken allowance is too low
        uint memberTokenAllowance = IERC20(memberToken).allowance(msg.sender, address(this));
        if(memberTokensReq > memberTokenAllowance) {
            uint memberTokenRate = memberTokensUSDValue.mul(PRECISION).div(memberTokensReq);
            memberTokensReq = memberTokenAllowance;
            // re-evaluate the memberToken value and collateral value required using the oracle rate already obtained
            memberTokensUSDValue = memberTokenRate.mul(memberTokensReq).div(PRECISION);
            collateralUSDValue = totalCost.sub(memberTokensUSDValue);
        }

        // compute actual collateral tokens required in case of imperfect pegs
        (uint collateralTokensReq, /* volatility */) = IOracle(collateralToken).amountRequired(collateralToken, collateralUSDValue);

        // draw from available user balance if possible
        uint userCollateralBalance = availableBalance(collateralToken, msg.sender);
        uint collateralFromBalance = (collateralTokensReq <= userCollateralBalance) ? 
            collateralTokensReq : userCollateralBalance;
        if(collateralFromBalance > 0) {
            decreaseUserBalance(msg.sender, collateralToken, collateralFromBalance);
        }

        // transfer tokens in
        IERC20(memberToken).transferFrom(msg.sender, address(this), memberTokensReq);
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralTokensReq.sub(collateralFromBalance));
        
        // mint oneTokens
        _mint(msg.sender, oneTokens);

        /// @notice avoiding the controller reduces transaction cost for minting
        // IController(controller).periodic();

        emit Minted(msg.sender, collateralToken, oneTokens, memberTokensReq, collateralTokensReq);
    }

    /// @notice first grant allowance, then redeem

    function redeem(address collateral, uint amount) external override {
        transferFrom(msg.sender, address(this), amount);
        increaseUserBalance(msg.sender, collateral, amount);
        emit Redeemed(msg.sender, collateral, amount);
        // updates the oracle price history for oneToken, only
        updateMintingRatio();
        IController(controller).periodic();
    }

    /**
     * Adjustable fee
     */

    function setFee(uint fee_) external onlyOwner {
        fee = fee_;
        emit NewFeeSet(msg.sender, fee_);
    }

    /**
     * update the state
     */

    function updateMintingRatio() public override returns(uint ratio, uint maxOrderVolume) {
        return IMintMaster(mintMaster).updateMintingRatio();
    }

    /**
     * read the state 
     */

    function getMintingRatio() public view override returns(uint ratio, uint maxOrderVolume) {
        return IMintMaster(mintMaster).getMintingRatio();
    }

    function getHoldings(address token) public view override returns(uint vaultBalance, uint strategyBalance) {   
        IERC20 t = IERC20(token);
        vaultBalance = t.balanceOf(address(this));
        Asset storage a = assets[token];
        if(a.strategy != NULL_ADDRESS) strategyBalance = t.balanceOf(a.strategy);
    }    

    /**
     * Courtesy functions
     */
    
    /// @notice these results can be computed off-chain using the asset inventory and calls to ERC20 and oracle contracts
    /// it may not be possible to iterate all known assets for a given oneToken.
    /// oracles may report long-running averages unless their update() functions are invoked periodically.

    function getCollateralValue() public view override returns(uint vaultUsd, uint strategyUsd) {
        uint collateralCount = collateralTokenSet.count();
        for(uint i=0; i<collateralCount; i++) {
            address token = collateralTokenSet.keyAtIndex(i);
            Asset storage a = assets[token];
            address oracle = a.oracle;
            (uint vaultBal, uint strategyBal) = getHoldings(token);
            (uint vaultInUsd, /* uint volatility */) = IOracle(oracle).read(token, vaultBal);
            (uint strategyInUsd, /* uint volatility */) = IOracle(oracle).read(token, strategyBal);
            vaultUsd += vaultInUsd;
            strategyUsd += strategyInUsd;
        }
    }

    function getTreasuryValue() public view override returns(uint vaultUsd, uint strategyUsd) {
        uint treasuryCount = otherTokenSet.count();
        for(uint i=0; i<treasuryCount; i++) {
            address token = otherTokenSet.keyAtIndex(i);
            Asset storage a = assets[token];
            address oracle = a.oracle;
            (uint vaultBal, uint strategyBal) = getHoldings(token);
            (uint vaultInUsd, /* uint volatility */) = IOracle(oracle).read(token, vaultBal);
            (uint strategyInUsd, /* uint volatility */) = IOracle(oracle).read(token, strategyBal);
            vaultUsd += vaultInUsd;
            strategyUsd += strategyInUsd;
        }
    } 
}
