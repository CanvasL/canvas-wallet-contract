// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {MultiSigWallet} from "./wallets/MultiSigWallet.sol";

contract CanvasWallet is MultiSigWallet {
    constructor(
        address[] memory _owners,
        uint _numConfirmationsRequired
    ) MultiSigWallet(_owners, _numConfirmationsRequired) {}
}
