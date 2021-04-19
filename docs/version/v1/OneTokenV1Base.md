## `OneTokenV1Base`





### `onlyOwnerOrController()`






### `init(string name_, string symbol_, address oneTokenOracle_, address controller_, address mintMaster_, address memberToken_, address collateral_)` (external)

initializes a proxied instance of the implementation
     @dev constructors are ineffective for proxy deployments
     @param name_ ERC20 name value
     @param symbol_ ERC20 symbol value
     @param oneTokenOracle_ a deployed, compatible oracle supporting the minimum interface
     @param controller_ a deployed, compatible controller supporting the minimum interface
     @param mintMaster_ a deployed, compatible mintMast supporting the minimum interface
     @param memberToken_ a deployed, registered (in the factory) ERC20 token supporting the minimum interface
     @param collateral_ a deployed, registered (in the factory) usd-pegged ERC20 token supporting the minimum interface



### `changeController(address controller_)` (external)

governance can appoint a new controller with distinct internal logic
     @dev controllers support the periodic() function which should be called occasionally to send gas to the controller
     @param controller_ a deployed controller contract supporting the minimum interface and registered with the factory



### `changeMintMaster(address mintMaster_, address oneTokenOracle_)` (external)

change the mintMaster
     @dev controllers support the periodic() function which should be called occasionally to send gas to the controller
     @param mintMaster_ the new mintMaster implementation
     @param oneTokenOracle_ intialize the mintMaster with this oracle. Must be registed in the factory.



### `addAsset(address token, address oracle)` (external)

governance can add an asset
     @dev asset inventory helps evaluate local holdings and enables strategy assignment
     @param token ERC20 token
     @param oracle oracle to use for usd valuation. Must be registered in the factory and associated with token.



### `removeAsset(address token)` (external)

governance can remove an asset from treasury and collateral value accounting
     @dev does not destroy holdings, but holdings are not accounted for
     @param token ERC20 token



### `setStrategy(address token, address strategy, uint256 allowance)` (external)

governance optionally assigns a strategy to an asset and sets a strategy allowance
     @dev strategy must be registered with the factory
     @param token ERC20 asset
     @param strategy deployed strategy contract that is registered with the factor
     @param allowance ERC20 allowance sets a limit on funds to transfer to the strategy



### `removeStrategy(address token)` (external)

governance can remove a strategy
     @dev closes the strategy and requires that all funds in the strategy are returned to the vault
     @param token the token strategy to remove. There are 0-1 strategys per asset



### `closeStrategy(address token)` (public)

governance can close a strategy and return funds to the vault
     @dev strategy remains assigned the asset with allowance set to 0.
       Emits positionsClosed: false if strategy reports < 100% funds recovery, e.g. funds are locked elsewhere.
     @param token ERC20 asset with a strategy to close. Sweeps all registered assets.



### `executeStrategy(address token)` (external)

governance can execute a strategy to trigger innner logic within the strategy
     @dev normally used by the controller
     @param token the token strategy to execute



### `toStrategy(address strategy, address token, uint256 amount)` (external)

governance can transfer assets from the vault to a strategy
     @dev works independently of strategy allowance
     @param strategy receiving address must match the assigned strategy
     @param token ERC20 asset
     @param amount amount to send



### `fromStrategy(address strategy, address token, uint256 amount)` (external)

governance can transfer assets from the strategy to this vault
     @dev funds are normally pushed from strategy. This is an alternative in case of an errant strategy.
       Relies on allowance that is usually set to infinite when the strategy is assigned
     @param strategy receiving address must match the assigned strategy
     @param token ERC20 asset
     @param amount amount to draw from the strategy



### `setStrategyAllowance(address token, uint256 amount)` (public)

governance can set an allowance for a token strategy
     @dev computes the net allowance, new allowance - current holdings
     @param token ERC20 asset
     @param amount amount to draw from the strategy



### `setFactory(address newFactory)` (external)

adopt a new factory
     @dev accomodates factory upgrades
     @param newFactory address of the new factory



### `balances(address token) → uint256 inVault, uint256 inStrategy` (public)

returns the local balance and funds held in the assigned strategy, if any



### `collateralTokenCount() → uint256` (external)

point
     @notice returns the number of acceptable collateral token contracts



### `collateralTokenAtIndex(uint256 index) → address` (external)

returns the address of an ERC20 token collateral contract at the index



### `isCollateral(address token) → bool` (public)

returns true if the token contract is recognized collateral



### `otherTokenCount() → uint256` (external)

returns the count of registered ERC20 asset contracts that not collateral



### `otherTokenAtIndex(uint256 index) → address` (external)

returns the non-collateral token contract at the index



### `isOtherToken(address token) → bool` (external)

returns true if the token contract is registered and is not collateral



### `assetCount() → uint256` (external)

returns the sum of collateral and non-collateral ERC20 token contracts



### `assetAtIndex(uint256 index) → address` (external)

returns the ERC20 contract address at the index



### `isAsset(address token) → bool` (external)

returns true if the token contract is a registered asset of either type




### `Initialized(address sender, string name, string symbol, address controller, address mintMaster, address memberToken, address collateral)`





### `ControllerChanged(address sender, address controller)`





### `MintMasterChanged(address sender, address mintMaster, address oneTokenOracle)`





### `StrategySet(address sender, address token, address strategy, uint256 allowance)`





### `StrategyExecuted(address sender, address token, address strategy)`





### `StrategyRemoved(address sender, address token, address strategy)`





### `StrategyClosed(address sender, address token, address strategy, bool success)`





### `ToStrategy(address sender, address strategy, address token, uint256 amount)`





### `FromStrategy(address sender, address strategy, address token, uint256 amount)`





### `StrategyAllowanceSet(address sender, address token, address strategy, uint256 amount)`





### `AssetAdded(address sender, address token, address oracle)`





### `AssetRemoved(address sender, address token)`





### `NewFactory(address sender, address factory)`





