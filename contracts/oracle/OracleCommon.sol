// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IOracle.sol";
import "../common/ICHIModuleCommon.sol";

abstract contract OracleCommon is IOracle, ICHIModuleCommon {

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Oracle Implementation"));
    address public override indexToken;
    string description;

    event OracleDeployed(address sender, string description, address indexToken);
    event OracleInitialized(address sender, address oneToken, address baseToken, address indexToken);
    
    constructor(string memory description_, address indexToken_) 
        ICHIModuleCommon(ModuleType.Oracle, description_) 
    { 
        description = description_;
        indexToken = indexToken_;
        emit OracleDeployed(msg.sender, description_, indexToken_);
    }

    function _initOracle(address baseToken_) internal {}

    // @dev We use internally-generated token pair keys to avoid external dependency
    function getPairKey(address baseToken, address client) public pure returns(bytes32) {
        return keccak256(abi.encodePacked(baseToken, client));
    }

}
