// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./IModule.sol";

interface IController is IModule {

    /**
     @notice OneTokenBase calls this on mint and redeem. The controller can perform arbitary 
     actions such as transferring funds to/from a strategy and executing strategy methods.
     */
    function periodic() external;
}
