// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IMintMaster.sol";
import "../ICHIModuleCommon.sol";

abstract contract MintMasterCommon is IMintMaster, ICHIModuleCommon{

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 MintMaster Implementation"));
    
    constructor(address oneToken_) 
        ICHIModuleCommon(ModuleType.MintMaster, oneToken_, NULL_ADDRESS) 
    { }

}
