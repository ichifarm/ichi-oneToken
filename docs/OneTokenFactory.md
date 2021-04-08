## `OneTokenFactory`






### `deployOneTokenProxy(string name, string symbol, address governance, address version, address controller, address mintMaster, address oneTokenOracle, address memberToken, address collateral) → address newOneTokenProxy, address proxyAdmin` (external)

factory governance can deploy a oneToken instance via new proxy using existing deployed implementation
     @dev the new uninitialized instance has a finalized deployment address and is owned by the factory
     @param name ERC20 token name
     @param symbol ERC20 token symbol
     @param governance address that will control admin functions in the oneToken instance
     @param version address of a oneToken deployed implementation that emits the expected fingerprint
     @param controller deployed controller must be registered
     @param mintMaster deployed mintMaster must be registered
     @param memberToken deployed ERC20 contract must be registered with at least one associated oracle
     @param collateral deployed ERC20 contract must be registered with at least one associated oracle
     @param oneTokenOracle deployed oracle must be registered and will be used to check the oneToken peg



### `admitModule(address module, enum InterfaceCommon.ModuleType moduleType, string name, string url)` (external)

factory governance can register a module
     @param module deployed module must not be registered and must emit the expected fingerprint
     @param moduleType the type number of the module type
     @param name descriptive module information has no bearing on logic
     @param url optionally point to human-readable operational description



### `updateModule(address module, string name, string url)` (public)

factory governance can update module metadata
     @param module deployed module must be registered. moduleType cannot be changed
     @param name descriptive module information has no bearing on logic
     @param url optionally point to human-readable operational description



### `removeModule(address module)` (external)

factory governance can de-register a module
     @dev de-registering has no effect on oneTokens that use the module
     @param module deployed module must be registered



### `admitForeignToken(address foreignToken, bool collateral, address oracle)` (public)

factory governance can add a foreign token to the inventory
     @param foreignToken ERC20 contract must not be registered
     @param collateral set true if the asset is considered a collateral token
     @param oracle must be at least one oracle for every asset so supply the first one for the new asset



### `updateForeignToken(address foreignToken, bool collateral)` (external)

factory governance can update asset metadata
     @dev changes do not affect classification in existing oneToken instances
     @param foreignToken ERC20 address, asset to update
     @param collateral set to true to include in collateral



### `removeForeignToken(address foreignToken)` (external)

factory governance can de-register a foreignToken
     @dev de-registering prevents future assignment but has no effect on existing oneToken 
       instances that rely on the foreignToken
    @param foreignToken the ERC20 contract address to de-register



### `assignOracle(address foreignToken, address oracle)` (external)

factory governance can assign an oracle to foreign token
     @dev foreign tokens have 1-n registered oracle options which are selectd by oneToken instance governance
     @param foreignToken ERC20 contract address must be registered already
     @param oracle oracle must be registered



### `removeOracle(address foreignToken, address oracle)` (external)

factory can decommission an oracle associated with a particular asset 
     @dev unassociating the oracle with a given asset prevents assignment but does not affect oneToken instances that use it
     @param foreignToken the ERC20 contract to disassociate with the oracle
     @param oracle the oracle to remove from the foreignToken



### `oneTokenCount() → uint256` (external)

returns the count of deployed and initialized oneToken instances



### `oneTokenAtIndex(uint256 index) → address` (external)

returns the address of the deployed/initialized oneToken instance at the index



### `isOneToken(address oneToken) → bool` (external)

return true if given address is a deployed and initialized oneToken instance



### `moduleCount() → uint256` (external)

returns the count of the registered modules



### `moduleAtIndex(uint256 index) → address module` (external)

returns the address of the registered module at the index



### `moduleInfo(address module) → string name, string url, enum InterfaceCommon.ModuleType moduleType` (external)

returns metadata about the module at the given address
     @dev returns null values if the given address is not a registered module



### `isModule(address module) → bool` (public)

returns true the given address is a registered module



### `isValidModuleType(address module, enum InterfaceCommon.ModuleType moduleType) → bool` (public)

returns true the address given is a registered module of the expected type



### `foreignTokenCount() → uint256` (external)

returns count of foreignTokens registered with the factory
     @dev includes memberTokens, otherTokens and collateral tokens but not oneTokens



### `foreignTokenAtIndex(uint256 index) → address` (external)

returns the address of the foreignToken at the index



### `foreignTokenInfo(address foreignToken) → bool collateral, uint256 oracleCount` (external)

returns foreignToken metadata for the given foreignToken



### `foreignTokenOracleCount(address foreignToken) → uint256` (external)

returns the count of oracles registered for the given foreignToken



### `foreignTokenOracleAtIndex(address foreignToken, uint256 index) → address` (external)

returns the foreignToken oracle address at the index



### `isOracle(address foreignToken, address oracle) → bool` (external)

returns true if the given oracle address is associated with the foreignToken



### `isForeignToken(address foreignToken) → bool` (external)

returns true if the given foreignToken is registered in the factory



### `isCollateral(address foreignToken) → bool` (external)

returns true if the given foreignToken is marked collateral




### `OneTokenDeployed(address sender, address newOneTokenProxy, string name, string symbol, address governance, address version, address controller, address mintMaster, address memberToken, address collateral)`

Events



### `SetOneTokenModuleParam(address sender, address oneToken, address foreignToken, enum InterfaceCommon.ModuleType moduleType, bytes32 key, bytes32 value)`





### `ModuleAdmitted(address sender, address module, enum InterfaceCommon.ModuleType moduleType, string name, string url)`





### `ModuleUpdated(address sender, address module, string name, string url)`





### `ModuleRemoved(address sender, address module)`





### `ForeignTokenAdmitted(address sender, address foreignToken, bool isCollateral, address oracle)`





### `ForeignTokenUpdated(address sender, address foreignToken, bool isCollateral)`





### `ForeignTokenRemoved(address sender, address foreignToken)`





### `AddOracle(address sender, address foreignToken, address oracle)`





### `RemoveOracle(address sender, address foreignToken, address oracle)`





