// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "./IOneTokenV1Base.sol";

interface IOneTokenV1 is IOneTokenV1Base {

    function withdraw(address token, uint amount) external;
    function mint(address collateral, uint oneTokens) external;
    function redeem(address collateral, uint amount) external;
    function updateMintingRatio() external returns(uint ratio, uint maxOrderVolume);
    /*
    function updateCollateralValue() external returns(uint);
    function updateTreasuryValue() external returns(uint);
    function updateHoldings(address token) external returns(uint vaultBalance, uint strategyBalance);
    */
    function userBalances(address, address) external view returns(uint);
    function userCreditBlocks(address, address) external view returns(uint);
    function getMintingRatio() external view returns(uint ratio, uint maxOrderVolume);
    function getCollateralValue() external view  returns(uint vaultUsd, uint strategyUsd);
    function getTreasuryValue() external view  returns(uint vaultUsd, uint strategyUsd);
    function getHoldings(address token) external view returns(uint vaultBalance, uint strategyBalance);
}
