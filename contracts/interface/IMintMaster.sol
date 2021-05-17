// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "./IModule.sol";

interface IMintMaster is IModule {
    
    function oneTokenOracles(address) external view returns(address);
    function init(address oneTokenOracle) external;
    function updateMintingRatio(address collateralToken) external returns(uint256 ratio, uint256 maxOrderVolume);
    function getMintingRatio(address collateral) external view returns(uint256 ratio, uint256 maxOrderVolume);
    function getMintingRatio2(address oneToken, address collateralToken) external view returns(uint256 ratio, uint256 maxOrderVolume);  
    function getMintingRatio4(address oneToken, address oneTokenOracle, address collateralToken, address collateralOracle) external view returns(uint256 ratio, uint256 maxOrderVolume); 
}
