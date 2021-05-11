// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../StrategyCommon.sol";

contract Arbitrary is StrategyCommon {

    constructor(address oneTokenFactory_, address oneToken, string memory description) 
        StrategyCommon(oneTokenFactory_, oneToken, description)
    {}


    /**
    @notice Governance can work with collateral and treasury assets. Can swap assets.
    @param target address/smart contract you are interacting with
    @param value msg.value (amount of eth in WEI you are sending. Most of the time it is 0)
    @param signature the function signature
    @param data abi-encodeded bytecode of the parameter values to send
    */
    function executeTransaction(address target, uint value, string memory signature, bytes memory data) external onlyOwner returns (bytes memory) {
        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = target.call{ value: value }(callData);
        require(success, "OneTokenV1::executeTransaction: Transaction execution reverted.");
        return returnData;
    }
}
