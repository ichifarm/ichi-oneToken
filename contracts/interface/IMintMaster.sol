// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./IModule.sol";

interface IMintMaster is IModule {
    
    function init(address oneTokenOracle) external;
    function updateMintingRatio() external returns(uint ratio, uint maxOrderVolume);
    function getMintingRatio() external view returns(uint ratio, uint maxOrderVolume);
    function getMintingRatio(address oneToken) external view returns(uint ratio, uint maxOrderVolume);    
}
