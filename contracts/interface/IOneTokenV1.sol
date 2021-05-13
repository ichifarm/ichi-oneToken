// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "./IOneTokenV1Base.sol";

interface IOneTokenV1 is IOneTokenV1Base {

    function mintingFee() external view returns(uint256);
    function redemptionFee() external view returns(uint256);
    // function withdraw(address token, uint256 amount) external;
    function mint(address collateral, uint256 oneTokens) external;
    function redeem(address collateral, uint256 amount) external;
    function setMintingFee(uint256 fee) external;
    function setRedemptionFee(uint256 fee) external;
    function updateMintingRatio(address collateralToken) external returns(uint256 ratio, uint256 maxOrderVolume);
    // function userBalances(address, address) external view returns(uint256);
    // function userCreditBlocks(address, address) external view returns(uint256);
    function getMintingRatio(address collateralToken) external view returns(uint256 ratio, uint256 maxOrderVolume);
    function getHoldings(address token) external view returns(uint256 vaultBalance, uint256 strategyBalance);
}
