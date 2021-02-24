// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../../interface/IOneTokenV1.sol";
import "./OneTokenV1Base.sol";

contract OneTokenV1 is IOneTokenV1, OneTokenV1Base {

    using AddressSet for AddressSet.Set;
    uint constant private PRECISION = 10 ** 18;
    
    bool foo; // TODO: remove me. I silence warnings.

    // hold withdrawals, resist flash loan attacks
    // collateral token => user => balance.
    mapping(address => mapping(address => uint)) public userBalances;

    event StrategyAllowanceSet(address sender, address token, uint amount);
    
    constructor (string memory name_, string memory symbol_ ) OneTokenV1Base(name_, symbol_) {}

    // @notice assumes infinite/sufficient colateral allowance 
    // draw from balance if possible

    function mint(address collateral, uint oneTokens, uint memberTokens) external override {
        // TODO: implementation (silence warning)
        collateral;
        oneTokens;
        memberTokens;
        IController(controller).periodic();
    }

    // @notice first grant allowance, then redeem

    function redeem(uint amount) external override {
        // TODO: implementation (silence warning)
        amount;
        IController(controller).periodic();
    }

    function setStrategyAllowance(address token, uint amount) external onlyOwner override {
        IERC20(token).approve(controller, amount);
        emit StrategyAllowanceSet(msg.sender, token, amount);
    }

    /**
     * View and active update functions 
     */

    function mintingRatio() public view override returns(uint ratio, uint maxOrderVolume) {
        return IMintMaster(mintMaster).getMintingRatio(0);
    }

    function _mintingRatio() internal returns(uint ratio, uint maxOrderVolume) {
        return IMintMaster(mintMaster).updateMintingRatio(0);
    }

    function collateralValue() public view override returns(uint) {

    }

    function _collateralValue() internal returns(uint) {
        foo = true; // TODO
        return collateralValue();
    }

    function treasuryValue() public view override returns(uint) {

    }

    function _treasuryValue() internal returns(uint) {
        foo = true; // TODO
        return treasuryValue();
    }    

    function getRate(address token) external view override returns(uint) {
        if(!assetSet.exists(token)) return 0;
        return 0;
    }

    function holdings(address token) public view override returns(uint vaultBalance, uint strategyBalance) {
        // @notice always return 0 strategy balance for unknown tokens
        IERC20 t = IERC20(token);
        vaultBalance = t.balanceOf(address(this));
        Asset storage a = assets[token];
        if(a.strategy != NULL_ADDRESS) strategyBalance = t.balanceOf(a.strategy);
    }

    function _holdings(address token) internal returns(uint vaultBalance, uint strategyBalance) {
        foo = true;
        return holdings(token);
    }
}
