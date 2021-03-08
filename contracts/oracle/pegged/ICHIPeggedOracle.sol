// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../OracleCommon.sol";

/**
 * @notice Separate ownable instances can be managed by separate governing authorities.
 * Immutable windowSize and granularity changes require a new oracle contract. 
 */

contract ICHIPeggedOracle is IOracle, OracleCommon {

    uint constant ONE_USD = 10 ** 18;

    event Deployed(address sender, address oneToken);
    
    constructor(address oneToken_, address pair0_, address pair1_) 
        OracleCommon(oneToken_, pair0_, pair1_) 
    {
        require(oneToken_ != NULL_ADDRESS, "ICHIPeggedOracle: oneToken address cannot be null");
        emit Deployed(msg.sender, oneToken_);
    }

    // record observation
    function update() external override {
        /// @notice there is nothing to do
    }

    // observe 
    function read(uint amount) public view override returns(uint amountOut, uint volatility) {
        /// @notice it is always 1:1 with no volatility
        this; // silence mutability warning
        amountOut = amount;
        volatility = 0;
    }

    function amountRequired(uint amountUsd) external view override returns(uint tokens, uint volatility) {
        /// @notice it is always 1:1 with no volatility
        this; // silence mutability warning
        tokens = amountUsd;
        volatility = 0;        
    }

}
