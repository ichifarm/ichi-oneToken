const
    Factory = artifacts.require("OneTokenFactory"),
    TestMintMaster = artifacts.require("TestMintMaster"),
    testMintMasterName = "Test Incremental Mint Master";

module.exports = async () => {
    
    const factory = await Factory.deployed();
    const testMintMaster = await TestMintMaster.new(factory.address, testMintMasterName);
    TestMintMaster.setAsDeployed(testMintMaster)
    
    // console.log("*************************************************************");
    // console.log("* test mint master:", testMintMaster.address);
    // console.log("*************************************************************");
};
