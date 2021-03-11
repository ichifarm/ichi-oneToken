// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../interface/IStrategy.sol";
import "../interface/IOneTokenV1Base.sol";
import "../_openzeppelin/token/ERC20/IERC20.sol";
import "../common/ICHIModuleCommon.sol";

contract StrategyCommon is IStrategy, ICHIModuleCommon {

    address public override oneToken;
    bytes32 constant public override MODULE_TYPE = keccak256(abi.encodePacked("ICHI V1 Strategy Implementation"));

    event Deployed(address sender);
    event Initialized(address oneToken);
    event VaultAllowance(address sender, address token, uint amount);
    event FromVault(address sender, address token, uint amount);
    event ToVault(address sender, address oken, uint amount);

    /// @dev strategy may have an overall owner. This is token-level authority.
    modifier tokenOwnerOrController {
        IOneTokenV1Base thisToken = IOneTokenV1Base(oneToken);
        if(msg.sender != oneToken) {
            if(msg.sender != thisToken.controller()) {
                require(msg.sender == thisToken.owner(), "StrategyCommon: not token controller or owner.");
            }
        }
        _;
    }

    constructor(string memory description) 
        ICHIModuleCommon(ModuleType.Strategy, description)
    {
        emit Deployed(msg.sender);
    }

    function init() external override virtual {}

    /// @dev Strategies are singletons, exclusively bound to one oneToken vault. 
    
    function _initStrategy() internal {
        require(oneToken == NULL_ADDRESS, "StrategyCommon: strategy is already bound to another oneToken.");
        oneToken = msg.sender;
        emit Initialized(msg.sender);
    }

    function setAllowance(address token, uint amount) external tokenOwnerOrController override {
        if(amount == 0) amount = INFINITE;
        IERC20(token).approve(oneToken, amount);
        emit VaultAllowance(msg.sender, token, amount);
    }
  
    function closeAllPositions() external tokenOwnerOrController override returns(bool success) {
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

    function fromVault(address token, uint amount) external tokenOwnerOrController override {
        _fromVault(token, amount);
    }

    function _fromVault(address token, uint amount) internal {
        IERC20(token).transferFrom(oneToken, address(this), amount);
        emit FromVault(msg.sender, token, amount);
    }

    function toVault(address token, uint amount) external tokenOwnerOrController override {
        _toVault(token, amount);
    }

    function _toVault(address token, uint amount) internal {
        IERC20(token).transfer(oneToken, amount);
        emit ToVault(msg.sender, token, amount); 
    }
}
