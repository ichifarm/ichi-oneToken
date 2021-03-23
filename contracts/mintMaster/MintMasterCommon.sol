// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../common/ICHIModuleCommon.sol";
import "../interface/IMintMaster.sol";
import "../interface/IOneTokenV1Base.sol";
import "../interface/IOneTokenFactory.sol";

abstract contract MintMasterCommon is IMintMaster, ICHIModuleCommon{

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 MintMaster Implementation"));
    mapping(address => address) public oneTokenOracles;

    event MintMasterDeployed(address oneToken);
    event MintMasterInitialized(address oneToken, address oneTokenOracle);

    constructor(string memory description) 
        ICHIModuleCommon(ModuleType.MintMaster, description) 
    { 
        emit MintMasterDeployed(msg.sender);
    }

    /**
     @notice sets up the common interface
     @dev must be called module init() function while msg.sender is the oneToken client binding to the module
     */
    function _initMintMaster(address oneTokenOracle) internal {
        require(IOneTokenFactory(IOneTokenV1Base(msg.sender).factory()).isValidModuleType(oneTokenOracle, ModuleType.Oracle), "MintMasterCommon: given oracle is not valid for oneToken (msg.sender)");
        oneTokenOracles[msg.sender] = oneTokenOracle;
        emit MintMasterInitialized(msg.sender, oneTokenOracle);
    }
}
