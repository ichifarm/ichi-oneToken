const
    TestOracle = artifacts.require("TestOracle"),
    CollateralToken = artifacts.require("CollateralToken"),
    testOracleName = "ICHI Test Oracle";

module.exports = async () => {
    
    const collateralToken = await CollateralToken.new();
    CollateralToken.setAsDeployed(collateralToken)
    const testOracle = await TestOracle.new(testOracleName, collateralToken.address);
    TestOracle.setAsDeployed(testOracle)
    
    // console.log("*************************************************************");
    // console.log("* test oracle:", testOracle.address);
    // console.log("*************************************************************");
};
