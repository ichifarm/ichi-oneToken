// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

interface IController {

    function MODULE_TYPE() external view returns(bytes32);
    function init() external;
    function periodic() external;

}
