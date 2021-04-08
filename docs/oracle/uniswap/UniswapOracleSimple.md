## `UniswapOracleSimple`

A fixed-window oracle that recomputes the average price for the entire period once every period,
 Note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period,
 Periodicity is fixed at deployment time. Index (usually USD) token is fixed at deployment time.
 A single deployment can be shared by multiple oneToken clients and can observe multiple base tokens.
 Non-USD index tokens are possible. Such deployments can used as interim oracles in Composite Oracles. They should
 NOT be registed because they are not, by definition, valid sources of USD quotes.




### `constructor(address uniswapFactory_, address indexToken_, uint256 period_)` (public)

the indexToken (index token), averaging period and uniswapfactory cannot be changed post-deployment
     @dev deploy multiple instances to support different configurations
     @param uniswapFactory_ external factory contract needed by the uniswap library
     @param indexToken_ the index token to use for valuations. If not a useToken then the Oracle should not be registed.
     @param period_ the averaging period to use for price smoothing



### `init(address token)` (public)

configures parameters for a pair, token versus indexToken
     @dev initializes the first time, then does no work
     @param token the base token. index is established at deployment time and cannot be changed



### `read(address token, uint256 amountIn) → uint256 amountUsd, uint256 volatility` (external)

returns equivalent indexTokens for amountIn, token
     @dev index token is established at deployment time
     @param token baseToken for comparison
     @param amountIn amount to convert



### `amountRequired(address token, uint256 amountUsd) → uint256 tokens, uint256 volatility` (external)

returns equivalent baseTokens for amountUsd, indexToken
     @dev index token is established at deployment time
     @param token baseToken for comparison
     @param amountUsd amount to convert



### `update(address token)` (external)

updates price history observation historym if necessary
     @dev it is permissible for anyone to supply gas and update the oracle's price history.
     @param token baseToken to update



### `consult(address token, uint256 amountIn) → uint256 amountOut` (public)

returns equivalent indexTokens for amountIn, token
     @dev always returns 0 before update(token) has been called successfully for the first time.
     @param token baseToken to update
     @param amountIn amount to convert



### `pairInfo(address token) → address token0, address token1, uint256 price0CumulativeLast, uint256 price1CumulativeLast, uint32 blockTimestampLast, uint256 period` (external)

discoverable internal state
     @param token baseToken to inspect




### `Deployed(address sender, address uniswapFactory, address indexToken)`





### `Initialized(address sender, address token)`





