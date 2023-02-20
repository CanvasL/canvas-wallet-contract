// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {Errors} from "../errors/Errors.sol";

interface IMultiSigWalletFactory is Errors {
    error NotMultiSigWallet();
    
    event MultiSigWalletCreated(
        address indexed creater,
        address indexed wallet
    );
    event OwnerAdded(address indexed wallet, address owner);
    event OwnerDeleted(address indexed wallet, address owner);
    event ConfirmationsRequiredSet(
        address indexed wallet,
        uint256 numConfirmations
    );
}
