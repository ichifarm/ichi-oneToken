// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "../../lib/AddressSet.sol";
import "../../oracle/OracleCommon.sol";
import "../../interface/IERC20Extended.sol";
import "../../_chainlink/interfaces/AggregatorV3Interface.sol";
import "../../_openzeppelin/math/SafeMath.sol";

/**
 @notice Generic ChainLink Oracle  
 */

contract ChainlinkOracle is OracleCommon {

    using SafeMath for uint256;
    using AddressSet for AddressSet.Set;

    // only accepting USD Chainlink oracles, which all use 8 decimals
    uint256 private constant SHIFT_DECIMALS = 10 ** 10;

    // token address => chainlink oracle address
    mapping(address => address) public chainlinkOracles; 
    // interable key set with delete
    AddressSet.Set chainlinkOraclesSet;
    
    event RegisterChainlinkOracle(address sender, address token, address oracle);
    event UpdateChainlinkOracle(address sender, address token, address oracle);
    event UnregisterChainlinkOracle(address sender, address token);
    
    /** 
     @param oneTokenFactory_ oneToken factory to bind to
     @param description_ description has no bearing on logic
     @param indexToken_ token to use for price quotes
     */
    constructor(address oneTokenFactory_, string memory description_, address indexToken_)
        OracleCommon(oneTokenFactory_, description_, indexToken_) {
    }

    /**
     @notice update is called when a oneToken wants to persist observations
     @dev there is nothing to do in this case
     */
    function update(address /* token */) external override {}

    /**
     @notice returns equivalent amount of index tokens for an amount of baseTokens and volatility metric
     @param token address of the token
     @param amountTokens quantity, token native precision
     @param amountUsd US dollar equivalent, precision 18
     @param volatility metric for future use-cases
     */
    function read(address token, uint256 amountTokens) external view override returns(uint256 amountUsd, uint256 volatility) {
        uint256 normalizedAmountUsd = tokensToNormalized(token, amountTokens);
        amountUsd = (normalizedAmountUsd.mul(getThePrice(token))).div(PRECISION);
        volatility = 1;
    }

    /**
     @notice returns the tokens needed to reach a target usd value
     @param token address of the token
     @param amountUsd Usd required, precision 18
     @param amountTokens tokens required, token native precision
     @param volatility metric for future use-cases
     */
    function amountRequired(address token, uint256 amountUsd) external view override returns(uint256 amountTokens, uint256 volatility) {
        uint256 normalizedAmountTokens = amountUsd.mul(PRECISION).div(getThePrice(token));
        amountTokens = normalizedToTokens(token, normalizedAmountTokens);
        volatility = 1;
    }

    /**
     * @notice returns the latest price for the token
     * @param token address of the token
     */
    function getThePrice(address token) public view returns (uint256 price) {
        require(chainlinkOraclesSet.exists(token), "ChainlinkOracle: unknown token");
        (
            , 
            int256 price_,
            ,
            ,
            
        ) = AggregatorV3Interface(chainlinkOracles[token]).latestRoundData();
        require(price_ > 0); // price oracle responded 0, or negative. No event emitted because this is a view function.
        price = uint256(price_);
        price = price.mul(SHIFT_DECIMALS);  //price is natively in 8 decimals make it 18
    }

    /*********************************
     * Discoverable Internal Structure
     *********************************/

    /**
     * @notice count registered Chainlink oracles
     * @param count number of registered Chainlink oracles
     */
    function oraclesCount() external view returns(uint256 count) {
        count = chainlinkOraclesSet.count();
    }

    /**
     * @notice enumerate the registered Chainlink oracles
     * @param index row number to inspect
     * @param oracle address of the Chainlink oracle
     */
    function oracleAtIndex(uint256 index) external view returns(address oracle) {
        require(chainlinkOraclesSet.count() > index, "ChainlinkOracle: index number is too high");
        oracle = chainlinkOracles[chainlinkOraclesSet.keyAtIndex(index)];
    }

    /**
     * @notice enumerate the registered tokens
     * @param index row number to inspect
     * @param token address of the registered token
     */
    function tokenAtIndex(uint256 index) external view returns(address token) {
        require(chainlinkOraclesSet.count() > index, "ChainlinkOracle: index number is too high");
        token = chainlinkOraclesSet.keyAtIndex(index);
    }

    /*********************************
     * CRUD
     *********************************/

    /**
     * @notice register a new Chainlink oracle
     * @param token address of the token to register the oracle for
     * @param oracle address of the Chainlink oracle to register
     */
    function registerOracle(address token, address oracle) external onlyOwner {
        require(AggregatorV3Interface(oracle).decimals() == 8, "ChainlinkOracle: the oracle must return USD values");
        chainlinkOraclesSet.insert(token, "ChainlinkOracle: oracle is already registered");
        chainlinkOracles[token] = oracle;
        emit RegisterChainlinkOracle(msg.sender, token, oracle);
    }

    /**
     * @notice unregister a Chainlink oracle
     * @param token address of the token to unregister the oracle for
     */
    function unregisterOracle(address token) external onlyOwner {
        chainlinkOraclesSet.remove(token, "ChainlinkOracle: unknown token");
        delete chainlinkOracles[token];
        emit UnregisterChainlinkOracle(msg.sender, token);
    }

    /**
     * @notice replace oracle for the given token
     * @param token address of the token to have the oracle replaced
     * @param oracle address of the new Chainlink oracle to be used for the token
     */
    function updateOracle(address token, address oracle) external onlyOwner {
        require(chainlinkOraclesSet.exists(token), "ChainlinkOracle: unknown token");
        require(AggregatorV3Interface(oracle).decimals() == 8, "ChainlinkOracle: the oracle must return USD values");
        chainlinkOracles[token] = oracle;
        emit UpdateChainlinkOracle(msg.sender, token, oracle);
    }

}