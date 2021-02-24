// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "./InterfaceCommon.sol";

interface IOneTokenFactory is InterfaceCommon {
    
    function deployOneTokenProxy(
        address governance,
        address controller,
        address strategy, 
        address mintMaster, 
        /*address voterRoll, // has no internal impact here */               
        address memberToken, 
        address collateral,
        address version
    ) 
        external 
        returns(address newOneToken, address admin);

    // TODO: Consider dropping module storage in the hub

    function setOneTokenModuleParam(address oneToken, address foreignToken, ModuleType moduleType, bytes32 key, bytes32 value) external;
    function setOneTokenModuleParam(address foreignToken, ModuleType moduleType, bytes32 key, bytes32 value) external;

    function admitModule(address module, ModuleType moduleType, string memory name, string memory url) external;
    function updateModule(address module, string memory name, string memory url) external;
    function removeModule(address module) external;

    function admitForeignToken(address foreignToken, string memory name, string memory symbol, bool collateral, address oracle) external;
    function updateForeignToken(address foreignToken, string memory name, string memory symbol, bool collateral) external;
    function removeForeignToken(address foreignToken) external;

    function assignOracle(address foreignToken, address oracle) external;
    function removeOracle(address foreignToken, address oracle) external; 

    /**
     * View functions
     */

    function oneTokenCount() external view returns(uint);
    function oneTokenAtIndex(uint index) external view returns(address);
    function oneTokenInfo(address oneToken) external view returns(address);
    function isOneToken(address oneToken) external view returns(bool);
    function oneTokenModuleParam(address oneToken, address foreignToken, ModuleType moduleType, bytes32 key) external view returns(bytes32);

    // modules

    function moduleCount() external view returns(uint);
    function moduleAtIndex(uint index) external view returns(address module);
    function moduleInfo(address module) external view returns(string memory name, string memory url, ModuleType moduleType);
    function isModule(address module) external view returns(bool);
    function isValidModuleType(address module, ModuleType moduleType) external view returns(bool);

    // foreign tokens

    function foreignTokenCount() external view returns(uint);
    function foreignTokenAtIndex(uint index) external view returns(address);
    function foreignTokenInfo(address foreignToken) external view returns(string memory name, string memory symbol, bool collateral, uint oracleCount);
    function foreignTokenOracleCount(address foreignToken) external view returns(uint);
    function foreignTokenOracleAtIndex(address foreignToken, uint index) external view returns(address);
    function isOracle(address foreignToken, address oracle) external view returns(bool);
    function isForeignToken(address foreignToken) external view returns(bool);
    function isCollateral(address foreignToken) external view returns(bool);
}