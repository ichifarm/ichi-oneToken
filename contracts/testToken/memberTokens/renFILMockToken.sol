// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "../../oz_modified/ICHIERC20.sol";
import "../../_openzeppelin/access/Ownable.sol";

contract RenFILMockToken is ICHIERC20, Ownable {

    constructor() {
        initERC20("renFIL","renFIL");
        _mint(msg.sender, 10000 * 10 ** 18);
        
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

}
