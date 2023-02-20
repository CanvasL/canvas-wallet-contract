// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {Errors} from "../errors/Errors.sol";

interface IMultiSigWallet is Errors {
    error NotOwner();
    error NotFactory();
    error OwnerAlreadyExsits(address owner);
    error OwnerNotExsits(address owner);
    error DeleteUnavailable();
    error TransactionNotExsits(uint256 txIndex);
    error TransactionLackConfirmations(uint256 txIndex);
    error TransactionNotConfirmed(uint256 txIndex, address owner);
    error TransactionAlreadyConfirmed(uint256 txIndex);
    error TransactionExecutedFailed(uint256 txIndex);
    error TransactionAlreadyExecuted(uint256 txIndex);

    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    function addOwner(address _owner) external;

    function deleteOwner(address _owner) external;

    function setNumConfirmationsRequired(
        uint _numConfirmationsRequired
    ) external;
}
