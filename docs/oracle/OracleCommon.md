## `OracleCommon`






### `constructor(address oneTokenFactory_, string description_, address indexToken_)` (internal)

records the oracle description and the index that will be used for all quotes
     @dev oneToken implementations can share oracles
     @param oneTokenFactory_ oneTokenFactory to bind to
     @param description_ all modules have a description. No processing or validation
     @param indexToken_ every oracle has an index token for reporting the value of a base token



### `init(address baseToken)` (external)

oneTokens can share Oracles. Oracles must be re-initializable. They are initialized from the Factory.
     @param baseToken oracles _can be_ multi-tenant with separately initialized baseTokens



### `normalizedToTokens(address token, uint256 amountNormal) → uint256 amountTokens` (public)

converts normalized precision 18 amounts to token native precision amounts, truncates low-order values
     @param token ERC20 token contract
     @param amountNormal quantity in precision-18
     @param amountTokens quantity scaled to token decimals()



### `tokensToNormalized(address token, uint256 amountTokens) → uint256 amountNormal` (public)

converts token native precision amounts to normalized precision 18 amounts
     @param token ERC20 token contract
     @param amountTokens quantity scaled to token decimals
     @param amountNormal quantity in precision-18




### `OracleDeployed(address sender, string description, address indexToken)`





### `OracleInitialized(address sender, address baseToken, address indexToken)`





### `OracleUpdated(address sender)`





