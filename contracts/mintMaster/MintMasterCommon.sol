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

    function _initMintMaster(address oneTokenOracle) internal {
        require(IOneTokenFactory(IOneTokenV1Base(msg.sender).factory()).isOracle(msg.sender, oneTokenOracle), "MintMasterCommon: given oracle is not valid for oneToken (msg.sender)");
        oneTokenOracles[msg.sender] = oneTokenOracle;
        emit MintMasterInitialized(msg.sender, oneTokenOracle);
    }
}
