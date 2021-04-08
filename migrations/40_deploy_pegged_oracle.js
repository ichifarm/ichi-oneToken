const
	OraclePegged = artifacts.require("ICHIPeggedOracle"),
	CollateralToken = artifacts.require("CollateralToken"),
	oracleName = "ICHI Pegged Oracle";

module.exports = async () => {
	
	const collateralToken = await CollateralToken.new();
	CollateralToken.setAsDeployed(collateralToken)
	const oraclePegged = await OraclePegged.new(oracleName, collateralToken.address);
	OraclePegged.setAsDeployed(oraclePegged)
	
	// console.log("*************************************************************");
	// console.log("* oracle:", oraclePegged.address);
	// console.log("*************************************************************");
};
