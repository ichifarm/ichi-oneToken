const { expect, artifacts } = require("hardhat")

const UniswapV2LibraryTest = artifacts.require("UniswapV2LibraryTest")
const UniswapV2Library = artifacts.require('UniswapV2Library')

let library,
    uniswapV2Library

const uni_factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
const fuse = '0x970B9bB2C0444F5E81e9d0eFb84C8ccdcdcAf84d'
const weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const fuse_weth_uniswap = '0x4Ce3687fEd17e19324F23e305593Ab13bBd55c4D'

const sushi_factory = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'
const mph = '0x8888801aF4d980682e47f1A9036e589479e835C5'
const mph_weth_sushi = '0xB2C29e311916a346304f83AA44527092D5bd4f0F'

contract("Test UniswapV2Libray forPair call", accounts => {
    beforeEach(async() => {
        deployer = accounts[0]

        uniswapV2Library = await UniswapV2Library.new();
        try { await UniswapV2LibraryTest.link(uniswapV2Library); } catch (e) {};
        library = await UniswapV2LibraryTest.new();
    })

    it('uniswap LP test', async() => {
        const uni_pair = await library.pairForUniswap(uni_factory, fuse, weth)
        expect(uni_pair).eq(fuse_weth_uniswap)
    })
    it('sushi LP test', async() => {
        const sushi_pair = await library.pairForSushi(sushi_factory, mph, weth)
        expect(sushi_pair).eq(mph_weth_sushi)
    })
    it('get test hash', async() => {
        const hash = await library.getTestHash()
        console.log(hash)
    })
})