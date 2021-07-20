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
	
	const uniswapV2Library = await UniswapV2Library.new(governance.address);
	await UniswapV2Library.setAsDeployed(uniswapV2Library);
	try { await UniswapOracleTWAPCompareV2.link(uniswapV2Library); } catch (e) {};

	const uniswapV2Factory = await UniswapV2Factory.deployed();
	const memberToken = await MemberToken.deployed();
	const collateralToken = await CollateralToken.deployed();

	const oneTokenFactory = await Factory.deployed();
	
	const uniswapTwapCompareOracleV2 = await UniswapOracleTWAPCompareV2.new(oneTokenFactory.address, 
		uniswapV2Factory.address, 
		collateralToken.address, 
		TEST_TIME_PERIOD_1, 
		TEST_TIME_PERIOD_2,
		"0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f");
	await UniswapOracleTWAPCompareV2.setAsDeployed(uniswapTwapCompareOracleV2);
	
	// console.log("*************************************************************");
	// console.log("* uniswapV2Factory:", uniswapV2Factory.address);
	// console.log("* uniswapTwapCompareOracleV2:", uniswapTwapCompareOracleV2.address);
	// console.log("*************************************************************");
};
