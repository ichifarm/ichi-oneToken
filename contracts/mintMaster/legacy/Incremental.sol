// SPDX-License-Identifier: Unlicensed

pragma solidity 0.7.6;

import "../MintMasterCommon.sol";
import "../../interface/IOneTokenV1.sol";
import "../../_openzeppelin/access/Ownable.sol";

/**
 * @notice Separate ownable instances can be managed by separate governing authorities.
 * Immutable windowSize and granularity changes require a new oracle contract. 
 */

contract Incremental is MintMasterCommon, Ownable {

    uint constant ONE_DOLLAR = 10 * 18;
    uint constant INFINITE = uint(0-1);
    uint constant ONE_HUNDRED_PERCENT = 100 * 10 ** 18;

    uint public periodSeconds;
    uint public minRatio;
    uint public maxRatio;
    uint public lastRatio;

    event PeriodSet(address sender, uint periodSeconds);
    event MinRatioSet(address sender, uint minRatio);
    event MaxRatioSet(address sender, uint maxRatio);
    event RatioSet(address sender, uint ratio);

    constructor(address oneToken_, uint periodSeconds_, uint minRatio_, uint maxRatio_, uint initialRatio_) 
        MintMasterCommon(oneToken_)
    {
        require(periodSeconds_ > 0, "Incremental: periodSeconds cannot be 0.");
        require(minRatio_ <= maxRatio, "Incremental: minRatio must be <= maxRatio");
        require(maxRatio_ <= ONE_HUNDRED_PERCENT, "Incremental: maxRatio must <= 100%");
        require(initialRatio_ >= minRatio_, "Incremental: initial ratio must be >= min ratio.");
        require(initialRatio_ <= maxRatio_, "Incremental: initial ratio must be <= max ratio.");

        periodSeconds = periodSeconds_;
        minRatio = minRatio_;
        maxRatio = maxRatio_;
        lastRatio = initialRatio_;
    }
    
    function getMintingRatio(uint volatility) public view override returns(uint ratio, uint maxOrderVolume) {
        // TODO: RESOLVE WHICH ORACLE TO USE FOR ONETOKEN'S REFERENCE PRICE, COMPARE TO $1 AND ADJUST
    }

    function updateMintingRatio(uint volatility) external override returns(uint ratio, uint maxOrderVolume) {
        (ratio, maxOrderVolume) = getMintingRatio(volatility);
        lastRatio = ratio;
        // @notice this implementation ignores volatility and places no limit on order volume
        maxOrderVolume = INFINITE;
        // @notice no event is emitted to optimze gas
    }

    /**
     * Governance functions
     */

    function setPeriod(uint periodSeconds_) external onlyOwner {
        require(periodSeconds_ > 0, "Incremental: periodSeconds cannot be 0.");
        periodSeconds = periodSeconds_;
        emit PeriodSet(msg.sender, periodSeconds_);
    }

    function setMinRatio(uint minRatio_) external onlyOwner {
        require(minRatio_ <= maxRatio, "Incremental: minRatio must be <= maxRatio");
        minRatio = minRatio_;
        if(minRatio > lastRatio) setRatio(minRatio);
        emit MinRatioSet(msg.sender, minRatio_);
    }

    function setMaxRatio(uint maxRatio_) external onlyOwner {
        require(maxRatio_ > minRatio, "Incremental: maxRatio must be > minRatio");
        require(maxRatio_ < ONE_HUNDRED_PERCENT, "Incremental: maxRatio must <= 100%");
        maxRatio = maxRatio_;
        if(maxRatio < lastRatio) setRatio(maxRatio_);
        emit MaxRatioSet(msg.sender, maxRatio_);
    }

    function setRatio(uint ratio_) public onlyOwner {
        require(ratio_ > 0, "Incremental: ratio must be > 0");
        require(ratio_ <= ONE_HUNDRED_PERCENT, "Incremental: ratio must be <= 100%");
        require(ratio_ >= minRatio, "Incremental: ratio must be >= minRatio");
        require(ratio_ <= maxRatio, "Incremental: ratio must be <= maxRatio");
        lastRatio = ratio_;
        emit RatioSet(msg.sender, ratio_);
    }

}
