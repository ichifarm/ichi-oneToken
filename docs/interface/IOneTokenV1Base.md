## `IOneTokenV1Base`






### `init(string name_, string symbol_, address oneTokenOracle_, address controller_, address mintMaster_, address memberToken_, address collateral_)` (external)





### `changeController(address controller_)` (external)





### `changeMintMaster(address mintMaster_)` (external)





### `addAsset(address token, address oracle)` (external)





### `removeAsset(address token)` (external)





### `setStrategy(address token, address strategy, uint256 allowance)` (external)





### `removeStrategy(address token)` (external)





### `closeStrategy(address token)` (external)





### `setStrategyAllowance(address token, uint256 amount)` (external)





### `recoverFunds(address from, address token, uint256 amount)` (external)





### `setFactory(address newFactory)` (external)





### `MODULE_TYPE() → bytes32` (external)





### `factory() → address` (external)





### `controller() → address` (external)





### `mintMaster() → address` (external)





### `memberToken() → address` (external)





### `assets(address) → address, address` (external)





### `balances(address token) → uint256 inVault, uint256 inStrategy` (external)





### `collateralTokenCount() → uint256` (external)





### `collateralTokenAtIndex(uint256 index) → address` (external)





### `isCollateral(address token) → bool` (external)





### `otherTokenCount() → uint256` (external)





### `otherTokenAtIndex(uint256 index) → address` (external)





### `isOtherToken(address token) → bool` (external)





### `assetCount() → uint256` (external)





### `assetAtIndex(uint256 index) → address` (external)





### `isAsset(address token) → bool` (external)






