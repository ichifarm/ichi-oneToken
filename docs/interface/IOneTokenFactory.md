## `IOneTokenFactory`






### `oneTokenProxyAdmins(address) → address` (external)





### `deployOneTokenProxy(string name, string symbol, address governance, address version, address controller, address mintMaster, address memberToken, address collateral, address oneTokenOracle) → address newOneTokenProxy, address proxyAdmin` (external)





### `admitModule(address module, enum InterfaceCommon.ModuleType moduleType, string name, string url)` (external)





### `updateModule(address module, string name, string url)` (external)





### `removeModule(address module)` (external)





### `admitForeignToken(address foreignToken, bool collateral, address oracle)` (external)





### `updateForeignToken(address foreignToken, bool collateral)` (external)





### `removeForeignToken(address foreignToken)` (external)





### `assignOracle(address foreignToken, address oracle)` (external)





### `removeOracle(address foreignToken, address oracle)` (external)





### `MODULE_TYPE() → bytes32` (external)

View functions



### `oneTokenCount() → uint256` (external)





### `oneTokenAtIndex(uint256 index) → address` (external)





### `isOneToken(address oneToken) → bool` (external)





### `moduleCount() → uint256` (external)





### `moduleAtIndex(uint256 index) → address module` (external)





### `moduleInfo(address module) → string name, string url, enum InterfaceCommon.ModuleType moduleType` (external)





### `isModule(address module) → bool` (external)





### `isValidModuleType(address module, enum InterfaceCommon.ModuleType moduleType) → bool` (external)





### `foreignTokenCount() → uint256` (external)





### `foreignTokenAtIndex(uint256 index) → address` (external)





### `foreignTokenInfo(address foreignToken) → bool collateral, uint256 oracleCount` (external)





### `foreignTokenOracleCount(address foreignToken) → uint256` (external)





### `foreignTokenOracleAtIndex(address foreignToken, uint256 index) → address` (external)





### `isOracle(address foreignToken, address oracle) → bool` (external)





### `isForeignToken(address foreignToken) → bool` (external)





### `isCollateral(address foreignToken) → bool` (external)






