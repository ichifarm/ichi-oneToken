## `ICHIPeggedOracle`

Returns 1:1, scaled to 18




### `constructor(address oneTokenFactory_, string description, address indexToken_)` (public)





### `update(address)` (external)

update is called when a oneToken wants to persist observations
     @dev there is nothing to do in this case



### `read(address token, uint256 amountTokens) → uint256 amountUsd, uint256 volatility` (public)

returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     @dev amountTokens:amountUsd is always 1:1, adjusted for normalized scale, and volatility is always 0
     @param token base token
     @param amountTokens quantity, token native precision
     @param amountUsd US dollar equivalentm, precision 18
     @param volatility metric for future use-cases



### `amountRequired(address token, uint256 amountUsd) → uint256 amountTokens, uint256 volatility` (external)

returns the tokens needed to reach a target usd value
     @dev token:usdToken is always 1:1 and volatility is always 1
     @param token base token
     @param amountUsd Usd required, precision 18
     @param amountTokens tokens required, token native precision
     @param volatility metric for future use-cases




