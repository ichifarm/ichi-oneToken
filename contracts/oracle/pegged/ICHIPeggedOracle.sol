// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../OracleCommon.sol";
import "../../interface/IERC20Extended.sol";

/**
 @notice Returns 1:1, scaled to the indexToken which is defined on deployment and cannot be changed post-deployment. 
 */

contract ICHIPeggedOracle is OracleCommon {

    constructor(address oneTokenFactory_, string memory description, address indexToken_)
        OracleCommon(oneTokenFactory_, description, indexToken_) {}

    /**
     @notice update is called when a oneToken wants to persist observations
     @dev there is nothing to do in this case
     */
    function update(address /* token */) external override {}

    /**
     @notice returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     @dev amountTokens:amountUsd is always 1:1, adjusted for normalized scale, and volatility is always 0
     @param amountTokens quantity, token native precision
     @param amountUsd US dollar equivalentm, precision 18
     @param volatility metric for future use-cases
     */
    function read(address token, uint256 amountTokens) external view override returns(uint256 amountUsd, uint256 volatility) {
        amountUsd = tokensToNormalized(token, amountTokens);
        volatility = 1;
    }

    /**
     @notice returns the tokens needed to reach a target usd value
     @dev token:usdToken is always 1:1 and volatility is always 1
     @param amountUsd Usd required, precision 18
     @param amountTokens tokens required, index token native precision
     @param volatility metric for future use-cases
     */
    function amountRequired(address token, uint256 amountUsd) external view override returns(uint256 amountTokens, uint256 volatility) {
        amountTokens = normalizedToTokens(token, amountUsd);
        volatility = 1;
    }
}
