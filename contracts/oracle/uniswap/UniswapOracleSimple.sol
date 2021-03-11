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

    // TODO: Optimal period? Multiple instances? 
    uint public constant PERIOD = 3 hours;

    address public usdToken;
    address public uniswapFactory;

    struct Pair {
        // address pair;
        address token0;
        address token1;
        uint    price0CumulativeLast;
        uint    price1CumulativeLast;
        uint32  blockTimestampLast;
        FixedPoint.uq112x112 price0Average;
        FixedPoint.uq112x112 price1Average;
    }

    mapping(address => Pair) pairs;

    event Deployed(address sender, address uniswapFactory, address usdToken);
    event Initialized(address sender, address token);

    constructor(address uniswapFactory_, address usdToken_)
        OracleCommon("ICHI Simple Uniswap Oracle, 3 hours", usdToken_)
    {
        uniswapFactory = uniswapFactory;
        usdToken = usdToken_;
        emit Deployed(msg.sender, uniswapFactory_, usdToken_);
    }

    /// @dev It is acceptable for multiple oneToken clients to rely on the same pair oracle. Initialize the first time.
    /// There is no oneToken/client level configuration. 
    
    function init(address token) public override {
        IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(uniswapFactory, token, usdToken));
        if(address(_pair) != NULL_ADDRESS) {
            Pair storage p = pairs[address(_pair)];
            p.token0 = _pair.token0();
            p.token1 = _pair.token1();
            p.price0CumulativeLast = _pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)
            p.price1CumulativeLast = _pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
            uint112 reserve0;
            uint112 reserve1;
            (reserve0, reserve1, p.blockTimestampLast) = _pair.getReserves();
            require(reserve0 != 0 && reserve1 != 0, 'UniswapOracleSimple: NO_RESERVES'); // ensure that there's liquidity in the pair
            emit Initialized(msg.sender, token);
        }
    }

    function read(address token, uint amountIn) external view override returns(uint amountUsd, uint volatility) {
        amountUsd = consult(token, amountIn);
        volatility = 0;
    }

    // @dev inverse conversion, tokens 
    function amountRequired(address token, uint amountUsd) external view override returns(uint tokens, uint volatility) {
        tokens = PRECISION.div(consult(token, amountUsd));
        volatility = 0;
    }

    // @dev it is permissible for anyone to supply gas and update the oracle's price history.

    function update(address token) external override {
        IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(uniswapFactory, token, usdToken));
        Pair storage p = pairs[address(_pair)];
        (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(_pair));
        uint32 timeElapsed = blockTimestamp - p.blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update
        ///@ dev require() was dropped in favor of if() to make this safe to call when unsure about elapsed time

        if(timeElapsed >= PERIOD) {
            // overflow is desired, casting never truncates
            // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
            p.price0Average = FixedPoint.uq112x112(uint224((price0Cumulative - p.price0CumulativeLast) / timeElapsed));
            p.price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - p.price1CumulativeLast) / timeElapsed));

            p.price0CumulativeLast = price0Cumulative;
            p.price1CumulativeLast = price1Cumulative;
            p.blockTimestampLast = blockTimestamp;
        }
        // No event emitter to save gas
    }

    // note this will always return 0 before update has been called successfully for the first time.
    // this will return an average over a long period of time unless someone calls the update() function.

    function consult(address token, uint amountIn) public view returns (uint amountOut) {
        IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(uniswapFactory, token, usdToken));
        Pair storage p = pairs[address(_pair)];
        if (token == p.token0) {
            amountOut = p.price0Average.mul(amountIn).decode144();
        } else {
            require(token == p.token1, 'UniswapOracleSimple: INVALID_TOKEN');
            amountOut = p.price1Average.mul(amountIn).decode144();
        }
    }
}