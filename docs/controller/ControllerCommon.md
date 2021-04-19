## `ControllerCommon`





### `onlyKnownToken()`






### `constructor(address oneTokenFactory_, string description_)` (internal)

controllers are bound to factories at deployment time
     @param oneTokenFactory_ factory to bind to
     @param description_ human-readable, description only



### `periodic()` (external)

oneTokens invoke periodic() to trigger periodic processes. Can be trigger externally.
     @dev Acceptable access control will vary by implementation.



### `init()` (external)

OneTokenBase (msg.sender) calls this when the controller is assigned. Must be re-initializeable.




### `ControllerDeployed(address sender, address oneTokenFactory, string description)`





### `ControllerInitialized(address sender)`





### `ControllerPeriodic(address sender)`





