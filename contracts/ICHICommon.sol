// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./ICHIOwnable.sol";
import "./interface/IERC20Extended.sol";
import "./interface/IICHICommon.sol";

contract ICHICommon is IICHICommon, ICHIOwnable {

    uint constant internal PRECISION = 10 ** 18;
    uint constant internal INFINITE = uint(0-1);
    
    // @dev internal fingerprints help prevent deployment-time governance errors

    bytes32 constant COMPONENT_CONTROLLER = keccak256(abi.encodePacked("ICHI Controller"));
    bytes32 constant COMPONENT_VERSION = keccak256(abi.encodePacked("ICHI OneToken Implementation"));
    bytes32 constant COMPONENT_STRATEGY = keccak256(abi.encodePacked("ICHI V1 Strategy Implementation"));
    bytes32 constant COMPONENT_MINTMASTER = keccak256(abi.encodePacked("ICHI V1 MintMaster Implementation"));
    bytes32 constant COMPONENT_ORACLE = keccak256(abi.encodePacked("ICHI V1 Oracle Implementation"));
    bytes32 constant COMPONENT_VOTERROLL = keccak256(abi.encodePacked("ICHI V1 VoterRoll Implementation"));

}
