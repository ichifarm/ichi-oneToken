// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IStrategy.sol";
import "../interface/IOneTokenV1Base.sol";
import "../ICHIModuleCommon.sol";
import "../_openzeppelin/token/ERC20/IERC20.sol";

contract StrategyCommon is IStrategy, ICHIModuleCommon {

    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Strategy Implementation"));

    event VaultAllowance(address sender, address token, uint amount);
    event FromVault(address sender, address token, uint amount);
    event ToVault(address sender, address oken, uint amount);

    constructor(address oneToken_) 
        ICHIModuleCommon(ModuleType.Strategy, oneToken_, NULL_ADDRESS)
    {}

    function setAllowance(address token, uint amount) external onlyOwnerOneTokenOrController override {
        if(amount == 0) amount = INFINITE;
        IERC20(token).approve(oneToken, amount);
        emit VaultAllowance(msg.sender, token, amount);
    }
  
    function closeAllPositions() external onlyOwnerOneTokenOrController override returns(bool success) {
        return _closeAllPositions();
    }

    function _closeAllPositions() internal returns(bool success) {
        uint assetCount;
        uint strategyBalance;
        assetCount = IOneTokenV1Base(oneToken).assetCount();
        for(uint i=0; i < assetCount; i++) {
            address thisAsset = IOneTokenV1Base(oneToken).assetAtIndex(i);
            strategyBalance = IERC20(thisAsset).balanceOf(address(this));
            if(strategyBalance > 0) {
                _toVault(thisAsset, strategyBalance); 
            }
        }
        return true;
    }

    /// @notice The strategy should be given an allowance first. 

    function fromVault(address token, uint amount) external onlyOwnerOneTokenOrController override {
        _fromVault(token, amount);
    }

    function _fromVault(address token, uint amount) internal {
        IERC20(token).transferFrom(oneToken, address(this), amount);
        emit FromVault(msg.sender, token, amount);
    }

    function toVault(address token, uint amount) external onlyOwnerOneTokenOrController override {
        _toVault(token, amount);
    }

    function _toVault(address token, uint amount) internal {
        IERC20(token).transfer(oneToken, amount);
        emit ToVault(msg.sender, token, amount); 
    }
}
