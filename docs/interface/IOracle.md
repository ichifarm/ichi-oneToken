## `IOracle`






### `init(address baseToken)` (external)





### `update(address token)` (external)





### `indexToken() → address` (external)





### `read(address token, uint256 amountTokens) → uint256 amountUsd, uint256 volatility` (external)





### `amountRequired(address token, uint256 amountUsd) → uint256 amountTokens, uint256 volatility` (external)





### `normalizedToTokens(address token, uint256 amountNormal) → uint256 amountTokens` (external)

converts normalized precision-18 amounts to token native precision amounts, truncates low-order values
     @param token ERC20 token contract
     @param amountNormal quantity, precision 18
     @param amountTokens quantity scaled to token precision



### `tokensToNormalized(address token, uint256 amountTokens) → uint256 amountNormal` (external)

converts token native precision amounts to normalized precision-18 amounts
     @param token ERC20 token contract
     @param amountNormal quantity, precision 18
     @param amountTokens quantity scaled to token precision




