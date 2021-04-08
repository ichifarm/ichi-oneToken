// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../OracleCommon.sol";
import "../../interface/IERC20Extended.sol";

/**
 @notice Returns 1:1 in all cases for any pair and any observer. No governable functions. 
 */

contract ICHIPeggedOracle is IOracle, OracleCommon {

    event Deployed(address sender);
    event Initialized(address sender, address baseToken, address indexToken);

    constructor(string memory description, address indexToken_)
        OracleCommon(description, indexToken_)
    {
        emit Deployed(msg.sender);
    }

    /**
     @notice intialization is called when a oneToken appoints an Oracle
     @dev there is nothing to do in this case
     */
    function init(address /* baseToken */) external override {}

    /**
     @notice update is called when a oneToken wants to persist observations
     @dev there is nothing to do in this case
     */
    function update(address /* token */) external override {}

    /**
     @notice returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     @dev token:usdToken is always 1:1 and volatility is always 0
     */
    function read(address /* token */, uint amount) public view override returns(uint amountOut, uint volatility) {
        /// @notice it is always 1:1 with no volatility
        this; // silence mutability warning
        amountOut = amount;
        volatility = 0;
    }

    /**
     @notice returns the tokens needed to reach a target usd value
     @dev token:usdToken is always 1:1 and volatility is always 0
     */
    function amountRequired(address /* token */, uint amountUsd) external view override returns(uint tokens, uint volatility) {
        /// @notice it is always 1:1 with no volatility
        this; // silence mutability warning
        tokens = amountUsd;
        volatility = 0;
    }
}
