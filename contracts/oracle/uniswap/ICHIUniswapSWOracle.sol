// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../OracleCommon.sol";
import "../_uniswap/UniswapSlidingWindowOracle.sol"; // this could be an interface
import "../../_openzeppelin/access/Ownable.sol";

/**
 * @notice Separate ownable instances can be managed by separate governing authorities.
 * Immutable windowSize and granularity changes require a new oracle contract. 
 */

contract ICHIUniswapSWOracle is OracleCommon, Ownable {

    address constant NULL_ADDRESS = address(0);
    address immutable public pair0;
    address immutable public pair1;
    address immutable public swOracle;
    
    constructor(address oneToken_, address pair0_, address pair1_, address swOracle_) 
        ICHIModuleCommon(ModuleType.Oracle, oneToken_, NULL_ADDRESS) 
    {
        // TODO: VALIDATE INPUTS
        pair0 = pair0_;
        pair1 = pair1_;
        swOracle = swOracle_;
    }

    // record observation
    function update() external override {
        UniswapSlidingWindowOracle(swOracle).update(pair0, pair1);
    }

    // observe 
    function read(uint amount) public view override returns(uint amountOut, uint volatility) {
        amountOut = UniswapSlidingWindowOracle(swOracle).consult(pair0, amount, pair1);
        volatility = 0;
    }

}
