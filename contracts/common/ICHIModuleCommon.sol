// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IModule.sol";
import "../interface/IOneTokenV1Base.sol";
import "./ICHICommon.sol";

abstract contract ICHIModuleCommon is IModule, ICHICommon {
    
    ModuleType public immutable override moduleType;
    string public override moduleDescription;

    event ModuleDeployed(address sender, ModuleType moduleType, string description);
    event DescriptionUpdated(address sender, string description);

    modifier onlyTokenOwner (address oneToken) {
        require(msg.sender == IOneTokenV1Base(oneToken).owner(), "ICHIModuleCommon: msg.sender is not oneToken owner");
        _;
    }
    
    constructor (ModuleType moduleType_, string memory description_) {
        moduleType = moduleType_;
        moduleDescription = description_;
        emit ModuleDeployed(msg.sender, moduleType_, description_);
    }

    /**
     @dev all modules must have an initializer. There is no default behaviour
     */
    function init() external override virtual {}

    /**
     @notice set a module description
     @param description new module desciption
     */
    function updateDescription(string memory description) external onlyOwner override {
        moduleDescription = description;
        emit DescriptionUpdated(msg.sender, description);
    }  
}
