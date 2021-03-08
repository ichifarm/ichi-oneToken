// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./interface/IModule.sol";
import "./interface/IOneTokenV1Base.sol";
import "./ICHICommon.sol";

abstract contract ICHIModuleCommon is IModule, ICHICommon {

    bytes32 constant public USD_ORACLE_KEY = keccak256(abi.encodePacked("ICHI V1 USD Oracle Implementation"));
    address constant internal NULL_ADDRESS = address(0);
    
    ModuleType public immutable override moduleType;
    address public immutable override oneToken;
    address public immutable override foreignToken;

    event ModuleDeployed(address sender, ModuleType moduleType, address oneToken, address foreignToken);
    event OneTokenModuleParameter(address sender, bytes32 key, bytes32 value);

    modifier onlyOneToken {
        require(msg.sender == oneToken, "ICHIModuleCommon: must be contract owner");
        _;
    }

    modifier onlyOwnerOneTokenOrController {
        if(msg.sender != owner()) {
            if(msg.sender != oneToken) {
                require(msg.sender == IOneTokenV1Base(oneToken).controller(), "ICHIModuleCommon: must be owner or controller.");
            }
        }
        _;
    }

    constructor (ModuleType moduleType_, address oneToken_, address foreignToken_) {
        require(oneToken_ != NULL_ADDRESS, "ICHIModuleCommon: oneToken cannot empty.");
        require(IModule(oneToken_).MODULE_TYPE() == COMPONENT_VERSION, "ICHIModuleCommon: oneToken specified is not a oneToken implementation.");
        moduleType = moduleType_;
        oneToken = oneToken_;
        foreignToken = foreignToken_;
        emit ModuleDeployed(msg.sender, moduleType_, oneToken_, foreignToken_);
    }

    /// @notice a module can optionally implement an initialization function
    
    function init() external override virtual {}

    function setParam(bytes32 key, bytes32 value) external onlyOwner override {
        IOneTokenV1Base(oneToken).setModuleParam(foreignToken, moduleType, key, value);
        emit OneTokenModuleParameter(msg.sender, key, value);
    }

    function getParam(bytes32 key) external view onlyOwner override returns(bytes32) {
        return IOneTokenV1Base(oneToken).getParam(key);
    }
}
