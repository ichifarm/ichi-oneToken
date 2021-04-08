## `ICHIERC20Burnable`



Uses the modified ERC20 with Initializer.


### `burn(uint256 amount)` (public)



Destroys `amount` tokens from the caller.

See {ERC20-_burn}.

### `burnFrom(address account, uint256 amount)` (public)



Destroys `amount` tokens from `account`, deducting from the caller's
allowance.

See {ERC20-_burn} and {ERC20-allowance}.

Requirements:

- the caller must have allowance for ``accounts``'s tokens of at least
`amount`.


