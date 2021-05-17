## `Incremental`

Multi-tenant implementation with parameters managed by separate governing authorities.




### `constructor(address oneTokenFactory_, string description_)` (public)





### `init(address oneTokenOracle)` (external)

initializes the common interface with parameters managed by msg.sender, usually a oneToken.
     @dev A single instance can be shared by n oneToken implementations. Initialize from each instance. Re-initialization is acceptabe.
     @param oneTokenOracle gets the exchange rate of the oneToken



### `changeOracle(address oneToken, address oracle)` (external)

changes the oracle used to assess the oneTokens' value in relation to the peg
     @dev may use the peggedOracle (efficient but not informative) or an active oracle 
     @param oneToken oneToken vault (also ERC20 token)
     @param oracle oracle contract must be registered in the factory



### `setParams(address oneToken, uint256 minRatio, uint256 maxRatio, uint256 stepSize, uint256 initialRatio, uint256 maxOrderVolume)` (external)

updates parameters for a given oneToken that uses this module
     @dev inspects the oneToken implementation to establish authority
     @param oneToken token context for parameters
     @param minRatio minimum minting ratio that will be set
     @param maxRatio maximum minting ratio that will be set
     @param stepSize adjustment size iteration
     @param initialRatio unadjusted starting minting ratio



### `getMintingRatio(address) → uint256 ratio, uint256 maxOrderVolume` (external)

returns an adjusted minting ratio
     @dev oneToken contracts call this to get their own minting ratio
     // collateralToken argument in the interface supports future-use cases
     @param ratio the minting ratio
     @param maxOrderVolume recommended maximum order size, specified by governance. Defaults to unlimited



### `getMintingRatio2(address oneToken, address) → uint256 ratio, uint256 maxOrderVolume` (public)

returns an adjusted minting ratio. OneTokens use this function and it relies on initialization to select the oracle
     @dev anyone calls this to inspect any oneToken minting ratio based on the oracle chosen at initialization
     @param oneToken oneToken implementation to inspect
     // collateralToken argument in the interface supports future-use cases
     @param ratio the minting ratio
     @param maxOrderVolume recommended maximum order size, specified by governance. Defaults to unlimited



### `getMintingRatio4(address oneToken, address oneTokenOracle, address, address) → uint256 ratio, uint256 maxOrderVolume` (public)

returns an adjusted minting ratio
     @dev anyone calls this to inspect any oneToken minting ratio based on arbitry oracles
     @param oneToken oneToken implementation to inspect
     @param oneTokenOracle explicit oracle selection
     // collateralToken argument in the interface supports future-use cases
     @param ratio the minting ratio
     @param maxOrderVolume recommended maximum order size, specified by governance. Defaults to unlimited



### `updateMintingRatio(address) → uint256 ratio, uint256 maxOrderVolume` (external)

records and returns an adjusted minting ratio for a oneToken implemtation
     @dev oneToken implementations calls this periodically, e.g. in the minting process
     // collateralToken argument in the interface supports future-use cases
     @param ratio the minting ratio
     @param maxOrderVolume recommended maximum order size, specified by governance. Defaults to unlimited



### `setStepSize(address oneToken, uint256 stepSize)` (public)

adjusts the rate of minting ratio change
     @dev only the governance that owns the token implentation can adjust the mintMaster's parameters
     @param oneToken the implementation to work with
     @param stepSize the step size must be smaller than the difference of min and max



### `setMinRatio(address oneToken, uint256 minRatio)` (public)

sets the minimum minting ratio
     @dev only the governance that owns the token implentation can adjust the mintMaster's parameters
     if the new minimum is higher than current minting ratio, the current ratio will be adjusted to minRatio
     @param oneToken the implementation to work with
     @param minRatio the new lower bound for the minting ratio



### `setMaxRatio(address oneToken, uint256 maxRatio)` (public)

sets the maximum minting ratio
     @dev only the governance that owns the token implentation can adjust the mintMaster's parameters
     if the new maximum is lower is than current minting ratio, the current ratio will be set to maxRatio
     @param oneToken the implementation to work with
     @param maxRatio the new upper bound for the minting ratio



### `setRatio(address oneToken, uint256 ratio)` (public)

sets the current minting ratio
     @dev only the governance that owns the token implentation can adjust the mintMaster's parameters
     @param oneToken the implementation to work with
     @param ratio must be in the min-max range




### `OneTokenOracleChanged(address sender, address oneToken, address oracle)`





### `SetParams(address sender, address oneToken, uint256 minRatio, uint256 maxRatio, uint256 stepSize, uint256 initialRatio, uint256 maxOrderVolume)`





### `UpdateMintingRatio(address sender, address oneToken, uint256 newRatio, uint256 maxOrderVolume)`





### `StepSizeSet(address sender, address oneToken, uint256 stepSize)`





### `MinRatioSet(address sender, address oneToken, uint256 minRatio)`





### `MaxRatioSet(address sender, address oneToken, uint256 maxRatio)`





### `RatioSet(address sender, address oneToken, uint256 ratio)`





