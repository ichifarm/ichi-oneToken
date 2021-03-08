// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./IICHICommon.sol";
import "./InterfaceCommon.sol";

interface IModule is IICHICommon {
    function MODULE_TYPE() external view returns(bytes32);
    function moduleType() external view returns(ModuleType);
    function oneToken() external view returns(address);
    function foreignToken() external view returns(address);
    function init() external;
    function setParam(bytes32 key, bytes32 value) external;
    function getParam(bytes32 key) external view returns(bytes32);

}
