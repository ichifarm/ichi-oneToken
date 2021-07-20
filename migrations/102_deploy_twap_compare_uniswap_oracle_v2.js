const
	Factory = artifacts.require("OneTokenFactory"),
	UniswapV2Factory = artifacts.require("UniswapV2Factory"),
	UniswapV2Library = artifacts.require("UniswapV2Library"),
	UniswapOracleTWAPCompareV2 = artifacts.require("UniswapOracleTWAPCompareV2"),
	MemberToken = artifacts.require("MemberToken"),
	CollateralToken = artifacts.require("CollateralToken");

const TEST_TIME_PERIOD_1 = 3600
const TEST_TIME_PERIOD_2 = 86400
	
module.exports = async () => {
	
	const [governance] = await ethers.getSigners();
	
	const uniswapV2Factory = await UniswapV2Factory.deployed();
	const memberToken = await MemberToken.deployed();
	const collateralToken = await CollateralToken.deployed();

	const oneTokenFactory = await Factory.deployed();
	
	const uniswapTwapCompareOracleV2 = await UniswapOracleTWAPCompareV2.new(oneTokenFactory.address, 
		uniswapV2Factory.address, 
		collateralToken.address, 
		TEST_TIME_PERIOD_1, 
		TEST_TIME_PERIOD_2,
		"0x61cacdcfab7852747f947cc6dfc5dacf92028ee947eba084a5309e71a2b2203f");
	await UniswapOracleTWAPCompareV2.setAsDeployed(uniswapTwapCompareOracleV2);
	
	// console.log("*************************************************************");
	// console.log("* uniswapV2Factory:", uniswapV2Factory.address);
	// console.log("* uniswapTwapCompareOracleV2:", uniswapTwapCompareOracleV2.address);
	// console.log("*************************************************************");
};
