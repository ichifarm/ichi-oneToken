const
    TestMintMaster = artifacts.require("TestMintMaster"),
    testMintMasterName = "Test Incremental Mint Master";

module.exports = async () => {
    
    const testMintMaster = await TestMintMaster.new(testMintMasterName);
    TestMintMaster.setAsDeployed(testMintMaster)
    
    // console.log("*************************************************************");
    // console.log("* test mint master:", testMintMaster.address);
    // console.log("*************************************************************");
};
