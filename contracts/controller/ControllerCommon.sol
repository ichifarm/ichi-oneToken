// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IController.sol";

abstract contract ControllerCommon is IController {

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Strategy Implementation"));

    /**
     * @dev Controllers must implement the periodic function which optionally does work.
     */
    
    function periodic() external virtual override {}  
        
    /**
     @notice OneTokenBase calls this when the controller is assigned. 
     */

    function init() external virtual override {}

}
