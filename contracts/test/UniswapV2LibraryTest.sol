// SPDX-License-Identifier: GNU

pragma solidity 0.7.6;

import '../_uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';

contract UniswapV2LibraryTest {

    function pairForCurrent(address factory, address token1, address token2) external pure returns (address pair) {
        pair = UniswapV2Library.pairFor(factory, token1, token2);
    }

    function pairForUniswap(address factory, address tokenA, address tokenB) external pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
            ))));
    }

    function pairForSushi(address factory, address tokenA, address tokenB) external pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'e18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303' // init code hash
            ))));
    }

    function getTestHash() external pure returns (bytes32 hash) {
        hash = UniswapV2Library.getInitHash();
    }

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    }

}