## `TestOracle`

Separate ownable instances can be managed by separate governing authorities.
Immutable windowSize and granularity changes require a new oracle contract.




### `constructor(address oneTokenFactory, string description, address indexToken_)` (public)





### `setAdjustUp(bool _adjustUp)` (external)

update is adjust up/down flag



### `init(address)` (external)

intialization is called when a oneToken appoints an Oracle
     @dev there is nothing to do in this case



### `update(address)` (external)

update is called when a oneToken wants to persist observations
     @dev there is nothing to do in this case



### `read(address, uint256 amount) → uint256 amountOut, uint256 volatility` (public)

returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     @dev token:usdToken is always 1:1 and valatility is always 0



### `amountRequired(address, uint256 amountUsd) → uint256 tokens, uint256 volatility` (external)

returns the tokens needed to reach a target usd value
     @dev token:usdToken is always 1:1 and valatility is always 0




### `Deployed(address sender)`





### `Initialized(address sender, address baseToken, address indexToken)`





### `Updated(address sender)`





