// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../oz_modified/ICHIERC20.sol";

contract MemberToken is ICHIERC20 {

    constructor() {
        initERC20("Member Token", "MTTest");
        _mint(msg.sender, 100000 * 10 ** 18);
    }
}
