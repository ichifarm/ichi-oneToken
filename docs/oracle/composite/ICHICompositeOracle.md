## `ICHICompositeOracle`

Relies on external Oracles using any price quote methodology.




### `constructor(address oneTokenFactory_, string description_, address indexToken_, address[] interimTokens_, address[] oracles_)` (public)

addresses and oracles define a chain of currency conversions (e.g. X:ETH, ETH:BTC: BTC:USDC => X:USDC) that will be executed in order of declaration
     @dev output of oracles is used as input for the next oracle. 
     @param description_ human-readable name has no bearing on internal logic
     @param indexToken_ a registered usdToken to use for quote indexed
     @param interimTokens_ a sequential list of base tokens to query the oracles, starting with the base token for the composite oracle, e.g. X
     @param oracles_ a sequential list of unregisted contracts that support the IOracle interface, ending with a collateral token, e.g. USDC



### `init(address baseToken)` (external)

intialization is called when the factory assigns an oracle to an asset
     @dev there is nothing to do. Deploy separate instances configured for distinct baseTokens



### `update(address)` (external)

update is called when a oneToken wants to persist observations
     @dev chain length is constrained by gas
     //param token composite oracles are always single-tenant, The token context is ignored.



### `read(address, uint256 amountTokens) → uint256 amountUsd, uint256 volatility` (public)

returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     @dev volatility is the product of interim volatility measurements
     //param token composite oracles are always single-tenant, The token context is ignored.
     @param amountTokens quantity of tokens, token precision
     @param amountUsd index tokens required, precision 18
     @param volatility overall volatility metric - for future use-caeses



### `amountRequired(address, uint256 amountUsd) → uint256 amountTokens, uint256 volatility` (external)

returns the tokens needed to reach a target usd value
     //param token composite oracles are always single-tenant, The token context is ignored.     
     @param amountUsd Usd required in 10**18 precision
     @param amountTokens tokens required in tokens native precision
     @param volatility metric for future use-cases



### `oracleCount() → uint256 count` (public)





### `oracleAtIndex(uint256 index) → address oracle, address token` (public)






