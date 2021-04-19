const
	Factory = artifacts.require("OneTokenFactory"),	
	OraclePegged = artifacts.require("ICHIPeggedOracle"),
	CollateralToken = artifacts.require("CollateralToken"),
	oracleName = "ICHI Pegged Oracle";

module.exports = async () => {
	
	const collateralToken = await CollateralToken.new();
	const factory = await Factory.deployed();
	CollateralToken.setAsDeployed(collateralToken)
	const oraclePegged = await OraclePegged.new(factory.address, oracleName, collateralToken.address);
	OraclePegged.setAsDeployed(oraclePegged)
	
	// console.log("*************************************************************");
	// console.log("* oracle:", oraclePegged.address);
	// console.log("*************************************************************");
};
