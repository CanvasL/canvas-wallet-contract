# Canvas Wallet: A Powerful Integrated MultiSig Wallet Factory
`Canvas Wallet` integrates various wallet factories, including multi-sig wallets, to provide users with a comprehensive wallet management system.

## MultiSig Wallet Factory & MultiSig Wallet
In the multi-sig factory, users can:

- Create a multi-sig wallet
- Add an owner for a multi-sig wallet (which must be called by the multi-sig wallet itself)
- Delete an owner for a multi-sig wallet (which must be called by the multi-sig wallet itself)
- Set the number of confirmations required for a multi-sig wallet (which must be called by the multi-sig wallet itself)
- 
Users can create multiple wallets as needed.

When using a multi-sig wallet, owners can:

- Submit transactions
- Confirm transactions
- Revoke transactions
- Execute transactions

Multi-sig wallets can be used to send funds or call contract methods by owners. However, it is recommended to deposit funds into the multi-sig wallet before performing any operations.

### Cons
The executor of a transaction must pay for all gas fees and potential funds value, while other owners only need to pay for the gas fees of confirming transactions.
## Todo
- Add support for additional wallet factories
- Improve transaction cost allocation for multi-sig wallets
- Enhance user interface for better usability