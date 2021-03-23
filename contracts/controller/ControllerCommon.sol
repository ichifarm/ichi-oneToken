// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IController.sol";

abstract contract ControllerCommon is IController {

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Controller"));
    
    /**
     @notice oneToken implementations invoke periodic() to trigger periodic processes
     @dev wraps controller processes in oneToken transactions and may execute strategies
     */  
    function periodic() external virtual override {}  
        
    /**
     @notice OneTokenBase (msg.sender) calls this when the controller is assigned. 
     @dev Can initialize controller configuration, if needed.
     */
    function init() external virtual override {}

}
