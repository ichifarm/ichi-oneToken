## `UniswapOracleSimple`

A fixed-window oracle that recomputes the average price for the entire period once every period,
 Note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period,
 Periodicity is fixed at deployment time. Index (usually USD) token is fixed at deployment time.
 A single deployment can be shared by multiple oneToken clients and can observe multiple base tokens.
 Non-USD index tokens are possible. Such deployments can used as interim oracles in Composite Oracles. They should
 NOT be registered because they are not, by definition, valid sources of USD quotes.




### `constructor(address oneTokenFactory_, address uniswapFactory_, address indexToken_, uint256 period_)` (public)

the indexToken (index token), averaging period and uniswapfactory cannot be changed post-deployment
     @dev deploy multiple instances to support different configurations
     @param uniswapFactory_ external factory contract needed by the uniswap library
     @param indexToken_ the index token to use for valuations. If not a usd collateral token then the Oracle should not be registered in the factory but it can be used by CompositeOracles.
     @param period_ the averaging period to use for price smoothing



### `init(address token)` (public)

configures parameters for a pair, token versus indexToken
     @dev initializes the first time, then does no work. Initialized from the Factory when assigned to an asset.
     @param token the base token. index is established at deployment time and cannot be changed



### `read(address token, uint256 amountTokens) → uint256 amountUsd, uint256 volatility` (external)

returns equivalent indexTokens for amountIn, token
     @dev index token is established at deployment time
     @param token ERC20 token
     @param amountTokens quantity, token precision
     @param amountUsd US dollar equivalent, precision 18
     @param volatility metric for future use-cases



### `amountRequired(address token, uint256 amountUsd) → uint256 amountTokens, uint256 volatility` (external)

returns equivalent baseTokens for amountUsd, indexToken
     @dev index token is established at deployment time
     @param token ERC20 token
     @param amountTokens quantity, token precision
     @param amountUsd US dollar equivalent, precision 18
     @param volatility metric for future use-cases



### `update(address token)` (external)

updates price observation history, if necessary
     @dev it is permissible for anyone to supply gas and update the oracle's price history.
     @param token baseToken to update



### `consult(address token, uint256 amountTokens) → uint256 amountOut` (public)

returns equivalent indexTokens for amountIn, token
     @dev always returns 0 before update(token) has been called successfully for the first time.
     @param token baseToken to update
     @param amountTokens amount in token native precision
     @param amountOut anount in tokens, reciprocal token



### `pairInfo(address token) → address token0, address token1, uint256 price0CumulativeLast, uint256 price1CumulativeLast, uint256 price0Average, uint256 price1Average, uint32 blockTimestampLast` (external)

discoverable internal state
     @param token baseToken to inspect




