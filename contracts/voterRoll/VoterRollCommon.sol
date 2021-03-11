// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IVoterRoll.sol";
import "../common/ICHIModuleCommon.sol";

contract VoterRollCommon is IVoterRoll, ICHIModuleCommon {

    constructor(string memory description) 
        ICHIModuleCommon(ModuleType.VoterRoll, description)
    {} 
    
    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 VoterRoll Implementation"));

}
