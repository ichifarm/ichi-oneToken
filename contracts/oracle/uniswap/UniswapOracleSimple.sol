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

    uint public immutable PERIOD;
    address public immutable usdToken;
    address public immutable uniswapFactory;

    struct Pair {
        address token0;
        address token1;
        uint    price0CumulativeLast;
        uint    price1CumulativeLast;
        uint32  blockTimestampLast;
        uint    period;
        FixedPoint.uq112x112 price0Average;
        FixedPoint.uq112x112 price1Average;
    }

    mapping(address => Pair) pairs;

    event Deployed(address sender, address uniswapFactory, address usdToken);
    event Initialized(address sender, address token);

    /**
     @notice the usdToken (index token), averaging period and uniswapfactory cannot be changed post-deployment
     @dev deploy multiple instances to support different configurations
     @param uniswapFactory_ external factory contract needed by the uniswap library
     @param usdToken_ the collateral token to use for usd valuations
     @param period_ the averaging period to use for price smoothing
     */
    constructor(address uniswapFactory_, address usdToken_, uint period_)
        OracleCommon("ICHI Simple Uniswap Oracle, 15 minutes", usdToken_)
    {
        uniswapFactory = uniswapFactory_;
        PERIOD = period_;
        usdToken = usdToken_;
        emit Deployed(msg.sender, uniswapFactory_, usdToken_);
    }

    /**
     @notice configures parameters for a pair, token versus indexToken
     @dev initializes the first time, then does no work
     @param token the base token. index is established at deployment time and cannot be changed
     */
    function init(address token) public override {
        _initOracle(token); 
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

    /**
     @notice returns equivalent indexTokens for amountIn, token
     @dev index token is established at deployment time
     @param token baseToken for comparison
     @param amountIn amount to convert
     */
    function read(address token, uint amountIn) external view override returns(uint amountUsd, uint volatility) {
        amountUsd = consult(token, amountIn);
        volatility = 0;
    }

    /**
     @notice returns equivalent baseTokens for amountUsd, indexToken
     @dev index token is established at deployment time
     @param token baseToken for comparison
     @param amountUsd amount to convert
     */
    function amountRequired(address token, uint amountUsd) external view override returns(uint tokens, uint volatility) {
        tokens = PRECISION.div(consult(token, amountUsd));
        volatility = 0;
    }

    /**
     @notice updates price history observation historym if necessary
     @dev it is permissible for anyone to supply gas and update the oracle's price history.
     @param token baseToken to update
     */
    function update(address token) external override {
        IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(uniswapFactory, token, usdToken));
        Pair storage p = pairs[address(_pair)];
        (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(_pair));
        uint32 timeElapsed = blockTimestamp - p.blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update
        ///@ dev require() was dropped in favor of if() to make this safe to call when unsure about elapsed time

        if(timeElapsed >= p.period) {
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
    /**
     @notice returns equivalent indexTokens for amountIn, token
     @dev always returns 0 before update(token) has been called successfully for the first time.
     @param token baseToken to update
     @param amountIn amount to convert
     */
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