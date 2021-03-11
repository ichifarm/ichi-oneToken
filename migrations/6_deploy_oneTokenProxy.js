const 
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1");

var factory,
    implementation;

module.exports = async function (deployer, network, accounts) {
    
    let governance = accounts[0];

    factory = await Factory.deployed();
    implementation = await OneToken.deployed();

    console.log("*************************************************************");
    console.log("* factory:", factory.address);
    console.log("* implementation:", implementation.address);

    let oneTokenReceipt = await factory.deployOneTokenProxy(governance, implementation.address);
    console.log("* oneTokenProxy:", oneTokenReceipt.logs[2].args["newOneTokenProxy"]);   
    console.log("*************************************************************");

};
