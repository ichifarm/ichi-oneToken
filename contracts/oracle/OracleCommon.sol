// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IOracle.sol";
import "../ICHIModuleCommon.sol";
import "../_openzeppelin/proxy/Initializable.sol";

abstract contract OracleCommon is IOracle, ICHIModuleCommon, Initializable {

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Oracle Implementation"));
    address immutable public baseToken;
    address immutable public indexToken;

    event OracleDeployed(address sender, address oneToken, address pair0, address pair1);
    event OracleInitialized(address sender, address oneToken, address baseToken, address indexToken);
    
    constructor(address oneToken_, address foreignToken_, address indexToken_) 
        ICHIModuleCommon(ModuleType.Oracle, oneToken_, foreignToken_) 
    { 
        baseToken = foreignToken_;
        indexToken = indexToken_;
        emit OracleDeployed(msg.sender, oneToken_, foreignToken_, indexToken_);
    }

}
