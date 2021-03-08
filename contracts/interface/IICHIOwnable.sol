// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

interface IICHIOwnable {
    function owner() external view returns (address);
    function renounceOwnership() external;
    function transferOwnership(address newOwner) external;
}
