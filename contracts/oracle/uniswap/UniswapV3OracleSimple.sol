// SPDX-License-Identifier: GNU

pragma solidity 0.7.6;

import "../OracleCommon.sol";
import "../../lib/AddressSet.sol";
import "../../_openzeppelin/math/SafeMath.sol";
import '../../_uniswap_v3/v3-periphery/contracts/libraries/OracleLibrary.sol';
import '../../_uniswap_v3/v3-periphery/contracts/libraries/PoolAddress.sol';
import '../../_uniswap_v3/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '../../_uniswap_v3/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import '../../lib/SafeUint128.sol';

/**
 @notice A oracle based on Uniswap V3 pools that checks spot price and a specified TWAP period and uses the lower of the 2 values.
 The oracle supports one hop routes (token/indexToken) and two hops routes (token/ETH - ETH/indexToken). 
 Note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period,
 Periodicity and Uniswap V3 pool fee setting are passed along during the token's registration. 
 Index token (usually a USD token) and Uniswap V3 ETH/indexToken pool fee setting are fixed at deployment time.
 A single deployment can be shared by multiple oneToken clients and can observe multiple base tokens.
 Non-USD index tokens are possible. Such deployments can be used as interim oracles in Composite Oracles. They should
 NOT be registered in the Factory because they are not, by definition, valid sources of USD quotes.  
 Example calculation MPH/ETH -> ETH/USD spot and MPH/ETH -> ETH/USD 24hr take the lower value and return.  This is a safety net to help 
 prevent price manipulation.
 For the ETH/indexToken pool only the spot price is checked. TWAP is used only for token/ETH and token/indexToken pools.
 */

contract UniswapV3OracleSimple is OracleCommon {

    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant UNI_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

    using AddressSet for AddressSet.Set;

    address public immutable uniswapFactory;
    uint24 public immutable ethPoolFee;

    struct Settings {
        bool oneStep;
        uint32 period;
        uint24 poolFee;
    }

    // token address => Settings
    // Settings.oneStep flag specifies whether it's one step or two step oracle (with ETH as an intermetiatery)
    // Settings.poolFee is used to select between available V3 pools for the token
    // Settings.period value (in seconds) specifies desired time period for TWAP obsersation
    // If Setting.period == 0, only spot price is used
    mapping(address => Settings) public registeredTokens; 
    // iterable key set with delete
    AddressSet.Set registeredTokensSet;

    event RegisterToken(address sender, address token, bool oneStep, uint32 period, uint24 poolFee);
    event ReregisterToken(address sender, address token, bool oneStep, uint32 period, uint24 poolFee);
    event UnregisterToken(address sender, address token);

    /**
     @notice the indexToken (index token), averaging period and uniswapfactory cannot be changed post-deployment
     @dev deploy multiple instances to support different configurations
     @param oneTokenFactory_ oneToken factory to bind to
     @param uniswapFactory_ external factory contract needed by the uniswap V3 library
     @param indexToken_ the index token to use for valuations. If not a usd collateral token then the Oracle should not be registered in the factory but it can be used by CompositeOracles.
     @param ethPoolFee_ fee setting for ETH/indexToken uniswap V3 pool to be used by this oracle. Main options: 10000, 3000 and 500 (1%, 0.3%. 0.05%)
     */
    constructor(
        address oneTokenFactory_, 
        address uniswapFactory_, 
        address indexToken_, 
        uint24 ethPoolFee_)
    OracleCommon(
        oneTokenFactory_, 
        "ICHI Simple Uniswap V3 Oracle", 
        indexToken_)
    {
        require(uniswapFactory_ != NULL_ADDRESS, "UniswapV3OracleSimple: uniswapFactory cannot be empty");
        require(ethPoolFee_ > 0, "UniswapV3OracleSimple: ethPoolFee must be > 0");
        uniswapFactory = uniswapFactory_;
        indexToken = indexToken_;
        ethPoolFee = ethPoolFee_;
    }

    /**
     @notice checks is the oracle is ready to be used with the base token, If yes, emits OracleInitialized event
     @dev initialized from the Factory when assigned to an asset.
     @param token the base token. index is established at deployment time and cannot be changed
     */
    function init(address token) external onlyModuleOrFactory override {
        require(registeredTokensSet.exists(token), "UniswapV3OracleSimple: token must be registered with the Oracle before it's iniialized from the Factory");
        emit OracleInitialized(msg.sender, token, indexToken);
    }

    /**
     @notice returns equivalent indexTokens for amountIn, token
     @dev index token is established at deployment time
     @param token ERC20 token
     @param amountTokens quantity, token precision
     @param amountUsd US dollar equivalent, precision 18
     @param volatility metric for future use-cases 
     */
    function read(address token, uint256 amountTokens) external view override returns(uint256 amountUsd, uint256 volatility) {
        amountUsd = tokensToNormalized(indexToken, consult(token, amountTokens));
        volatility = 1;
    }

    /**
     @notice returns equivalent baseTokens for amountUsd, indexToken
     @dev index token is established at deployment time
     @param token ERC20 token
     @param amountTokens quantity, token precision
     @param amountUsd US dollar equivalent, precision 18
     @param volatility metric for future use-cases
     */
    function amountRequired(address token, uint256 amountUsd) external view override returns(uint256 amountTokens, uint256 volatility) {
        require(registeredTokensSet.exists(token), "UniswapV3OracleSimple: unknown token");

        Settings storage s = registeredTokens[token];
        /*
        if (s.oneStep) {
            ( amountTokens, volatility ) = amountRequiredOneStep(token, amountUsd, s.period, s.poolFee);
        } else {
            ( amountTokens, volatility ) = amountRequiredTwoSteps(token, amountUsd, s.period, s.poolFee);
        }
        */
        amountTokens = (s.oneStep) ?
            amountRequiredOneStep (token, amountUsd, s.period, s.poolFee) :
            amountRequiredTwoSteps(token, amountUsd, s.period, s.poolFee);
    }

    /**
     @notice returns equivalent baseTokens for amountUsd, indexToken. Uses one step route (indexToken/token)
     @dev index token is established at deployment time
     @param token ERC20 token
     @param amountTokens quantity, token precision
     @param amountUsd US dollar equivalent, precision 18
     @param poolFee used to select between avaulable V3 pools for the token
     @param period value (in seconds) specifies desired time period for TWAP obsersation
     @param volatility metric for future use-cases
     */
    function amountRequiredOneStep(address token, uint256 amountUsd, uint32 period, uint24 poolFee) internal view returns(uint256 amountTokens, uint256 volatility) {
        uint256 p1Tokens = 0;
        uint256 p2Tokens = 0;
        amountUsd = normalizedToTokens(indexToken, amountUsd);
        address pool = PoolAddress.computeAddress(uniswapFactory, PoolAddress.getPoolKey(indexToken, token, poolFee));
        int24 tick = poolValues(pool);
        p1Tokens = _fetchSpot(indexToken, token, tick, amountUsd);
        p2Tokens = (period > 0) ? _fetchTwap(pool, indexToken, token, period, amountUsd) : p1Tokens;
        amountTokens = (p1Tokens > p2Tokens) ? p1Tokens: p2Tokens;
        volatility = 1;
    }

    /**
     @notice returns equivalent baseTokens for amountUsd, indexToken. Uses two steps route (indexToken/ETH - ETH/token)
     @dev index token is established at deployment time
     @param token ERC20 token
     @param amountTokens quantity, token precision
     @param amountUsd US dollar equivalent, precision 18
     @param poolFee used to select between avaulable V3 pools for the token
     @param period value (in seconds) specifies desired time period for TWAP obsersation
     @param volatility metric for future use-cases
     */
    function amountRequiredTwoSteps(address token, uint256 amountUsd, uint32 period, uint24 poolFee) internal view returns(uint256 amountTokens, uint256 volatility) {
        uint256 p1Tokens = 0;
        uint256 p2Tokens = 0;
        amountUsd = normalizedToTokens(indexToken, amountUsd);
        address pool = PoolAddress.computeAddress(uniswapFactory, PoolAddress.getPoolKey(indexToken, WETH, ethPoolFee));
        int24 tick = poolValues(pool);
        uint256 amountTokensStepOne = _fetchSpot(indexToken, WETH, tick, amountUsd);
        pool = PoolAddress.computeAddress(uniswapFactory, PoolAddress.getPoolKey(WETH, token, poolFee));
        tick = poolValues(pool);
        p1Tokens = _fetchSpot(WETH, token, tick, amountTokensStepOne);
        p2Tokens = (period > 0) ? _fetchTwap(pool, WETH, token, period, amountTokensStepOne) : p1Tokens;
        amountTokens = (p1Tokens > p2Tokens) ? p1Tokens : p2Tokens;
        volatility = 1;
    }

    /**
     @notice updates record price observation history. Not required for this oracle, so nothing to do but the interface must be supported. 
     @dev it is permissible for anyone to supply gas and update the oracle's price history.
     @param token baseToken to update
     */
    function update(address token) external override {}

    /**
     @notice returns equivalent indexTokens for amountTokens, token
     @param token ERC20 token
     @param amountTokens amount in token native precision
     @param amountOut equivalent amount in indexTokens
     */
    function consult(address token, uint256 amountTokens) public view returns (uint256 amountOut) {
        require(registeredTokensSet.exists(token), "UniswapV3OracleSimple: unknown token");

        Settings storage s = registeredTokens[token];
        /*
        if (s.oneStep) {
            amountOut = consultOneStep(token, amountTokens, s.period, s.poolFee);
        } else {
            amountOut = consultTwoSteps(token, amountTokens, s.period, s.poolFee);
        }
        */
        amountOut = (s.oneStep) ? 
            consultOneStep (token, amountTokens, s.period, s.poolFee) : 
            consultTwoSteps(token, amountTokens, s.period, s.poolFee);
    }

    /**
     @notice checks whether the pool is unlocked and returns the current tick
     @param pool the pool address
     @param tick tick from slot0
     */
    function poolValues(address pool) internal view returns (int24 tick) {
        IUniswapV3Pool oracle = IUniswapV3Pool(pool);
        (, int24 tick_, , , , , bool unlocked_) = oracle.slot0();
        require(unlocked_, "UniswapV3OracleSimple: the pool is locked");
        tick = tick_;
    }

    /**
     @notice returns equivalent indexTokens for amountTokens, token. Uses one step route (token/indexToken)
     @param token ERC20 token
     @param amountTokens amount in token native precision
     @param poolFee used to select between avaulable V3 pools for the token
     @param period value (in seconds) specifies desired time period for TWAP obsersation
     @param amountOut equivalent amount in indexTokens
     */
    function consultOneStep(address token, uint256 amountTokens, uint32 period, uint24 poolFee) internal view returns (uint256 amountOut) {
        uint256 p1Out = 0;
        uint256 p2Out = 0;
        address pool = PoolAddress.computeAddress(uniswapFactory, PoolAddress.getPoolKey(token, indexToken, poolFee));
        int24 tick = poolValues(pool);
        p1Out = _fetchSpot(token, indexToken, tick, amountTokens);
        p2Out = (period > 0) ? _fetchTwap(pool, token, indexToken, period, amountTokens) : p1Out;
        amountOut = (p1Out > p2Out) ? p2Out : p1Out;
    }

    /**
     @notice returns equivalent indexTokens for amountTokens, token. Uses two steps route (token/ETH - ETH/indexToken)
     @param token ERC20 token
     @param amountTokens amount in token native precision
     @param poolFee used to select between avaulable V3 pools for the token
     @param period value (in seconds) specifies desired time period for TWAP obsersation
     @param amountOut equivalent amount in indexTokens
     */
    function consultTwoSteps(address token, uint256 amountTokens, uint32 period, uint24 poolFee) internal view returns (uint256 amountOut) {
        uint256 p1Out = 0;
        uint256 p2Out = 0;
        address pool1 = PoolAddress.computeAddress(uniswapFactory, PoolAddress.getPoolKey(token, WETH, poolFee));
        int24 tick = poolValues(pool1);
        uint256 p1amountOneStepOne = _fetchSpot(token, WETH, tick, amountTokens);
        address pool2 = PoolAddress.computeAddress(uniswapFactory, PoolAddress.getPoolKey(WETH, indexToken, ethPoolFee));
        tick = poolValues(pool2);
        p1Out = _fetchSpot(WETH, indexToken, tick, p1amountOneStepOne);
        p2Out = p1Out;

        // if period == 0, we use spot price. Otherwise look for TWAP
        if (period > 0) {
            uint256 p2amountOneStepOne = _fetchTwap(pool1, WETH, indexToken, period, amountTokens);
            p2Out = _fetchSpot(WETH, indexToken, tick, p2amountOneStepOne);
        }

        amountOut = (p1Out > p2Out) ? p2Out : p1Out;
    }

    /**
     @notice returns equivalent _tokenOut for _amountIn, _tokenIn using TWAP price
     @param _pool Uniswap V3 pool address to be used for price checking
     @param _tokenIn token the input amount is in
     @param _tokenOut token for the output amount
     @param _twapPeriod the averaging time period
     @param _amountIn amount in _tokenIn
     @param amountOut equivalent anount in _tokenOut
     */
    function _fetchTwap(
        address _pool,
        address _tokenIn,
        address _tokenOut,
        uint32 _twapPeriod,
        uint256 _amountIn
    ) internal view returns (uint256 amountOut) {
        // Leave twapTick as a int256 to avoid solidity casting
        int256 twapTick = OracleLibrary.consult(_pool, _twapPeriod);
        return
            OracleLibrary.getQuoteAtTick(
                int24(twapTick), // can assume safe being result from consult()
                SafeUint128.toUint128(_amountIn),
                _tokenIn,
                _tokenOut
            );
    }

    /**
     @notice returns equivalent _tokenOut for _amountIn, _tokenIn using spot price
     @param _tokenIn token the input amount is in
     @param _tokenOut token for the output amount
     @param _tick tick for the spot price
     @param _amountIn amount in _tokenIn
     @param amountOut equivalent anount in _tokenOut
     */
    function _fetchSpot(
        address _tokenIn,
        address _tokenOut,
        int24 _tick,
        uint256 _amountIn
    ) internal pure returns (uint256 amountOut) { 
        return
            OracleLibrary.getQuoteAtTick(
                _tick,
                SafeUint128.toUint128(_amountIn),
                _tokenIn,
                _tokenOut
            );
    }

    /*********************************
     * CRUD
     *********************************/

    /**
     * @notice utility function that checks whether there is an existing pool for the specified tokens. Returns true if the pool exists
     * @param token0 address of the first token
     * @param token1 address of the second token
     * @param poolFee fee setting for the pool
     */
    function poolExists(address token0, address token1, uint24 poolFee) private view returns (bool) {
        IUniswapV3Factory factory = IUniswapV3Factory(UNI_V3_FACTORY);
        return factory.getPool(token0, token1, poolFee) != NULL_ADDRESS;
    }

    /**
     * @notice check settings and pools for a token being registered with the oracle
     * @param token address of the token to be registered
     * @param oneStep bool flag that indicates whether to use one step or two steps route (via ETH)
     * @param poolFee fee setting for the uniswap V3 pool to be used by the oracle. Main options: 10000, 3000 and 500 (1%, 0.3%. 0.05%)
     */
    function checkTokenSettings(address token, bool oneStep, uint24 poolFee) private view {
        require(token != NULL_ADDRESS, "UniswapV3OracleSimple: token cannot be null");
        require(poolFee > 0, "UniswapV3OracleSimple: poolFee must be > 0");

        address tokenToCheck = indexToken;
        if (!oneStep) {
            tokenToCheck = WETH;

            // check if there is a pool for the second pair
            require(poolExists(WETH, indexToken, ethPoolFee), "UniswapV3OracleSimple: unknown ETH/indexToken pair");
        }

        // check if there is a pool for the main pair
        require(poolExists(token, tokenToCheck, poolFee), "UniswapV3OracleSimple: unknown pair");
    }

    /**
     * @notice register a new token
     * @param token address of the token to be registered
     * @param oneStep bool flag that indicates whether to use one step or two steps route (via ETH)
     * @param period the averaging period to use for price smoothing (in seconds)
     * @param poolFee fee setting for the uniswap V3 pool to be used by the oracle. Main options: 10000, 3000 and 500 (1%, 0.3%. 0.05%)
     */
    function registerToken(address token, bool oneStep, uint32 period, uint24 poolFee) external onlyOwner {
        checkTokenSettings(token, oneStep, poolFee);
        registeredTokensSet.insert(token, "UniswapV3OracleSimple: token is already registered");
        Settings storage s = registeredTokens[token];
        s.oneStep = oneStep;
        s.period = period;
        s.poolFee = poolFee;
        emit RegisterToken(msg.sender, token, oneStep, period, poolFee);
    }

    /**
     * @notice re-register a token with different pool settings
     * @param token address of the token to be re-registered
     * @param oneStep bool flag that indicates whether to use one step or two steps route (via ETH)
     * @param period the averaging period to use for price smoothing (in seconds)
     * @param poolFee fee setting for the uniswap V3 pool to be used by the oracle. Main options: 10000, 3000 and 500 (1%, 0.3%. 0.05%)
     */
    function reregisterToken(address token, bool oneStep, uint32 period, uint24 poolFee) external onlyOwner {
        require(registeredTokensSet.exists(token), "UniswapV3OracleSimple: token hasn't been registered before");
        checkTokenSettings(token, oneStep, poolFee);
        Settings storage s = registeredTokens[token];
        s.oneStep = oneStep;
        s.period = period;
        s.poolFee = poolFee;

        emit ReregisterToken(msg.sender, token, oneStep, period, poolFee);
    }

    /**
     * @notice unregister a token
     * @param token address of the token to be unregistered
     */
    function unregisterToken(address token) external onlyOwner {
        registeredTokensSet.remove(token, "UniswapV3OracleSimple: unknown token");
        delete registeredTokens[token];
        emit UnregisterToken(msg.sender, token);
    }
}
