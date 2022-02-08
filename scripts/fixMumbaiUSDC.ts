import { ethers, deployments, network } from "hardhat";

// Replacing the mumbai USDC address

async function main() {
  const { get } = deployments;

  if (network.config.chainId != 80001) {
    return;
  }

  const oldUSDC = "0xe6b8a5cf854791412c1f6efc7caf629f5df1c747";
  const newUSDC = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23";

  const deps = {
    ichiOracle: await get('ICHIPeggedOracle'),
    factory: await get('OneTokenFactory'),
    oneBTC: await get('oneBTC')
  }

  const factory = await ethers.getContractAt('OneTokenFactory', deps.factory.address);

  await factory.admitForeignToken(newUSDC, true, deps.ichiOracle.address);
  await factory.removeForeignToken(oldUSDC);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
