// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./InterfaceCommon.sol";

interface IModule is InterfaceCommon {

    function MODULE_TYPE() external view returns(bytes32);
    function setParam(bytes32 key, bytes32 value) external;
    function getParam(bytes32 key) external view returns(bytes32);

}
