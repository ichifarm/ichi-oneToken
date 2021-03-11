// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./IModule.sol";

interface IMintMaster is IModule {

    function init(address oneTokenOracle) external;
    function getMintingRatio() external view returns(uint ratio, uint maxOrderVolume);
    function getMintingRatio(address oneToken) external view returns(uint ratio, uint maxOrderVolume);    
    function updateMintingRatio() external returns(uint ratio, uint maxOrderVolume);
    function updateMintingRatio(address oneToken) external returns(uint ratio, uint maxOrderVolume);
}
