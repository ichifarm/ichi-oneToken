const { ethers } = require("hardhat")
const { expect } = require("chai")
const { prepare, deploy, getBigNumber } = require("./utilities")

describe("oneToken", function () {
  before(async function () {
    this.oneToken = await ethers.getContractFactory("OneTokenV1")
    await prepare(this, ['ERC20Mock'])
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
  })

  beforeEach(async function () {
    await deploy(this,
        [['weth', this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
        ['usdc', this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]]
      ])
    this.token = await this.oneToken.deploy()
    await this.token.deployed()
  })

  it("should have correct name and symbol and decimal", async function () {
    const name = await this.token.name()
    const symbol = await this.token.symbol()
    const decimals = await this.token.decimals()
    expect(name, "oneToken")
    expect(symbol, "oneToken")
    expect(decimals, "9")
  })
})