// SPDX-License-Identifier: GNU

/// @notice adapted from https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol

pragma solidity 0.7.6;

import "../OracleCommon.sol";
import "../../_openzeppelin/math/SafeMath.sol";
import '../../_uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '../../_uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '../../_uniswap/lib/contracts/libraries/FixedPoint.sol';
import '../../_uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol';
import '../../_uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';

// fixed window oracle that recomputes the average price for the entire period once every period
// note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period
contract UniswapOracleSimple is OracleCommon {
    using FixedPoint for *;
    using SafeMath for uint;

    uint public constant PERIOD = 24 hours;

    IUniswapV2Pair immutable pair;
    address public immutable token0;
    address public immutable token1;

    uint    public price0CumulativeLast;
    uint    public price1CumulativeLast;
    uint32  public blockTimestampLast;
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    constructor(address factory, address oneToken_, address foreignToken_, address usdToken_)
        OracleCommon(oneToken_, foreignToken_, usdToken_)
    {
        address tokenA = foreignToken_;
        address tokenB = usdToken_;
        IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, tokenA, tokenB));
        pair = _pair;
        token0 = _pair.token0();
        token1 = _pair.token1();
        price0CumulativeLast = _pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)
        price1CumulativeLast = _pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = _pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, 'ExampleOracleSimple: NO_RESERVES'); // ensure that there's liquidity in the pair
    }

    function read(uint amountIn) external view override returns(uint amountUsd, uint volatility) {
        amountUsd = consult(foreignToken, amountIn);
        volatility = 0;
    }

    // @dev inverse conversion, tokens 
    function amountRequired(uint amountUsd) external view override returns(uint tokens, uint volatility) {
        tokens = PRECISION.div(consult(foreignToken, amountUsd));
        volatility = 0;
    }

    // @dev it is permissible for anyone to supply gas and update the oracle's price history.

    function update() external override {
        (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update
        ///@ dev require dropped for if() to make this safe to call when unsure about elapsed time

        if(timeElapsed >= PERIOD) {
            // overflow is desired, casting never truncates
            // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
            price0Average = FixedPoint.uq112x112(uint224((price0Cumulative - price0CumulativeLast) / timeElapsed));
            price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - price1CumulativeLast) / timeElapsed));

            price0CumulativeLast = price0Cumulative;
            price1CumulativeLast = price1Cumulative;
            blockTimestampLast = blockTimestamp;
        }
    }

    // note this will always return 0 before update has been called successfully for the first time.
    // this will return an average over a long period of time unless someone calls the update() function.

    function consult(address token, uint amountIn) public view returns (uint amountOut) {
        if (token == token0) {
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            require(token == token1, 'ExampleOracleSimple: INVALID_TOKEN');
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }
}