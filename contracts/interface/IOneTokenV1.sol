// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "./IOneTokenV1Base.sol";

interface IOneTokenV1 is IOneTokenV1Base {

    function mint(address collateral, uint oneTokens, uint memberTokens) external;
    function redeem(uint amount) external;
    function setStrategyAllowance(address token, uint amount) external;

    /**
     * View functions 
     */

    function mintingRatio() external view returns(uint ratio, uint maxOrderVolume);
    function collateralValue() external view returns(uint);
    function treasuryValue() external view returns(uint);  
    function getRate(address token) external view returns(uint);
    function holdings(address token) external view returns(uint vaultBalance, uint strategyBalance);
}
