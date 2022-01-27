import { ethers, deployments, network, getNamedAccounts } from "hardhat";

import { getCurrentConfig } from "../src/deployConfigs";

const TargetsPerNetwork = {
  137: [
    "Incremental",
    "OneTokenFactory",
    "OneTokenV1",
    "ICHIPeggedOracle",
    "ChainlinkOracleUSD",
    "oneBTC",
    "oneBTCArbitrary"
  ]
}

async function main() {
  const { get, read, execute } = deployments;
  const targets = TargetsPerNetwork[network.config.chainId];
  const config = getCurrentConfig();
  const [owner] = await ethers.getSigners();

  for (const target of targets) {
    const deployment = await get(target);

    const contract = await ethers.getContractAt("ICHIOwnable", deployment.address)
    const currentOwner = await contract.owner();


    if (currentOwner == owner.address) {
      console.log(`${target}: Transfering ownership to governance ${config.governance}`);
      await contract.transferOwnership(config.governance);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
