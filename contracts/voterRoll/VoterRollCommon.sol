// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IVoterRoll.sol";
import "../ICHIModuleCommon.sol";

contract VoterRollCommon is IVoterRoll, ICHIModuleCommon {

    constructor(address oneToken_) 
        ICHIModuleCommon(ModuleType.VoterRoll, oneToken_, NULL_ADDRESS)
    {} 
    
    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 VoterRoll Implementation"));

}
