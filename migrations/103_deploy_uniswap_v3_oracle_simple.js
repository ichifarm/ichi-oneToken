const
	Factory = artifacts.require("OneTokenFactory"),
    OraclePegged = artifacts.require("ICHIPeggedOracle"),
	UniswapV3OracleSimple = artifacts.require("UniswapV3OracleSimple");

const HOUR_PERIOD = 3600
const DAY_PERIOD = 86400
const _5MIN_PERIOD = 300
const POOL_FEE = 10000
const ETH_POOL_FEE = 500

const uni_v3_factory = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const fuse = '0x970B9bB2C0444F5E81e9d0eFb84C8ccdcdcAf84d'
const _1inch = '0x111111111117dC0aa78b770fA6A738034120C302'
const gtc = '0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F'
const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const usdt = '0xdac17f958d2ee523a2206206994597c13d831ec7'

const moduleType = {
    version: 0,
    controller: 1,
    strategy: 2,
    mintMaster: 3,
    oracle: 4,
    voterRoll: 5
}


module.exports = async () => {
	
	const [governance] = await ethers.getSigners();
	
	const oneTokenFactory = await Factory.deployed();

	const oraclePegged = await OraclePegged.deployed();

	const uniswapV3OracleSimple = await UniswapV3OracleSimple.new(oneTokenFactory.address, 
		uni_v3_factory, usdc, ETH_POOL_FEE);
	await uniswapV3OracleSimple.registerToken(gtc, false, DAY_PERIOD, POOL_FEE);
	await uniswapV3OracleSimple.registerToken(_1inch, true, HOUR_PERIOD, POOL_FEE);
	await uniswapV3OracleSimple.registerToken(usdt, true, _5MIN_PERIOD, ETH_POOL_FEE);

	await UniswapV3OracleSimple.setAsDeployed(uniswapV3OracleSimple);
    await oneTokenFactory.admitModule(uniswapV3OracleSimple.address, moduleType.oracle, "V3 oracle", "url");
	
	await oneTokenFactory.admitForeignToken(fuse, false, oraclePegged.address);
	await oneTokenFactory.admitForeignToken(gtc, false, oraclePegged.address);
	await oneTokenFactory.admitForeignToken(_1inch, false, oraclePegged.address);
    await oneTokenFactory.admitForeignToken(usdc, true, oraclePegged.address);
	await oneTokenFactory.admitForeignToken(usdt, false, oraclePegged.address);
	
	// console.log("*************************************************************");
	// console.log("* uniswapV3OracleSimple:", uniswapV3OracleSimple.address);
	// console.log("*************************************************************");
};
