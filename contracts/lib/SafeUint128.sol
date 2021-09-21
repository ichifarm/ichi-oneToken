// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.7.6;

/// @title Safe uint128 casting methods
/// @notice Contains methods for safely casting between types
library SafeUint128 {
    /// @notice Cast a uint256 to a uint128, revert on overflow
    /// @param y The uint256 to be downcasted
    /// @return z The downcasted integer, now type uint128
    function toUint128(uint256 y) internal pure returns (uint128 z) {
        require((z = uint128(y)) == y, "SafeUint128: overflow");
    }
}
