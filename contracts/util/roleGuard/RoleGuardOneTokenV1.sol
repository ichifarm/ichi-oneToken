// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

interface IOneTokenV1Minimal {

    // V1 functions
    function mint(address collateral, uint oneTokens) external;
    function redeem(address collateral, uint amount) external;
    function setMintingFee(uint fee) external;
    function setRedemptionFee(uint fee) external;
    function updateMintingRatio(address collateralToken) external returns(uint ratio, uint maxOrderVolume);

    // Base functions
    function changeController(address controller_) external;
    function changeMintMaster(address mintMaster_, address oneTokenOracle) external;
    function addAsset(address token, address oracle) external;
    function removeAsset(address token) external;
    function setStrategy(address token, address strategy, uint256 allowance) external;
    function executeStrategy(address token) external;
    function removeStrategy(address token) external;
    function closeStrategy(address token) external;
    function increaseStrategyAllowance(address token, uint256 amount) external;
    function decreaseStrategyAllowance(address token, uint256 amount) external;
    function setFactory(address newFactory) external;
}

interface IRoleGuardOneTokenV1 is IOneTokenV1Minimal {
    function erc20Transfer(IERC20 token, address to, uint256 value) external;
    function erc20Approve(IERC20 token, address spender, uint256 value) external;
    function erc20IncreaseAllowance(IERC20 token, address spender, uint256 value) external;
    function erc20DecreaseAllowance(IERC20 token, address spender, uint256 value) external;
    function executeTransaction(address _target, uint256 value, string memory signature, bytes memory data) external returns(bytes memory);
}

contract RoleGuardOneTokenV1 is IRoleGuardOneTokenV1, AccessControl {

    IOneTokenV1Minimal public target;
    using SafeERC20 for IERC20;

    bytes32 public constant mint_role = keccak256('function mint(address collateral, uint oneTokens)');
    bytes32 public constant redeem_role = keccak256('function redeem(address collateral, uint amount)');
    bytes32 public constant setMintingFee_role = keccak256('function setMintingFee(uint fee)');
    bytes32 public constant setRedemptionFee_role = keccak256('function setRedemptionFee(uint fee)');
    bytes32 public constant updateMintingRatio_role = keccak256('function updateMintingRatio(address collateralToken) ');
    bytes32 public constant changeController_role = keccak256('function changeController(address controller_)');
    bytes32 public constant changeMintMaster_role = keccak256('function changeMintMaster(address mintMaster_, address oneTokenOracle)');
    bytes32 public constant addAsset_role = keccak256('function addAsset(address token, address oracle)');
    bytes32 public constant removeAsset_role = keccak256('function removeAsset(address token)');
    bytes32 public constant setStrategy_role = keccak256('function setStrategy(address token, address strategy, uint256 allowance)');
    bytes32 public constant executeStrategy_role = keccak256('function executeStrategy(address token)');
    bytes32 public constant removeStrategy_role = keccak256('function removeStrategy(address token)');
    bytes32 public constant closeStrategy_role = keccak256('function closeStrategy(address token)');
    bytes32 public constant increaseStrategyAllowance_role = keccak256('function increaseStrategyAllowance(address token, uint256 amount)');
    bytes32 public constant decreaseStrategyAllowance_role = keccak256('function decreaseStrategyAllowance(address token, uint256 amount)');
    bytes32 public constant setFactory_role = keccak256('function setFactory(address newFactory)');
    bytes32 public constant TREASURER_ROLE = keccak256('Role Guard Treasurer');

    event Deployed(address superAdmin, IOneTokenV1Minimal target);
    event ExecuteTransaction(address target, uint256 value, string signature, bytes data, bytes returnData);

    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), 'RoleGuardOneTokenV1::403 - unauthorized');
        _;
    }

    constructor(IOneTokenV1Minimal _target) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        target = _target;
        emit Deployed(msg.sender, _target);
    }

    // V1 functions

    function mint(address collateral, uint256 oneTokens) external override onlyRole(mint_role) {
        target.mint(collateral, oneTokens);
    }
    function redeem(address collateral, uint256 amount) external override onlyRole(redeem_role) {
        target.redeem(collateral, amount);
    }
    function setMintingFee(uint256 fee) external override onlyRole(setMintingFee_role) {
        target.setMintingFee(fee);
    }
    function setRedemptionFee(uint256 fee) external override onlyRole(setRedemptionFee_role) {
        target.setRedemptionFee(fee); 
    }
    function updateMintingRatio(address collateralToken) external override onlyRole(updateMintingRatio_role) returns(uint256 ratio, uint256 maxOrderVolume) {
        return target.updateMintingRatio(collateralToken);
    }

    // Base functions

    function changeController(address controller_) external override onlyRole(changeController_role) {
        target.changeController(controller_);
    }
    function changeMintMaster(address mintMaster_, address oneTokenOracle) external override onlyRole(changeMintMaster_role) {
        target.changeMintMaster(mintMaster_, oneTokenOracle);
    }
    function addAsset(address token, address oracle) external override onlyRole(addAsset_role) {
        target.addAsset(token, oracle);
    }
    function removeAsset(address token) external override onlyRole(removeAsset_role) {
        target.removeAsset(token);
    }
    function setStrategy(address token, address strategy, uint256 allowance) external override onlyRole(setStrategy_role) {
        target.setStrategy(token, strategy, allowance);
    }
    function executeStrategy(address token) external override onlyRole(executeStrategy_role) {
        target.executeStrategy(token);
    }
    function removeStrategy(address token) external override onlyRole(removeStrategy_role) {
        target.removeStrategy(token);
    }
    function closeStrategy(address token) external override onlyRole(closeStrategy_role) {
        target.closeStrategy(token);
    }
    function increaseStrategyAllowance(address token, uint256 amount) external override onlyRole(increaseStrategyAllowance_role) {
        target.increaseStrategyAllowance(token, amount);
    }
    function decreaseStrategyAllowance(address token, uint256 amount) external override onlyRole(decreaseStrategyAllowance_role) {
        target.decreaseStrategyAllowance(token, amount);
    }
    function setFactory(address newFactory) external override onlyRole(setFactory_role) {
        target.setFactory(newFactory);
    }

    // ERC20 operations facilitate management of funds held by this contract

    function erc20Transfer(IERC20 token, address to, uint256 value) external override onlyRole(TREASURER_ROLE) {
        token.safeTransfer(to, value);
    }

    function erc20Approve(IERC20 token, address spender, uint256 value) external override onlyRole(TREASURER_ROLE) {
        token.safeApprove(spender, value);
    }

    function erc20IncreaseAllowance(IERC20 token, address spender, uint256 value) external override onlyRole(TREASURER_ROLE) {
        token.safeIncreaseAllowance(spender, value);
    }

    function erc20DecreaseAllowance(IERC20 token, address spender, uint256 value) external override onlyRole(TREASURER_ROLE) {
        token.safeDecreaseAllowance(spender, value);
    }

    /**
      Arbitrary execution addresses novel edge cases that are not anticipated in advance
     */

    function executeTransaction(address _target, uint256 value, string memory signature, bytes memory data) external override onlyRole(DEFAULT_ADMIN_ROLE) returns (bytes memory) {
        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = _target.call{ value: value }(callData);
        require(success, "RoleGuardOneTokenV1::executeTransaction: Transaction execution reverted.");
        emit ExecuteTransaction(_target, value, signature, data, returnData);
        return returnData;
    }

}
