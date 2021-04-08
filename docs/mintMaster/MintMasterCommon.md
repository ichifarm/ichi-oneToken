## `MintMasterCommon`






### `constructor(string description)` (internal)





### `_initMintMaster(address oneToken, address oneTokenOracle)` (internal)

sets up the common interface
     @dev must be called from module init() function while msg.sender is the oneToken client binding to the module
     @param oneTokenOracle proposed oracle for the oneToken that intializes the mintMaster




### `MintMasterDeployed(address sender, string description)`





### `MintMasterInitialized(address sender, address oneToken, address oneTokenOracle)`





