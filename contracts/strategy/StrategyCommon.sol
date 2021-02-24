// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IStrategy.sol";

contract StrategyCommon is IModule {

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Strategy Implementation"));

}
