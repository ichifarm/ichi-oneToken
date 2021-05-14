## `Arbitrary`






### `constructor(address oneTokenFactory_, address oneToken_, string description_)` (public)

a strategy is dedicated to exactly one oneToken instance
     @param oneTokenFactory_ bind this instance to oneTokenFactory instance
     @param oneToken_ bind this instance to one oneToken vault
     @param description_ metadata has no impact on logic



### `executeTransaction(address target, uint256 value, string signature, bytes data) → bytes` (external)

Governance can work with collateral and treasury assets. Can swap assets.
    @param target address/smart contract you are interacting with
    @param value msg.value (amount of eth in WEI you are sending. Most of the time it is 0)
    @param signature the function signature
    @param data abi-encodeded bytecode of the parameter values to send




