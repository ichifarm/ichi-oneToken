// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../OracleCommon.sol";
import "../../interface/IERC20Extended.sol";

/**
 * @notice Separate ownable instances can be managed by separate governing authorities.
 * Immutable windowSize and granularity changes require a new oracle contract. 
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
     * Support the normal initialization process and inspectable properties. 
     */
    function init(address baseToken) external override {
        require(IERC20Extended(baseToken).decimals() == IERC20Extended(indexToken).decimals(), "ICHIPeggedOracle: base and index tokens have different decimal precision.");
        _initOracle(baseToken);
        emit Initialized(msg.sender, baseToken, indexToken);
    }

    // record observation
    function update(address token) external override {
        /// @notice there is nothing to do
    }

    // observe 
    function read(address /* token */, uint amount) public view override returns(uint amountOut, uint volatility) {
        /// @notice it is always 1:1 with no volatility
        this; // silence mutability warning
        amountOut = amount;
        volatility = 0;
    }

    function amountRequired(address /* token */, uint amountUsd) external view override returns(uint tokens, uint volatility) {
        /// @notice it is always 1:1 with no volatility
        this; // silence visbility warning
        tokens = amountUsd;
        volatility = 0;      
    }



}
