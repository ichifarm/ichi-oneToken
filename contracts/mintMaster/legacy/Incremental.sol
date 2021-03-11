// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../MintMasterCommon.sol";
import "../../interface/IOneTokenV1.sol";
import "../../interface/IOracle.sol";

/**
 * @notice Separate ownable instances can be managed by separate governing authorities.
 * Immutable windowSize and granularity changes require a new oracle contract. 
 */

contract Incremental is MintMasterCommon {
    
    struct Parameters {
        bool set;
        uint minRatio;
        uint maxRatio;
        uint stepSize;
        uint lastRatio;      
    }

    mapping(address => Parameters) public parameters;

    event Deployed(address sender, string description);
    event Initialized(address sender, address oneTokenOracle);
    event SetParams(address sender, address oneToken, address usdToken, address oneTokenOracle, address usdTokenOracle, uint minRatio, uint maxRatio, uint initialRatio);
    
    // SetParams(msg.sender, oneToken, usdToken_, oneTokenOracle_, usdTokenOracle_, minRatio, maxRatio, initialRatio);
    event UpdateMintingRatio(address sender, uint volatility, uint newRatio, uint maxOrderVolume);
    event StepSizeSet(address sender, uint stepSize);
    event MinRatioSet(address sender, uint minRatio);
    event MaxRatioSet(address sender, uint maxRatio);
    event RatioSet(address sender, uint ratio);

    /// @notice ratios are 18 digit decimals. e.g. 0.2% = 2/10 x 10^18 / 100    
    constructor(string memory description_) 
        MintMasterCommon(description_)
    {
        emit Deployed(msg.sender, description_);
    }

    function init(address oneTokenOracle) external override {
        Parameters storage p = parameters[msg.sender];
        require(p.set, "Incremental: set parameters before initializing.");
        _initMintMaster(oneTokenOracle);
        emit Initialized(msg.sender, oneTokenOracle);
   
    }

    function setParams(
        address oneToken, 
        address usdToken_, 
        address oneTokenOracle_, 
        address usdTokenOracle_, 
        uint minRatio, 
        uint maxRatio, 
        uint stepSize, 
        uint initialRatio
    ) 
        external
        onlyTokenOwner(oneToken)
    {
        require(minRatio <= maxRatio, "Incremental: minRatio must be <= maxRatio");
        require(maxRatio <= PRECISION * 100, "Incremental: maxRatio must be <= 100, 18 decimals");
        // Can be zero to prevent movement
        // require(stepSize > 0, "Incremental: stepSize must be > 0");
        require(stepSize < maxRatio - minRatio, "Incremental: stepSize must be < max - min.");
        require(initialRatio >= minRatio, "Incremental: initial ratio must be >= min ratio.");
        require(initialRatio <= maxRatio, "Incremental: initial ratio must be <= max ratio.");
        Parameters storage p = parameters[oneToken];
        p.minRatio = minRatio;
        p.maxRatio = maxRatio;
        p.stepSize = stepSize;
        p.lastRatio = initialRatio;
        p.set = true;
        emit SetParams(msg.sender, oneToken, usdToken_, oneTokenOracle_, usdTokenOracle_, minRatio, maxRatio, initialRatio);
    }
 
    /// @notice this implementation ignores volatility and relies exclusively on the oneToken oracle to check the peg
    function getMintingRatio() external view override returns(uint ratio, uint maxOrderVolume) {
        return getMintingRatio(msg.sender);
    }
    
    function getMintingRatio(address oneToken) public view override returns(uint ratio, uint maxOrderVolume) {       
        Parameters storage p = parameters[oneToken];
        address o = oneTokenOracles[oneToken];

        (uint quote, /* uint volatility */ ) = IOracle(o).read(oneToken, PRECISION);
        if(quote == PRECISION) return(ratio, INFINITE);
        ratio = p.lastRatio;
        uint stepSize = p.stepSize;
        uint lastRatio = p.lastRatio;
        maxOrderVolume = INFINITE;
        if(quote < PRECISION && ratio + stepSize <= p.maxRatio) {
            ratio += stepSize;
        }
        if(quote > PRECISION && lastRatio - stepSize >= p.minRatio) {
            ratio -= stepSize;
        }
    }

    // @dev oracle price history is updated every time someone mints or redeems

    function updateMintingRatio() external override returns(uint ratio, uint maxOrderVolume) {
        return _updateMintingRatio(msg.sender);
    }

    function updateMintingRatio(address oneToken) external onlyTokenOwner(oneToken) override returns(uint ratio, uint maxOrderVolume) {
        return _updateMintingRatio(oneToken);
    }
    
    function _updateMintingRatio(address oneToken) private returns(uint ratio, uint maxOrderVolume) {
        Parameters storage p = parameters[oneToken];
        address o = oneTokenOracles[oneToken];
        IOracle(o).update(oneToken);
        (ratio, maxOrderVolume) = getMintingRatio(oneToken);
        p.lastRatio = ratio;
        /// @notice no event is emitted to save gas
        // emit UpdateMintingRatio(msg.sender, volatility, ratio, maxOrderVolume);
    }

    /**
     * Governance functions
     */

    function setStepSize(address oneToken, uint stepSize) public onlyOwner {
        Parameters storage p = parameters[oneToken];
        require(stepSize < p.maxRatio - p.minRatio, "Incremental: stepSize must be < max - min.");
        p.stepSize = stepSize;
        emit StepSizeSet(msg.sender, stepSize);
    }

    function setMinRatio(address oneToken, uint minRatio) public onlyOwner {
        Parameters storage p = parameters[oneToken];
        require(minRatio <= p.maxRatio, "Incremental: minRatio must be <= maxRatio");
        p.minRatio = minRatio;
        if(minRatio > p.lastRatio) setRatio(oneToken, minRatio);
        emit MinRatioSet(msg.sender, minRatio);
    }

    function setMaxRatio(address oneToken, uint maxRatio) public onlyOwner {
        Parameters storage p = parameters[oneToken];
        require(maxRatio > p.minRatio, "Incremental: maxRatio must be > minRatio");
        require(maxRatio <= PRECISION, "Incremental: maxRatio must <= 100%");
        p.maxRatio = maxRatio;
        if(maxRatio < p.lastRatio) setRatio(oneToken, maxRatio);
        emit MaxRatioSet(msg.sender, maxRatio);
    }

    function setRatio(address oneToken, uint ratio) public onlyOwner {
        Parameters storage p = parameters[oneToken];
        require(ratio > 0, "Incremental: ratio must be > 0");
        require(ratio <= PRECISION, "Incremental: ratio must be <= 100%");
        require(ratio >= p.minRatio, "Incremental: ratio must be >= minRatio");
        require(ratio <= p.maxRatio, "Incremental: ratio must be <= maxRatio");
        p.lastRatio = ratio;
        if(p.maxRatio < ratio) setMaxRatio(oneToken, ratio);
        if(p.minRatio > ratio) setMinRatio(oneToken, ratio);
        emit RatioSet(msg.sender, ratio);
    }

}
