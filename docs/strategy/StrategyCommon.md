## `StrategyCommon`





### `onlyToken()`





### `strategyOwnerTokenOrController()`



oneToken governance has privileges that may be delegated to a controller


### `constructor(address oneTokenFactory_, address oneToken_, string description)` (internal)

a strategy is dedicated to exactly one oneToken instance
     @param oneToken_ bind this instance to one oneToken vault
     @param description metadata has no impact on logic



### `init()` (external)

a strategy is dedicated to exactly one oneToken instance and must be re-initializable



### `execute()` (external)

a controller invokes execute() to trigger logic within the strategy.
     @dev called from oneToken governance or the active controller



### `setAllowance(address token, uint256 amount)` (external)

gives the oneToken control of tokens deposited in the strategy
     @dev called from oneToken governance or the active controller
     @param token the asset
     @param amount the allowance. 0 = infinte



### `closeAllPositions() → bool success` (external)

closes all positions and returns the funds to the oneToken vault
     @dev override this function to withdraw funds from external contracts. Return false if any funds are unrecovered.



### `_closeAllPositions() → bool success` (internal)

closes all positions and returns the funds to the oneToken vault
     @dev override this function to withdraw funds from external contracts. Return false if any funds are unrecovered.



### `toVault(address token, uint256 amount)` (external)

let's the oneToken controller instance send funds to the oneToken vault
     @param token the ecr20 token to send
     @param amount the amount of tokens to send



### `_toVault(address token, uint256 amount)` (internal)

send funds to the oneToken vault
     @param token the ecr20 token to send
     @param amount the amount of tokens to send



### `fromVault(address token, uint256 amount)` (external)

let's the oneToken controller instance draw funds from the oneToken vault allowance
     @param token the ecr20 token to send
     @param amount the amount of tokens to send



### `_fromVault(address token, uint256 amount)` (internal)

draw funds from the oneToken vault
     @param token the ecr20 token to send
     @param amount the amount of tokens to send




### `StrategyDeployed(address sender)`





### `StrategyInitialized(address sender)`





### `StrategyExecuted(address sender, address token)`





### `VaultAllowance(address sender, address token, uint256 amount)`





### `FromVault(address sender, address token, uint256 amount)`





### `ToVault(address sender, address token, uint256 amount)`





