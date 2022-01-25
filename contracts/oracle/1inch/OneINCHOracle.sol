// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "../../oracle/OracleCommon.sol";
import "../../interface/IERC20Extended.sol";
import "../../_chainlink/interfaces/AggregatorV3Interface.sol";
import "../../_openzeppelin/math/SafeMath.sol";

/**
 @notice 1INCH/USD ChainLink Oracle  
 */

contract OneINCHOracle is OracleCommon {

    using SafeMath for uint256;

    uint private constant SHIFT_DECIMALS = 10 ** 10;
    AggregatorV3Interface internal priceFeed;


    /** 
     @param oneTokenFactory_ oneToken factory to bind to
     @param description_ description has no bearing on logic
     @param indexToken_ token to use for price quotes
     */
    constructor(address oneTokenFactory_, string memory description_, address indexToken_, address chainlink_)
        OracleCommon(oneTokenFactory_, description_, indexToken_) {
        priceFeed = AggregatorV3Interface(chainlink_);
    }

    /**
     @notice update is called when a oneToken wants to persist observations
     @dev there is nothing to do in this case
     */
    function update(address /* token */) external override {}

    /**
     @notice returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     // param address unused token address
     @param amountTokens quantity, token native precision
     @param amountUsd US dollar equivalentm, precision 18
     @param volatility metric for future use-cases
     */
    function read(address /* token */, uint256 amountTokens) public view override returns(uint256 amountUsd, uint256 volatility) {
        amountUsd = (amountTokens.mul(getThePrice())).div(PRECISION);
        volatility = 1;
    }

    /**
     @notice returns the tokens needed to reach a target usd value
     // param address unused token address
     @param amountUsd Usd required, precision 18
     @param amountTokens tokens required, token native precision
     @param volatility metric for future use-cases
     */
    function amountRequired(address /* token */, uint256 amountUsd) external view override returns(uint256 amountTokens, uint256 volatility) {
        amountTokens = amountUsd.mul(PRECISION).div(getThePrice());
        volatility = 1;
    }

    /**
     * Returns the latest price
     */
    function getThePrice() public view returns (uint256 price) {
        (
            , 
            int256 price_,
            ,
            ,
            
        ) = priceFeed.latestRoundData();
        require(price_ > 0); // price oracle responded 0, or negative. No event emitted because this is a view function.
        price = uint256(price_);
        price = price.mul(SHIFT_DECIMALS);  //price is natively in 8 decimals make it 18
    }
}