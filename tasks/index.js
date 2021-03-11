const { task } = require("hardhat/config")

const { ethers: { constants: { MaxUint256 }}} = require("ethers")

task("accounts", "Prints the list of accounts", async (args, hre) => {
    const accounts = await hre.ethers.getSigners()
  
    for (const account of accounts) {
      console.log(account.address)
    }
})

task("gas-price", "Prints gas price").setAction(async function({ address }, { ethers }) {
  console.log("Gas price", (await ethers.provider.getGasPrice()).toString())
})

task("bytecode", "Prints bytecode").setAction(async function({ address }, { ethers }) {
  console.log("Bytecode", await ethers.provider.getCode(address))
})