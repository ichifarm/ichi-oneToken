const 
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
    CollateralToken = artifacts.require("CollateralToken"),
    oracleName = "ICHI Pegged Oracle";

var oraclePegged,
    collateralToken;

module.exports = async function (deployer, network, accounts) {

    collateralToken = await CollateralToken.deployed();
    oraclePegged = await deployer.deploy(OraclePegged, oracleName, collateralToken.address);

    console.log("*************************************************************");
    console.log("* oracle:", oraclePegged.address);
    console.log("*************************************************************");
};
