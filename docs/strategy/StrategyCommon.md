## `StrategyCommon`





### `tokenOwnerOrController()`



oneToken governance has privileges that may be delegated to a controller


### `constructor(address oneToken_, string description)` (internal)

a strategy is dedicated to exactly one oneToken instance
     @param oneToken_ bind this instance to one oneToken vault
     @param description metadata has no impact on logic



### `init()` (external)





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

let's the controller oneToken instance send funds to the oneToken vault 
     @param token the ecr20 token to send
     @param amount the amount of tokens to send



### `_toVault(address token, uint256 amount)` (internal)

send funds to the oneToken vault 
     @param token the ecr20 token to send
     @param amount the amount of tokens to send




### `Deployed(address sender)`





### `Initialized(address sender)`





### `VaultAllowance(address sender, address token, uint256 amount)`





### `FromVault(address sender, address token, uint256 amount)`





### `ToVault(address sender, address token, uint256 amount)`





