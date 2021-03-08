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

    uint public minRatio;
    uint public maxRatio;
    uint public stepSize;
    uint public lastRatio;

    event IncrementalDeployed(address sender, address oneToken, address usdToken, address oneTokenOracle, address usdTokenOrale, uint minRatio, uint maxRatio, uint initialRatio);
    event UpdateMintingRatio(address sender, uint volatility, uint newRatio, uint maxOrderVolume);
    event StepSizeSet(address sender, uint stepSize);
    event MinRatioSet(address sender, uint minRatio);
    event MaxRatioSet(address sender, uint maxRatio);
    event RatioSet(address sender, uint ratio);

    /// @notice ratios are 18 digit decimals. e.g. 0.2% = 2/10 x 10^18 / 100    
    constructor(address oneToken_, address usdToken_, address oneTokenOracle_, address usdTokenOracle_, uint minRatio_, uint maxRatio_, uint stepSize_, uint initialRatio_) 
        MintMasterCommon(oneToken_, usdToken_, oneTokenOracle_, usdTokenOracle_)
    {
        require(minRatio_ <= maxRatio, "Incremental: minRatio must be <= maxRatio");
        require(maxRatio_ <= PRECISION * 100, "Incremental: maxRatio must be <= 100, 18 decimals");
        // Can be zero to prevent movement
        // require(stepSize > 0, "Incremental: stepSize must be > 0");
        require(stepSize < maxRatio - minRatio, "Incremental: stepSize must be < max - min.");
        require(initialRatio_ >= minRatio_, "Incremental: initial ratio must be >= min ratio.");
        require(initialRatio_ <= maxRatio_, "Incremental: initial ratio must be <= max ratio.");

        minRatio = minRatio_;
        maxRatio = maxRatio_;
        stepSize = stepSize_;
        lastRatio = initialRatio_;
        emit IncrementalDeployed(msg.sender, oneToken_, usdToken_, oneTokenOracle_, usdTokenOracle_, minRatio_, maxRatio_, initialRatio_);
    }
 
    /// @notice this implementation ignores volatility and relies exclusively on the oneToken oracle to check the peg
    function getMintingRatio() public view  override returns(uint ratio, uint maxOrderVolume) {
        // TODO: Everything is a USD oracle, so resolve the other way        
        address o = address(uint160(uint(IOneTokenV1(oneToken).getParam(USD_ORACLE_KEY))));
        (uint quote, /* uint volatility */ ) = IOracle(o).read(PRECISION);
        if(quote == PRECISION) return(ratio, INFINITE);
        ratio = lastRatio;
        maxOrderVolume = INFINITE;
        if(quote < PRECISION && lastRatio + stepSize <= maxRatio) {
            ratio += stepSize;
        }
        if(quote > PRECISION && lastRatio - stepSize >= minRatio) {
            ratio -= stepSize;
        }
    }

    // @dev this oracle price history is updated every time someone mints or redeems

    function updateMintingRatio() external override returns(uint ratio, uint maxOrderVolume) {
        address o = address(uint160(uint(IOneTokenV1(oneToken).getParam(USD_ORACLE_KEY))));
        IOracle(o).update();
        (ratio, maxOrderVolume) = getMintingRatio();
        lastRatio = ratio;
        /// @notice no event is emitted to save gas
        // emit UpdateMintingRatio(msg.sender, volatility, ratio, maxOrderVolume);
    }

    /**
     * Governance functions
     */

    function setStepSize(uint stepSize_) external onlyOwner {
        require(stepSize < maxRatio - minRatio, "Incremental: stepSize must be < max - min.");
        stepSize = stepSize_;
        emit StepSizeSet(msg.sender, stepSize_);
    }

    function setMinRatio(uint minRatio_) public onlyOwner {
        require(minRatio_ <= maxRatio, "Incremental: minRatio must be <= maxRatio");
        minRatio = minRatio_;
        if(minRatio > lastRatio) setRatio(minRatio);
        emit MinRatioSet(msg.sender, minRatio_);
    }

    function setMaxRatio(uint maxRatio_) public onlyOwner {
        require(maxRatio_ > minRatio, "Incremental: maxRatio must be > minRatio");
        require(maxRatio_ <= PRECISION, "Incremental: maxRatio must <= 100%");
        maxRatio = maxRatio_;
        if(maxRatio < lastRatio) setRatio(maxRatio_);
        emit MaxRatioSet(msg.sender, maxRatio_);
    }

    function setRatio(uint ratio_) public onlyOwner {
        require(ratio_ > 0, "Incremental: ratio must be > 0");
        require(ratio_ <= PRECISION, "Incremental: ratio must be <= 100%");
        require(ratio_ >= minRatio, "Incremental: ratio must be >= minRatio");
        require(ratio_ <= maxRatio, "Incremental: ratio must be <= maxRatio");
        lastRatio = ratio_;
        if(maxRatio < ratio_) setMaxRatio(ratio_);
        if(minRatio > ratio_) setMinRatio(ratio_);
        emit RatioSet(msg.sender, ratio_);
    }

}
