// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../lib/AddressSet.sol";
import "../../interface/IOneTokenFactory.sol";
import "../../interface/IOneTokenV1Base.sol";
import "../../interface/IController.sol";
import "../../interface/IStrategy.sol";
import "../../interface/IMintMaster.sol";
import "../../interface/IOracle.sol";
import "../../ICHICommon.sol";
import "../../_openzeppelin/access/Ownable.sol";
import "../../_openzeppelin/proxy/Initializable.sol";
import "../../_openzeppelin/token/ERC20/ERC20Burnable.sol";

contract OneTokenV1Base is IOneTokenV1Base, ICHICommon, Ownable, Initializable, ERC20Burnable {

    using AddressSet for AddressSet.Set;
    address constant NULL_ADDRESS = address(0);
    uint public constant DEFAULT_ORACLE_FREQUENCY = 40; // blocks

    bytes32 public constant override MODULE_TYPE = keccak256(abi.encodePacked("ICHI OneToken Implementation"));

    IOneTokenFactory public factory;
    address public controller;
    address public mintMaster;
    address public memberToken;
    AddressSet.Set collateralTokenSet;
    AddressSet.Set otherTokenSet;

    struct Asset {
        address oracle;
        address strategy;
        uint assetToUsd;
        uint checkedBlock;
        uint checkFrequency;
    }

    AddressSet.Set assetSet;
    mapping(address => Asset) public assets;

    event Initialized(address intializer, address controller, address mintMaster, /*address voterRoll,*/ address memberToken, address collateral);
    event OracleChanged(address sender, address token, address oracle);
    event OracleFrequencyChanged(address sender, address token, uint frequency);
    event AssetRemoved(address sender, address token);
    event AssetAdded(address sender, address token, address oracle, uint frequency);
    event CloseStrategy(address sender, address token, bool success);
    event StrategySet(address sender, address token, address strategy);
    event StrategyRemoved(address sender, address token);
    event StategyClosed(address sender, address token);
    event CloseStrategy(address sender, address token, bool success, address strategy);
    event ParamSet(bytes32 key, bytes32 value);
    event ModuleParamSet(address foreignToken, ModuleType moduleType, bytes32 key, bytes32 value);
    event WithdrawnFromStrategy(address strategy, address token, uint amount);

    modifier onlyOwnerOrModule(Asset storage a, ModuleType moduleType) {
        if(msg.sender != owner()) 
            require(factory.isValidModuleType(msg.sender, moduleType), "OneTokenV1Base: module cannot update params for other module types.");
        require(
            msg.sender == owner() ||
            msg.sender == a.oracle ||
            msg.sender == a.strategy ||
            msg.sender == controller || 
            msg.sender == mintMaster, "OneTokenV1Base: not module or owner.");
        _;
    }

    constructor (string memory name_, string memory symbol_ ) ERC20( name_, symbol_) {}

    function init (address _controller, address _mintMaster, /*address _voterRoll,*/ address _memberToken, address _collateral) external initializer override {
        factory = IOneTokenFactory(msg.sender);      
        require(factory.isValidModuleType(_controller, InterfaceCommon.ModuleType.Controller), "OneTokenV1Base, Set: unknown controller");
        require(factory.isValidModuleType(_mintMaster, InterfaceCommon.ModuleType.MintMaster), "OneTokenV1Base, Set: unknown mint master");
        /*require(factory.isModuleType(_voterRoll, InterfaceCommon.ModuleType.VoterRoll), "unknown voter roll");*/
        require(factory.isForeignToken(_memberToken), "OneTokenV1Base, Set: unknown member token");
        require(factory.isCollateral(_collateral), "OneTokenV1Base, Set: unknown collateral");  
        controller = _controller;
        mintMaster = _mintMaster;
        /*voterRoll = _voterRoll;*/
        memberToken = _memberToken;

        collateralTokenSet.insert(_collateral, "OneTokenV1Base, Set: internal Error inserting first collateral");
        otherTokenSet.insert(_memberToken, "OneTokenV1Base, Set: internal Error inserting member token");

        assetSet.insert(_collateral, "OneTokenV1Base, Set: internal error inserting collateral token into assets.");
        assetSet.insert(_memberToken, "OneTokenV1Base, Set: internal error insert member token into assets.");

        Asset storage mt = assets[_memberToken];
        Asset storage ct = assets[_collateral];

        // default to the first oracle for each token given and set the default frequency. 
        // Override the defaults with changeOracle and changeFrequency. 

        mt.oracle = factory.foreignTokenOracleAtIndex(_memberToken, 0);
        mt.checkedBlock = 0;
        mt.assetToUsd = 0;
        mt.checkFrequency = DEFAULT_ORACLE_FREQUENCY;
        ct.oracle = factory.foreignTokenOracleAtIndex(_collateral, 0);
        ct.checkedBlock = 0;
        ct.assetToUsd = 0;
        ct.checkFrequency = DEFAULT_ORACLE_FREQUENCY;

        emit Initialized(msg.sender, _controller, _mintMaster, /*_voterRoll,*/ _memberToken, _collateral);
    }

    /**
     * Oracles
     */

    function changeOracle(address token, address oracle) external onlyOwner override {
        require(assetSet.exists(token), "OneTokenV1Base, Set: unknown token");
        require(factory.isOracle(token, oracle), "OneTokenV1Base, Set: unknown oracle");
        Asset storage a = assets[token];
        a.oracle = oracle;
        a.checkedBlock = 0;
        a.assetToUsd = 0;
        emit OracleChanged(msg.sender, token, oracle);
    }

    function changeFrequency(address token, uint frequency) external onlyOwner override {
        require(assetSet.exists(token), "OneTokenV1Base, Set: unknown token");
        Asset storage a = assets[token];
        a.checkFrequency = frequency;
        emit OracleFrequencyChanged(msg.sender, token, frequency);
    }

    /**
     * Assets
     */

    function addAsset(address token, address oracle, uint frequency) external {
        require(factory.isOracle(token, oracle), "OneTokenV1Base: unknown oracle or token");
        (/*string memory name*/, /*string memory symbol*/, bool isCollateral, /*uint oracleCount*/) = factory.foreignTokenInfo(token);
        Asset storage a = assets[token];
        a.checkFrequency = frequency;
        a.oracle = oracle;
        if(isCollateral) {
            collateralTokenSet.insert(token, "OneTokenV1Base, Set: internal error inserting collateral");
        } else {
            otherTokenSet.insert(token, "OneTokenV1Base, Set: internal error inserting other token");
        }
        assetSet.insert(token, "OneTokenV1Base, Set: internal error inserting asset");
        emit AssetAdded(msg.sender, token, oracle, frequency);
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
     * Strategy
     */

    function setStrategy(address token, address strategy) external onlyOwner override {
        require(factory.isValidModuleType(strategy, ModuleType.Strategy), "OneTokenV1Base: unknown strategy");
        _setStrategy(token, strategy);
        emit StrategySet(msg.sender, token, strategy);
    }

    function removeStrategy(address token) external onlyOwner override returns(bool success) {
        success = _closeStrategy(token);
        if(success) _setStrategy(token, NULL_ADDRESS);
        emit StrategyRemoved(msg.sender, token);
    }

    function closeStrategy(address token) external onlyOwner override returns(bool success) {
        success = _closeStrategy(token);
        emit StategyClosed(msg.sender, token);
    }  

    function _setStrategy(address token, address strategy) internal {
        require(assetSet.exists(token), "OneTokenV1Base, Set: unknown token");
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

    /**
     * Parameters
     */

    // @notice set a persistent parameter for ModuleType.Version (this) in the factory

    function setParam(bytes32 key, bytes32 value) external onlyOwner override {
        factory.setOneTokenModuleParam(address(0), ModuleType.Version, key, value);
        emit ParamSet(key, value);
    }

    // @notice set a persistent parameter for a moduleType, by token (the requester) in the factory

    function setModuleParam(address foreignToken, ModuleType moduleType, bytes32 key, bytes32 value) external onlyOwnerOrModule(assets[foreignToken], moduleType) override {
        factory.setOneTokenModuleParam(foreignToken, moduleType, key, value);
        emit ModuleParamSet(foreignToken, moduleType, key, value);
    }

    // @notice general-purpose stray funds recovery does not require configured token strategy. Strategy checks permission.
    function withdrawFromStrategy(address strategy, address token, uint amount) external onlyOwner {
        IStrategy(strategy).toVault(token, amount);
        emit WithdrawnFromStrategy(strategy, token, amount);
    }

    /**
     * View functions
     */

    function balances(address token) public view returns(uint inVault, uint inStrategy) {
        IERC20 a = IERC20(token);
        inVault = a.balanceOf(address(this));
        inStrategy = a.balanceOf(assets[token].strategy);
    } 
    
    function collateralTokenCount() public view override returns(uint) {
        return collateralTokenSet.count();
    }
    function collateralTokenAtIndex(uint index) public view override returns(address) {
        return collateralTokenSet.keyAtIndex(index);
    }

    function otherTokenCount() public view override returns(uint) {
        return otherTokenSet.count();
    }
    function otherTokenAtIndex(uint index) public view override returns(address) {
        return otherTokenSet.keyAtIndex(index);
    }  

    function assetCount() public view override returns(uint) {
        return otherTokenSet.count();
    }
    function assetAtIndex(uint index) public view override returns(address) {
        return otherTokenSet.keyAtIndex(index);
    } 

    function getParam(bytes32 key) external view override returns(bytes32) {
        return factory.oneTokenModuleParam(address(0), address(this), ModuleType.Version, key);
    }

}