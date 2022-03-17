// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "../StrategyCommon.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

contract ExtendedArbitrary is StrategyCommon, IERC1155Receiver{

    /**
     @notice a strategy is dedicated to exactly one oneToken instance
     @param oneTokenFactory_ bind this instance to oneTokenFactory instance
     @param oneToken_ bind this instance to one oneToken vault
     @param description_ metadata has no impact on logic
     */

    constructor(address oneTokenFactory_, address oneToken_, string memory description_) 
        StrategyCommon(oneTokenFactory_, oneToken_, description_)
    {}


    /**
    @notice Governance can work with collateral and treasury assets. Can swap assets.
    @param target address/smart contract you are interacting with
    @param value msg.value (amount of eth in WEI you are sending. Most of the time it is 0)
    @param signature the function signature
    @param data abi-encodeded bytecode of the parameter values to send
    */
    function executeTransaction(address target, uint256 value, string memory signature, bytes memory data) external onlyOwner returns (bytes memory) {
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

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return 0xf23a6e61;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure override returns (bytes4) {
        return 0xbc197c81;
    }

    function supportsInterface(bytes4 interfaceId) external view virtual override returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
