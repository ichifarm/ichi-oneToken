const
    ChainlinkOracle = artifacts.require("ChainlinkOracle"),
    Factory = artifacts.require("OneTokenFactory"),	
    CollateralToken = artifacts.require("CollateralToken"),
    OracleName = "ChainlinkOracle";

module.exports = async () => {
    const collateralToken = await CollateralToken.new();
    CollateralToken.setAsDeployed(collateralToken);
    const factory = await Factory.deployed();
    const chainlinkOracle = await ChainlinkOracle.new(factory.address, OracleName, collateralToken.address);
    ChainlinkOracle.setAsDeployed(chainlinkOracle);
    
    // console.log("*************************************************************");
    // console.log("* chainlink oracle:", chainlinkOracle.address);
    // console.log("*************************************************************");
};
