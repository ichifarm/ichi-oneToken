// SPDX-License-Identifier: Unlicensed

/// @dev removed constructor visibility and relocated the file. 

pragma solidity 0.7.6;

import "../oz_modified/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol, uint256 supply) 
        ERC20(name, symbol) 
    {
        _mint(msg.sender, supply);
    }
}