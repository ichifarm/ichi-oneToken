// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;
pragma abicoder v2;

import "./IModule.sol";
import "../_openzeppelin/token/ERC20/IERC20.sol";

interface IOneTokenV1Base is IModule, IERC20 {

    function init(address _controller, address _mintMaster, /*address _voterRoll,*/ address _memberToken, address _collateral) external;
    function changeOracle(address token, address oracle) external;
    function changeFrequency(address token, uint frequency) external;
    function removeAsset(address token) external;
    function setStrategy(address token, address strategy) external;
    function removeStrategy(address token) external returns(bool);
    function closeStrategy(address token) external returns(bool);

    function setModuleParam(address foreignToken, ModuleType moduleType, bytes32 key, bytes32 value) external;

    function collateralTokenCount() external view returns(uint);
    function collateralTokenAtIndex(uint index) external view returns(address);

    function otherTokenCount() external view returns(uint);
    function otherTokenAtIndex(uint index) external view returns(address); 

    function assetCount() external view returns(uint);
    function assetAtIndex(uint index) external view returns(address); 
    
}
