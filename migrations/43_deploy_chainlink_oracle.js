const
    ChainlinkOracleUSD = artifacts.require("ChainlinkOracleUSD"),
    Factory = artifacts.require("OneTokenFactory"),	
    CollateralToken = artifacts.require("CollateralToken"),
    OracleName = "ChainlinkOracle";

module.exports = async () => {
    const collateralToken = await CollateralToken.deployed();
    const factory = await Factory.deployed();
    const chainlinkOracle = await ChainlinkOracleUSD.new(factory.address, OracleName, collateralToken.address);
    ChainlinkOracleUSD.setAsDeployed(chainlinkOracle);
    
    // console.log("*************************************************************");
    // console.log("* chainlink USD oracle:", chainlinkOracle.address);
    // console.log("*************************************************************");
};
