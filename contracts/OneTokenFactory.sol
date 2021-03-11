// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "./common/ICHICommon.sol";
import "./OneTokenProxy.sol";
import "./OneTokenProxyAdmin.sol";
import "./lib/AddressSet.sol";
import "./interface/IOneTokenFactory.sol";
import "./interface/IOneTokenV1.sol";
import "./interface/IModule.sol";
import "./_openzeppelin/access/Ownable.sol";

contract OneTokenFactory is IOneTokenFactory, ICHICommon {

    using AddressSet for AddressSet.Set;
    bytes constant NULL = "";

    /// @dev (token => moduleType => key) : value

    struct OneToken {
        address version;
        mapping(address => mapping(ModuleType => mapping(bytes32 => bytes32))) moduleParams;
    }

    AddressSet.Set oneTokenSet;
    mapping(address => OneToken) oneTokens;
    
    struct Module {
        string name;
        string url;
        ModuleType moduleType;
    }

    AddressSet.Set moduleSet;
    mapping(address => Module) public modules;

    /**
     * @dev a foreign token can be a collateral token, member token or other, e.g. LP token.
     * This whitelist ensures that no unapproved token contracts are interacted with. Only recognized
     * foreign tokens are included in internal treasury valuations. Foreign tokens must 
     * have at least one oracle and each oneToken instance must select exactly one approved oracle.    
     */
    
    struct ForeignToken {
        string name;
        string symbol;
        bool isCollateral;
        AddressSet.Set oracleSet;
    }

    AddressSet.Set foreignTokenSet;
    mapping(address => ForeignToken) foreignTokens;

    modifier onlyOneToken {
        require(oneTokenSet.exists(msg.sender), "OneTokenFactory: sender is not a oneToken");
        _;
    }

    /**
     * Events
     */
    
    event OneTokenProxyDeployed(address sender, address governance, address version, address newOneTokenProxy, address proxyAdmin);
    event OneTokenInitialized(address sender, address oneToken, address governance, address controller, address mintMaster, address memberToken, address collateral, address version);
    event SetOneTokenModuleParam(address sender, address oneToken, address foreignToken, ModuleType moduleType, bytes32 key, bytes32 value);    
    event ModuleAdmitted(address sender, address module, ModuleType moduleType, string name, string url);
    event ModuleUpdated(address sender, address module, string name, string url);
    event ModuleRemoved(address sender, address module);
    event ForeignTokenAdmitted(address sender, address foreignToken, string name, string symbol, bool isCollateral, address oracle);
    event ForeignTokenUpdated(address sender, address foreignToken, string name, string symbol, bool collateral);
    event ForeignTokenRemoved(address sender, address foreignToken);
    event AddOracle(address sender, address foreignToken, address oracle);
    event RemoveOracle(address sender, address foreignToken, address oracle);

    /**
     * Deploy a oneToken instance
     */

    function deployOneTokenProxy(address governance, address version) external onlyOwner override returns(address newOneTokenProxy, address proxyAdmin) {
        OneTokenProxyAdmin _admin = new OneTokenProxyAdmin();
        _admin.transferOwnership(governance);
        proxyAdmin = address(_admin);
        OneTokenProxy _proxy = new OneTokenProxy(version, address(proxyAdmin), NULL);
        newOneTokenProxy = address(_proxy);
        emit OneTokenProxyDeployed(msg.sender, governance, version, newOneTokenProxy, proxyAdmin);
    }

    function initOneTokenProxy(
        string memory name,
        string memory symbol,
        address oneToken,
        address governance,
        address controller,
        address mintMaster,              
        address memberToken, 
        address collateral,
        address oneTokenOracle,
        address version
    ) 
        external 
        onlyOwner 
        override
    {
        require(!oneTokenSet.exists(oneToken), "OneTokenFactory: oneToken already initialized");
        require(isValidModuleType(controller, InterfaceCommon.ModuleType.Controller), "OneTokenFactory: unknown controller");
        require(isValidModuleType(mintMaster, InterfaceCommon.ModuleType.MintMaster), "OneTokenFactory: unknown mint master");
        require(isValidModuleType(version, ModuleType.Version), "OneTokenFactory: unknown version");  
        require(isValidModuleType(oneTokenOracle, ModuleType.Oracle), "OneTokenFactory: unknown oneTokenOracle");
        require(foreignTokenSet.exists(memberToken), "OneTokenFactory: unknown member token");
        require(foreignTokenSet.exists(collateral), "OneTokenFactory: unknown collateral");
        require(foreignTokens[collateral].isCollateral, "OneTokenFactory: specified token is not recognized as collateral");

        IOneTokenV1 oneTokenProxy = IOneTokenV1(oneToken);
        oneTokenProxy.init(name, symbol, oneTokenOracle, controller, mintMaster, memberToken, collateral); 
        oneTokenProxy.transferOwnership(governance);
        oneTokenSet.insert(oneToken, "OneTokenFactory: Internal error registering initialized oneToken.");
        oneTokens[oneToken].version = version;
        emit OneTokenInitialized(msg.sender, oneToken, governance, controller, mintMaster, memberToken, collateral, version);
    }

    /**
     * Govern Modules
     */

    function admitModule(address module, ModuleType moduleType, string memory name, string memory url) external onlyOwner override {  
        moduleSet.insert(module, "OneTokenFactory, Set: module is already admitted.");
        emit ModuleAdmitted(msg.sender, module, moduleType, name, url);
        updateModule(module, name, url);
        modules[module].moduleType = moduleType;
    }

    function updateModule(address module, string memory name, string memory url) public onlyOwner override {
        require(moduleSet.exists(module), "OneTokenFactory, Set: unknown module");
        modules[module].name = name;
        modules[module].url = url;
        emit ModuleUpdated(msg.sender, module, name, url);    
    }

    function removeModule(address module) external onlyOwner override  {
        require(moduleSet.exists(module), "OneTokenFactory, Set: unknown module");
        delete modules[module];
        moduleSet.remove(module, "OneTokenFactory, Set: unknown module");
        emit ModuleRemoved(msg.sender, module);
    }

    /**
     * Govern foreign tokens
     */

    function admitForeignToken(address foreignToken, string memory name, string memory symbol, bool collateral, address oracle) external onlyOwner override {
        require(bytes(name).length > 0, "OneTokenFactory: name cannot be null");
        require(bytes(symbol).length > 0, "OneTokenFactory: symbol cannot be null");
        require(isValidModuleType(oracle, ModuleType.Oracle), "OneTokenFactory, Set: unknown oracle");
        foreignTokenSet.insert(foreignToken, "OneTokenFactory: foreign token is already admitted");
        ForeignToken storage f = foreignTokens[foreignToken];
        f.name = name;
        f.symbol = symbol;
        f.isCollateral = collateral;
        f.oracleSet.insert(oracle, "OneTokenFactory, Set: Internal error inserting oracle.");
        emit ForeignTokenAdmitted(msg.sender, foreignToken, name, symbol, collateral, oracle);
    }

    function updateForeignToken(address foreignToken, string memory name, string memory symbol, bool collateral) external onlyOwner override {
        require(bytes(name).length > 0, "OneTokenFactory: name cannot be null");
        require(bytes(symbol).length > 0, "OneTokenFactory: name cannot be null");
        require(foreignTokenSet.exists(foreignToken), "OneTokenFactory, Set: unknown foreign token");
        ForeignToken storage f = foreignTokens[foreignToken];
        f.name = name;
        f.symbol = symbol;
        f.isCollateral = collateral; 
        emit ForeignTokenUpdated(msg.sender, foreignToken, name, symbol, collateral);      
    }

    function removeForeignToken(address foreignToken) external onlyOwner override {
        require(foreignTokenSet.exists(foreignToken), "OneTokenFactory, Set: unknown foreign token");
        delete foreignTokens[foreignToken];
        foreignTokenSet.remove(foreignToken, "OneTokenfactory, Set: internal error removing foreign token");
        emit ForeignTokenRemoved(msg.sender, foreignToken);
    } 

    function assignOracle(address foreignToken, address oracle) external onlyOwner override {
        require(foreignTokenSet.exists(foreignToken), "OneTokenFactory: unknown foreign token");
        require(isValidModuleType(oracle, ModuleType.Oracle), "OneTokenFactory: Internal error checking oracle");
        foreignTokens[foreignToken].oracleSet.insert(oracle, "OneTokenFactory, Set: oracle is already assigned to foreign token.");
        emit AddOracle(msg.sender, foreignToken, oracle);
    }

    function removeOracle(address foreignToken, address oracle) external onlyOwner override {
        foreignTokens[foreignToken].oracleSet.remove(oracle, "OneTokenFactory, Set: oracle is not assigned to foreign token or unknown foreign token.");
        emit RemoveOracle(msg.sender, foreignToken, oracle);
    }   

    /**
     * View functions
     */

    function oneTokenCount() external view override returns(uint) { 
        return oneTokenSet.count(); 
    }
    function oneTokenAtIndex(uint index) external view override returns(address) { 
        return oneTokenSet.keyAtIndex(index); 
    }
    function oneTokenInfo(address oneToken) external view override returns(address) {
        return oneTokens[oneToken].version;
    }
    function isOneToken(address oneToken) external view override returns(bool) {
        return oneTokenSet.exists(oneToken);
    }

    // modules

    function moduleCount() external view override returns(uint) { 
        return moduleSet.count(); 
    }
    function moduleAtIndex(uint index) external view override returns(address module) { 
        return moduleSet.keyAtIndex(index); 
    }
    function moduleInfo(address module) external view override returns(string memory name, string memory url, ModuleType moduleType) {
        Module storage m = modules[module];
        name = m.name;
        url = m.url;
        moduleType = m.moduleType;
    }
    function isModule(address module) public view override returns(bool) {
        return moduleSet.exists(module);
    }
    function isValidModuleType(address module, ModuleType moduleType) public view override returns(bool) {
        IModule m = IModule(module);
        bytes32 candidateSelfDeclaredType = m.MODULE_TYPE();

        // Was it admitted?
        
        require(isModule(module), "OneTokenFactory, Set: unknown module");

        // Does the implementation claim to match the expected type? 

        if(moduleType == ModuleType.Controller) {
            require(candidateSelfDeclaredType == COMPONENT_CONTROLLER, "OneTokenFactory: candidate is not a version.");
        }        
        if(moduleType == ModuleType.Version) {
            require(candidateSelfDeclaredType == COMPONENT_VERSION, "OneTokenFactory: candidate is not a version.");
        }
        if(moduleType == ModuleType.Strategy) {
            require(candidateSelfDeclaredType == COMPONENT_STRATEGY, "OneTokenFactory: candidate is not a strategy.");
        }
        if(moduleType == ModuleType.MintMaster) {
            require(candidateSelfDeclaredType == COMPONENT_MINTMASTER, "OneTokenFactory: candidate is not a mintmaster.");
        }
        if(moduleType == ModuleType.Oracle) {
            require(candidateSelfDeclaredType == COMPONENT_ORACLE, "OneTokenFactory: candidate is not an oracle.");
        }
        if(moduleType == ModuleType.VoterRoll) {
            require(candidateSelfDeclaredType == COMPONENT_VOTERROLL, "OneTokenFactory: candidate is not a voterroll.");
        }
        return true;
    }    

    // foreign tokens

    function foreignTokenCount() external view override returns(uint) {
        return foreignTokenSet.count();
    }
    function foreignTokenAtIndex(uint index) external view override returns(address) {
        return foreignTokenSet.keyAtIndex(index);
    }
    function foreignTokenInfo(address foreignToken) external view override returns(string memory name, string memory symbol, bool collateral, uint oracleCount) {
        ForeignToken storage f = foreignTokens[foreignToken];
        name = f.name;
        symbol = f.symbol;
        collateral = f.isCollateral;
        oracleCount = f.oracleSet.count();
    }
    function foreignTokenOracleCount(address foreignToken) external view override returns(uint) {
        return foreignTokens[foreignToken].oracleSet.count();
    }
    function foreignTokenOracleAtIndex(address foreignToken, uint index) external view override returns(address) {
        return foreignTokens[foreignToken].oracleSet.keyAtIndex(index);
    }
    function isOracle(address foreignToken, address oracle) external view override returns(bool) {
        return foreignTokens[foreignToken].oracleSet.exists(oracle);
    }
    function isForeignToken(address foreignToken) external view override returns(bool) {
        return foreignTokenSet.exists(foreignToken);
    }
    function isCollateral(address foreignToken) external view override returns(bool) {
        return foreignTokens[foreignToken].isCollateral;
    }
}
