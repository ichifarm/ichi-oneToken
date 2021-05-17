// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

/**
 @notice for library testing only
 @dev this is not part of the production system and can (should be) removed.
 */

import "../lib/AddressSet.sol";

contract SetTest {

    using AddressSet for AddressSet.Set;
    AddressSet.Set set;

    function count() public view returns(uint256) {
        return set.count();
    }

    function insert(address a, string memory errorMsg) public {
        set.insert(a, errorMsg);
    }

    function remove(address a, string memory errorMsg) public {
        set.remove(a, errorMsg);
    }

    function keyAtIndex(uint256 i) public view returns(address) {
        return set.keyAtIndex(i);
    }
}