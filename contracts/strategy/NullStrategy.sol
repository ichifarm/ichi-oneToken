// SPDX-License-Identifier: MIT

// TODO: Experimental
 //TODO: Deployment process and permission graph

import "./StrategyCommon.sol";

pragma solidity 0.7.6;

contract NullStrategy is StrategyCommon {

    // TODO: Avoid visibility warnings from do-nothing functions
    uint foo; 

    modifier silenceWarnings {
        foo = 0;
        _;
    }
  
    function want() external view returns (address) {
        this;
        return address(0);
    }

    function deposit() external silenceWarnings {
        revert("Don't send funds here");
    }

    // NOTE: must exclude any tokens used in the yield
    // Controller role - withdraw should return to Controller
    function withdraw(address) external silenceWarnings {
    }

    // Controller | Vault role - withdraw should always return to Vault
    function withdraw(uint256) external silenceWarnings {
    }

    function skim() external silenceWarnings {
    }

    // Controller | Vault role - withdraw should always return to Vault
    function withdrawAll() external silenceWarnings returns (uint256) {
    }

    function balanceOf() external view  returns (uint256) {
        return foo;
    }

    function withdrawalFee() external view returns (uint256) {
        return foo;
    }
}