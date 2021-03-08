// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./IModule.sol";

interface IOracle is IModule {

    /// @notice returns usd conversion rate with 18 decimal precision

    function update() external;
    function read(uint amount) external view returns(uint amountOut, uint volatility);
    function amountRequired(uint amountUsd) external view returns(uint tokens, uint volatility);
}
