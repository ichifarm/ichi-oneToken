## `Arbitrary`






### `constructor(address oneTokenFactory_, address oneToken, string description)` (public)





### `executeTransaction(address target, uint256 value, string signature, bytes data) → bytes` (public)

Governance can work with collateral and treasury assets. Can swap assets.
           Add assets with oracles to include newly acquired tokens in inventory for reporting/accounting functions.
    @param target address/smart contract you are interacting with
    @param value msg.value (amount of eth in WEI you are sending. Most of the time it is 0)
    @param signature the function signature (name of the function and the types of the arguments)
           for example: "transfer(address,uint256)", or "approve(address,uint256)"
    @param data abi-encodeded byte-code of the parameter values you are sending.




