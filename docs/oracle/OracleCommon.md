## `OracleCommon`






### `constructor(address oneTokenFactory_, string description_, address indexToken_)` (internal)

records the oracle description and the index that will be used for all quotes
     @dev oneToken implementations can share oracles
     @param description_ all modules have a description. No processing or validation.



### `init(address baseToken)` (external)

oneTokens can share Oracles. Oracles must be re-initializable. They are initialized from the Factory.




### `OracleDeployed(address sender, string description, address indexToken)`





### `OracleInitialized(address sender, address baseToken, address indexToken)`





### `OracleUpdated(address sender)`





