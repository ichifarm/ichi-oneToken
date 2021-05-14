## `MintMasterCommon`






### `constructor(address oneTokenFactory, string description)` (internal)

controllers are bound to factories at deployment time
     @param oneTokenFactory factory to bind to
     @param description human-readable, descriptive only



### `init(address oneTokenOracle)` (external)

initializes the common interface with parameters managed by msg.sender, usually a oneToken.
     @dev Initialize from each instance. Re-initialization is acceptabe.
     @param oneTokenOracle gets the exchange rate of the oneToken



### `_initMintMaster(address oneToken, address oneTokenOracle)` (internal)

sets up the common interface
     @dev only called when msg.sender is the oneToken or the oneToken governance
     @param oneToken the oneToken context for the multi-tenant MintMaster implementation
     @param oneTokenOracle proposed oracle for the oneToken that intializes the mintMaster




### `MintMasterDeployed(address sender, string description)`





### `MintMasterInitialized(address sender, address oneToken, address oneTokenOracle)`





