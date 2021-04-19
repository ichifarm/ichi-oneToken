const
    TestOracle = artifacts.require("TestOracle"),
    Factory = artifacts.require("OneTokenFactory"),	
    CollateralToken = artifacts.require("CollateralToken"),
    testOracleName = "ICHI Test Oracle";

module.exports = async () => {
    
    const collateralToken = await CollateralToken.new();
    CollateralToken.setAsDeployed(collateralToken);
    const factory = await Factory.deployed();
    const testOracle = await TestOracle.new(factory.address, testOracleName, collateralToken.address);
    TestOracle.setAsDeployed(testOracle)
    
    // console.log("*************************************************************");
    // console.log("* test oracle:", testOracle.address);
    // console.log("*************************************************************");
};
