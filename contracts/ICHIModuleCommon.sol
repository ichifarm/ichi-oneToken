// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "./interface/IModule.sol";
import "./interface/IOneTokenV1Base.sol";
import "./ICHICommon.sol";

abstract contract ICHIModuleCommon is IModule, ICHICommon {

    address constant NULL_ADDRESS = address(0);
    
    ModuleType public immutable moduleType;
    address public immutable oneToken;
    address public immutable foreignToken;

    event OneTokenModuleParameter(address sender, bytes32 key, bytes32 value);

    constructor (ModuleType moduleType_, address oneToken_, address foreignToken_) {
        require(oneToken_ != NULL_ADDRESS, "ICHIModuleCommon: oneToken cannot empty.");
        require(IModule(oneToken_).MODULE_TYPE() == COMPONENT_VERSION, "ICHIModuleCommon: oneToken specified is not a oneToken implementation.");
        moduleType = moduleType_;
        oneToken = oneToken_;
        foreignToken = foreignToken_;
    }

    function setParam(bytes32 key, bytes32 value) external override {
        IOneTokenV1Base(oneToken).setModuleParam(foreignToken, moduleType, key, value);
        emit OneTokenModuleParameter(msg.sender, key, value);
    }

    function getParam(bytes32 key) external view override returns(bytes32) {
        return IOneTokenV1Base(oneToken).getParam(key);
    }
}
