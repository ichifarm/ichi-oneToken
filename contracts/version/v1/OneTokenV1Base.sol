// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../common/ICHICommon.sol";
import "../../oz_modified/ICHIERC20Burnable.sol";
import "../../lib/AddressSet.sol";
import "../../interface/IOneTokenFactory.sol";
import "../../interface/IOneTokenV1Base.sol";
import "../../interface/IController.sol";
import "../../interface/IStrategy.sol";
import "../../interface/IMintMaster.sol";
import "../../interface/IOracle.sol";

contract OneTokenV1Base is IOneTokenV1Base, ICHICommon, ICHIERC20Burnable {

    using AddressSet for AddressSet.Set;
    uint public constant override DEFAULT_ORACLE_FREQUENCY = 40; // blocks

    bytes32 public constant override MODULE_TYPE = keccak256(abi.encodePacked("ICHI OneToken Implementation"));

    address public override factory;
    address public override controller;
    address public override mintMaster;
    address public override memberToken;
    AddressSet.Set collateralTokenSet;
    AddressSet.Set otherTokenSet;

    struct Asset {
        address oracle;
        address strategy;
        uint strategyAllowance;
    }

    AddressSet.Set assetSet;
    mapping(address => Asset) public override assets;

    event Initialized(address sender, string name, string symbol, address controller, address mintMaster, address memberToken, address collateral);
    event ToStrategy(address sender, address strategy, address token, uint amount);
    event FromStrategy(address sender, address strategy, address token, uint amount);
    event ControllerChanged(address sender, address controller);
    event OracleChanged(address sender, address token, address oracle);
    event AssetRemoved(address sender, address token);
    event AssetAdded(address sender, address token, address oracle);
    event CloseStrategy(address sender, address token, bool success);
    event StrategySet(address sender, address token, address strategy);
    event StrategyRemoved(address sender, address token);
    event StategyClosed(address sender, address token);
    event CloseStrategy(address sender, address token, bool success, address strategy);
    event WithdrawnFromStrategy(address strategy, address token, uint amount);
    event StrategyAllowanceSet(address sender, address token, uint amount);
    event ParamSet(bytes32 key, bytes32 value);
    event ModuleParamSet(address token, ModuleType moduleType, bytes32 key, bytes32 value);

    modifier onlyOwnerOrController {
        if(msg.sender != owner()) {
            require(msg.sender == controller, "OneTokenV1Base: not owner or controller.");
        }
        _;
    }
    
    modifier onlyOwnerOrModule(Asset storage a, ModuleType moduleType) {
        if(msg.sender != owner()) 
            require(IOneTokenFactory(factory).isValidModuleType(msg.sender, moduleType), "OneTokenV1Base: module cannot update params for other module types.");
        require(
            msg.sender == owner() ||
            msg.sender == controller || 
            msg.sender == mintMaster ||
            msg.sender == a.oracle ||
            msg.sender == a.strategy, "OneTokenV1Base: not module or owner.");
        _;
    }

    function init(
        string memory name_,
        string memory symbol_,
        address oneTokenOracle_,
        address controller_, 
        address mintMaster_, 
        address memberToken_, 
        address collateral_
    ) 
        external 
        initializer 
        override 
    {
        factory = msg.sender; 
        initERC20(name_, symbol_);
        require(IOneTokenFactory(factory).isValidModuleType(controller_, InterfaceCommon.ModuleType.Controller), "OneTokenV1Base, Set: unknown controller");
        require(IOneTokenFactory(factory).isValidModuleType(mintMaster_, InterfaceCommon.ModuleType.MintMaster), "OneTokenV1Base, Set: unknown mint master");
        require(IOneTokenFactory(factory).isForeignToken(memberToken_), "OneTokenV1Base, Set: unknown member token");
        require(IOneTokenFactory(factory).isCollateral(collateral_), "OneTokenV1Base, Set: unknown collateral"); 
        require(memberToken_ != NULL_ADDRESS, "OneTokenV1Base: member token cannot be null");
        controller = controller_;
        mintMaster = mintMaster_;
        memberToken = memberToken_;

        collateralTokenSet.insert(collateral_, "OneTokenV1Base, Set: internal Error inserting first collateral");
        otherTokenSet.insert(memberToken_, "OneTokenV1Base, Set: internal Error inserting member token");

        assetSet.insert(collateral_, "OneTokenV1Base, Set: internal error inserting collateral token into assets.");
        assetSet.insert(memberToken_, "OneTokenV1Base, Set: internal error insert member token into assets.");

        Asset storage mt = assets[memberToken_];
        Asset storage ct = assets[collateral_];

        // default to the first oracle for each token given and set the default frequency. 
        // Override the default oracle selection with changeOracle and changeFrequency. 
        
        mt.oracle = IOneTokenFactory(factory).foreignTokenOracleAtIndex(memberToken_, 0);
        ct.oracle = IOneTokenFactory(factory).foreignTokenOracleAtIndex(collateral_, 0);

        // let the modules initialize if they need to

        IController(controller_).init();
        IMintMaster(mintMaster_).init(oneTokenOracle_);

        IOracle(oneTokenOracle_).init(address(this));
        IOracle(mt.oracle).init(memberToken_);
        IOracle(ct.oracle).init(collateral_);
        IOracle(oneTokenOracle_).update(address(this));
        IOracle(mt.oracle).update(memberToken);
        IOracle(ct.oracle).update(collateral_);

        // transfer governance to the deployer
        
        _transferOwnership(msg.sender);

        emit Initialized(msg.sender, name_, symbol_, controller_, mintMaster_, memberToken_, collateral_);
    }

    /**
     * Controller
     */

    function changeController(address controller_) external onlyOwner override {
        require(IOneTokenFactory(factory).isValidModuleType(controller, ModuleType.Controller), "OneTokenV1Base, Set: unknown controller");
        IController(controller_).init();
        controller = controller_;
        emit ControllerChanged(msg.sender, controller_);
    }       

    /**
     * Oracles
     */

    function changeOracle(address token, address oracle) external onlyOwner override {
        require(assetSet.exists(token), "OneTokenV1Base, Set: unknown token");
        require(IOneTokenFactory(factory).isOracle(token, oracle), "OneTokenV1Base, Set: unknown oracle");
        Asset storage a = assets[token];
        a.oracle = oracle;
        IOracle(oracle).init(token);
        IOracle(oracle).update(token);
        emit OracleChanged(msg.sender, token, oracle);
    }

    /**
     * Assets
     */

    function addAsset(address token, address oracle) external onlyOwner override {
        require(IOneTokenFactory(factory).isOracle(token, oracle), "OneTokenV1Base: unknown oracle or token");
        (/*string memory name*/, /*string memory symbol*/, bool isCollateral_, /*uint oracleCount*/) = IOneTokenFactory(factory).foreignTokenInfo(token);
        Asset storage a = assets[token];
        a.oracle = oracle;
        IOracle(oracle).init(token);
        IOracle(oracle).update(token);
        if(isCollateral_) {
            collateralTokenSet.insert(token, "OneTokenV1Base, Set: internal error inserting collateral");
        } else {
            otherTokenSet.insert(token, "OneTokenV1Base, Set: internal error inserting other token");
        }
        assetSet.insert(token, "OneTokenV1Base, Set: internal error inserting asset");
        emit AssetAdded(msg.sender, token, oracle);
    }

    function removeAsset(address token) external onlyOwner override {
        (uint inVault, uint inStrategy) = balances(token);
        require(inVault == 0, "OneTokenV1Base: cannot remove token with non-zero balance in the vault.");
        require(inStrategy == 0, "OneTokenV1Base: cannot remove asset with non-zero balance in the strategy.");
        require(assetSet.exists(token), "OneTokenV1Base: unknown token");
        if(collateralTokenSet.exists(token)) collateralTokenSet.remove(token, "OneTokenV1Base, Set: internal error removing collateral token");
        if(otherTokenSet.exists(token)) otherTokenSet.remove(token, "OneTokenV1Base, Set: internal error removing other token.");
        assetSet.remove(token, "OneTokenV1Base, Set: internal error removing asset.");
        delete assets[token];
        emit AssetRemoved(msg.sender, token);
    }

    /**
     * Strategies
     */

    function setStrategy(address token, address strategy) external onlyOwner override {
        _setStrategy(token, strategy);
        emit StrategySet(msg.sender, token, strategy);
    }

    function removeStrategy(address token) external onlyOwner override returns(bool success) {
        success = _closeStrategy(token);
        if(success) _setStrategy(token, NULL_ADDRESS);
        emit StrategyRemoved(msg.sender, token);
    }

    function closeStrategy(address token) external onlyOwnerOrController override returns(bool success) {
        success = _closeStrategy(token);
        emit StategyClosed(msg.sender, token);
    } 

    function _setStrategy(address token, address strategy) internal {
        require(assetSet.exists(token), "OneTokenV1Base, Set: unknown token");
        require(IOneTokenFactory(factory).isValidModuleType(strategy, ModuleType.Strategy), "OneTokenV1Base: unknown strategy");
        require(IStrategy(strategy).oneToken() == address(this), "OneTokenV1Base: cannot assign strategy that doesn't recognize this vault");
        require(IStrategy(strategy).owner() == owner(), "OneTokenV1Base: unknown strategy owner");
        IStrategy(strategy).setAllowance(token, INFINITE);
        Asset storage a = assets[token];
        if(a.strategy != NULL_ADDRESS) require(_closeStrategy(token), "OneTokenV1Base: failed to close current strategy");
        a.strategy = strategy;
        IStrategy(strategy).init();
        emit StrategySet(msg.sender, token, strategy);
    }

    function _closeStrategy(address token) internal returns(bool success) {
        require(assetSet.exists(token), "OneTokenV1Base, Set: unknown token");
        Asset storage a = assets[token];
        IStrategy s = IStrategy(a.strategy);
        if(a.strategy != address(0)) {
            success = s.closeAllPositions();   
        }
        emit CloseStrategy(msg.sender, token, success, address(s));
    }

    function toStrategy(address strategy, address token, uint amount) external onlyOwnerOrController {
        Asset storage a = assets[token];
        require(a.strategy == strategy, "OneTokenV1Base: not the token strategy");
        ICHIERC20Burnable(token).transfer(strategy, amount);
        emit ToStrategy(msg.sender, strategy, token, amount);
    }

    function fromStrategy(address strategy, address token, uint amount) external onlyOwnerOrController {
        Asset storage a = assets[token];
        require(a.strategy == strategy, "OneTokenV1Base: not the token strategy");
        IStrategy(strategy).toVault(token, amount);
        ICHIERC20Burnable(token).transfer(strategy, amount);
        emit FromStrategy(msg.sender, strategy, token, amount);
    }    

    /// @notice general-purpose stray funds recovery does not require a configured token strategy. Requires allowance.
    function withdrawFromStrategy(address strategy, address token, uint amount) external override onlyOwner {
        ICHIERC20Burnable(token).transfer(strategy, amount);
        emit WithdrawnFromStrategy(strategy, token, amount);
    }
    
    function setStrategyAllowance(address token, uint amount) external onlyOwnerOrController override {
        Asset storage a = assets[token];
        uint strategyCurrentBalance = IERC20(token).balanceOf(a.strategy);
        if(strategyCurrentBalance < amount) {
            IERC20(token).approve(controller, amount - strategyCurrentBalance);
        } else {
            IERC20(token).approve(controller, 0);
        }
        a.strategyAllowance = amount;
        emit StrategyAllowanceSet(msg.sender, token, amount);
    }    

    /**
     * View functions
     */

    function balances(address token) public view override returns(uint inVault, uint inStrategy) {
        IERC20 asset = IERC20(token);
        inVault = asset.balanceOf(address(this));
        inStrategy = asset.balanceOf(assets[token].strategy);
    } 
    function collateralTokenCount() external view override returns(uint) {
        return collateralTokenSet.count();
    }
    function collateralTokenAtIndex(uint index) external view override returns(address) {
        return collateralTokenSet.keyAtIndex(index);
    }
    function isCollateral(address token) external view override returns(bool) {
        return collateralTokenSet.exists(token);
    }

    function otherTokenCount() external view override returns(uint) {
        return otherTokenSet.count();
    }
    function otherTokenAtIndex(uint index) external view override returns(address) {
        return otherTokenSet.keyAtIndex(index);
    } 
    function isOtherToken(address token) external view override returns(bool) {
        return otherTokenSet.exists(token);
    } 

    function assetCount() external view override returns(uint) {
        return otherTokenSet.count();
    }
    function assetAtIndex(uint index) external view override returns(address) {
        return otherTokenSet.keyAtIndex(index);
    } 
    function isAsset(address token) external view override returns(bool) {
        return otherTokenSet.exists(token);
    }

}