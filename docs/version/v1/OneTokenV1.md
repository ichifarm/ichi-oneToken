## `OneTokenV1`






### `mint(address collateralToken, uint256 oneTokens)` (external)

convert member tokens and collateral tokens into oneTokens. requires sufficient allowances for both tokens
     @dev takes the lessor of memberTokens allowance or the maximum allowed by the minting ratio and the balance in collateral
     @param collateralToken a registered ERC20 collateral token contract
     @param oneTokens exact number of oneTokens to receive



### `redeem(address collateral, uint256 amount)` (external)

redeem oneTokens for collateral tokens at 1:1 - applies fee %
     @dev first grant allowances, then redeem. Consider infinite collateral allowance and a sufficient memberToken allowance. Updates ratio and triggers controller.
     @param collateral form of ERC20 stable token to receive
     @param amount oneTokens to redeem equals collateral tokens to receive



### `setMintingFee(uint256 fee)` (external)

governance sets the adjustable fee
     @param fee fee, 18 decimals, e.g. 2% = 20000000000000000



### `setRedemptionFee(uint256 fee)` (external)

governance sets the adjustable fee
     @param fee fee, 18 decimals, e.g. 2% = 20000000000000000



### `updateMintingRatio(address collateralToken) → uint256 ratio, uint256 maxOrderVolume` (public)

adjust the minting ratio
     @dev acceptable for gas-paying external actors to call this function
     @param collateralToken token to use for ratio calculation
     @param ratio minting ratio
     @param maxOrderVolume maximum order size



### `getMintingRatio(address collateralToken) → uint256 ratio, uint256 maxOrderVolume` (external)

read the minting ratio and maximum order volume prescribed by the mintMaster
     @param collateralToken token to use for ratio calculation
     @param ratio minting ratio
     @param maxOrderVolume maximum order size



### `getHoldings(address token) → uint256 vaultBalance, uint256 strategyBalance` (external)

read the vault balance and strategy balance of a given token
     @dev not restricted to registered assets
     @param token ERC20 asset to report
     @param vaultBalance tokens held in this vault
     @param strategyBalance tokens in assigned strategy




### `Minted(address sender, address collateral, uint256 oneTokens, uint256 memberTokens, uint256 collateralTokens)`





### `Redeemed(address sender, address collateral, uint256 amount)`





### `NewMintingFee(address sender, uint256 fee)`





### `NewRedemptionFee(address sender, uint256 fee)`





