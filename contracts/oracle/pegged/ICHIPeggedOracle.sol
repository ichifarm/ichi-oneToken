// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../OracleCommon.sol";
import "../_uniswap/UniswapSlidingWindowOracle.sol"; // this could be an interface
import "../../_openzeppelin/access/Ownable.sol";

/**
 * @notice Separate ownable instances can be managed by separate governing authorities.
 * Immutable windowSize and granularity changes require a new oracle contract. 
 */

contract ICHIPeggedOracle is OracleCommon, Ownable {

    uint constant ONE_USD = 10 ** 18;
    
    constructor(address oneToken_) 
        OracleCommon(oneToken_)
    {
        // TODO: VALIDATE INPUTS
    }

    // record observation
    function update() external override {}

    // observe 
    function read(uint amount) public view override returns(uint amountOut, uint volatility) {
        this; // silence mutability warning
        amountOut = amount;
        volatility = 0;
    }

}
