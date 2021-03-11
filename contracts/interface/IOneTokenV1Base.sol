// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "./IICHICommon.sol";
// import "./IOneTokenFactory.sol";
import "./IERC20Extended.sol";

interface IOneTokenV1Base is IICHICommon, IERC20 {
    function MODULE_TYPE() external view returns(bytes32);
    function DEFAULT_ORACLE_FREQUENCY() external view returns(uint); 
    function factory() external view returns(address);
    function controller() external view returns(address);
    function mintMaster() external view returns(address);
    function memberToken() external view returns(address);
    function assets(address) external view returns(address, address, uint);
    function init(string memory name_, string memory symbol_, address oneTokenOracle_, address controller_,  address mintMaster_, address memberToken_, address collateral_) external;
    function changeController(address controller_) external;
    function changeOracle(address token, address oracle) external;
    function addAsset(address token, address oracle) external;
    function removeAsset(address token) external;
    function setStrategy(address token, address strategy) external;
    function removeStrategy(address token) external returns(bool success);
    function closeStrategy(address token) external returns(bool success);
    function withdrawFromStrategy(address strategy, address token, uint amount) external;
    function setStrategyAllowance(address token, uint amount) external;
    function balances(address token) external view returns(uint inVault, uint inStrategy);
    function collateralTokenCount() external view returns(uint);
    function collateralTokenAtIndex(uint index) external view returns(address);
    function isCollateral(address token) external view returns(bool);
    function otherTokenCount() external view  returns(uint);
    function otherTokenAtIndex(uint index) external view returns(address); 
    function isOtherToken(address token) external view returns(bool);
    function assetCount() external view returns(uint);
    function assetAtIndex(uint index) external view returns(address); 
    function isAsset(address token) external view returns(bool);
}
