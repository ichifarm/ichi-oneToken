const
    RenFILOracle = artifacts.require("RenFILOracle"),
    Factory = artifacts.require("OneTokenFactory"),	
    CollateralToken = artifacts.require("CollateralToken"),
    OracleName = "renFILOracle";

module.exports = async () => {
    const mainnet_chainlink = '0x1A31D42149e82Eb99777f903C08A2E41A00085d3';
    const collateralToken = await CollateralToken.new();
    CollateralToken.setAsDeployed(collateralToken);
    const factory = await Factory.deployed();
    const renFILOracle = await RenFILOracle.new(factory.address, OracleName, collateralToken.address,mainnet_chainlink);
    RenFILOracle.setAsDeployed(renFILOracle);
    
    // console.log("*************************************************************");
    // console.log("* test oracle:", testOracle.address);
    // console.log("*************************************************************");
};
