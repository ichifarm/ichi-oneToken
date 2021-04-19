## `ICHICompositeOracle`

Relies on external Oracles using any price quote methodology.




### `constructor(address oneTokenFactory_, string description_, address indexToken_, address[] interimTokens_, address[] oracles_)` (public)

addresses and oracles define a chain of currency conversions (e.g. through ETH) that will be executed in order of declation
     @dev output of oracles is used as input for the next oracle. 
     @param description_ human-readable name has no bearing on internal logic
     @param indexToken_ a registered usdToken to use for quote indexed
     @param oracles_ a sequential list of unregisted contracts that support the IOracle interface and return quotes in any currency



### `init(address baseToken)` (external)

intialization is called when the factory assigns an oracle to an asset
     @dev there is nothing to do. Deploy separate instances configured for distinct baseTokens



### `update(address)` (external)

update is called when a oneToken wants to persist observations
     @dev chain length is constrained by gas



### `read(address, uint256 amount) → uint256 amountOut, uint256 volatility` (public)

returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     @dev volatility is calculated by the final oracle



### `amountRequired(address, uint256 amountUsd) → uint256 tokens, uint256 volatility` (external)

returns the tokens needed to reach a target usd value




