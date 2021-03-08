// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../ICHIModuleCommon.sol";
import "../interface/IMintMaster.sol";
import "../interface/IOneTokenV1Base.sol";
import "../interface/IOneTokenFactory.sol";

abstract contract MintMasterCommon is IMintMaster, ICHIModuleCommon{

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 MintMaster Implementation"));
    address public immutable usdToken;
    address public immutable oneTokenOracle;
    address public immutable usdTokenOracle;
    bool public isInitialized;

    event MintMasterDeployed(address sender, address oneToken, address usdToken);
    event MintMasterInitialized(address sender, address oneToken, address usdToken, address oracle);

    constructor(address oneToken_, address usdToken_, address oneTokenOracle_, address usdTokenOracle_) 
        ICHIModuleCommon(ModuleType.MintMaster, oneToken_, NULL_ADDRESS) 
    { 
        require(IOneTokenFactory(IOneTokenV1Base(oneToken_).factory()).isOracle(oneToken_, oneTokenOracle_), "??");
        require(IOneTokenFactory(IOneTokenV1Base(oneToken_).factory()).isOracle(usdToken_, usdTokenOracle_), "??");
   
        // oneToken is recorded at the ModuleCommon level
        usdToken = usdToken_;
        oneTokenOracle = oneTokenOracle_;
        usdTokenOracle = usdTokenOracle_;
        emit MintMasterDeployed(msg.sender, oneToken_, usdToken_);
    }
}
