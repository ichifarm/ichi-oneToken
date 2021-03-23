const 
    Factory = artifacts.require("OneTokenFactory"),
    OneToken = artifacts.require("OneTokenV1"),
    ProxyAdmin = artifacts.require("OneTokenProxyAdmin"),
    ControllerNull = artifacts.require("NullController"),
    MintMasterIncremental = artifacts.require("Incremental"),
    mintMasterDesc = "Basic Incremental MintMaster";

var factory,
    implementation,
    proxyAdmin,
    controllerNull,
    mintMasterIncremental;

module.exports = async function (deployer, network, accounts) {
    
    await deployer.deploy(Factory);
    await deployer.deploy(OneToken);
    await deployer.deploy(ProxyAdmin);
    await deployer.deploy(ControllerNull);
    await deployer.deploy(MintMasterIncremental, mintMasterDesc);

    factory = await Factory.deployed();
    implementation = await OneToken.deployed();
    proxyAdmin = await ProxyAdmin.deployed();
    controllerNull = await ControllerNull.deployed();
    mintMasterIncremental = await MintMasterIncremental.deployed();

    console.log("*************************************************************");
    console.log("* factory:", factory.address);
    console.log("* implementation:", implementation.address);
    console.log("* proxyAdmin:", proxyAdmin.address);
    console.log("* controller, null:", controllerNull.address);
    console.log("* mintmaster:", mintMasterIncremental.address);
    console.log("*************************************************************");

};
