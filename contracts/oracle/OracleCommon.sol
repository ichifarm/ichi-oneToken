// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IOracle.sol";
import "../ICHIModuleCommon.sol";

abstract contract OracleCommon is IOracle, ICHIModuleCommon {

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Oracle Implementation"));
    
    // TODO: this seems out of place ... it is always the same but it won't always be relevant
    address constant USDC_ADDR = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    constructor(address oneToken_) 
        ICHIModuleCommon(ModuleType.Oracle, oneToken_, NULL_ADDRESS) // TODO: consider using foreign token field to specify <SYMBOL>/USD in oracle context.
    { }
}
