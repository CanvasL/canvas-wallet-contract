// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {IMultiSigWallet} from "../interface/IMultiSigWallet.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MultiSigWallet is IMultiSigWallet {
    address immutable factory;

    address[] public owners;
    uint public ownersCount;
    mapping(address => bool) public isOwner;
    uint public numConfirmationsRequired;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }

    // mapping from tx index => owner => bool
    mapping(uint => mapping(address => bool)) public isConfirmed;

    Transaction[] public transactions;

    modifier nonZeroAddress(address value) {
        if (value == address(0)) {
            revert ZeroAddress();
        }
        _;
    }

    modifier onlyFactory() {
        if(msg.sender != factory) {
            revert NotFactory();
        }
        _;
    }

    modifier onlyOwner() {
        if(!isOwner[msg.sender]) {
            revert NotOwner();
        }
        _;
    }

    modifier txExists(uint _txIndex) {
        if(_txIndex >= transactions.length) {
            revert TransactionNotExsits(_txIndex);
        }
        _;
    }

    modifier notExecuted(uint _txIndex) {
        if(transactions[_txIndex].executed) {
            revert TransactionAlreadyExecuted(_txIndex);
        }
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        if(isConfirmed[_txIndex][msg.sender]) {
            revert TransactionAlreadyConfirmed(_txIndex);
        }
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        if (_owners.length == 0) {
            revert InvalidOwnerLength();
        }
        if (
            _numConfirmationsRequired == 0 ||
            _numConfirmationsRequired > _owners.length
        ) {
            revert InvalidNumberOfRequiredConfirmations(
                _owners.length,
                _numConfirmationsRequired
            );
        }

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            if (owner == address(0)) {
                revert ZeroAddress();
            }
            if (isOwner[owner]) {
                revert OwnerAlreadyExsits(owner);
            }

            isOwner[owner] = true;
            owners.push(owner);
        }

        ownersCount = _owners.length;
        numConfirmationsRequired = _numConfirmationsRequired;

        factory = msg.sender;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function addOwner(
        address _owner
    ) external override onlyFactory nonZeroAddress(_owner) {
        if (isOwner[_owner]) {
            revert OwnerAlreadyExsits(_owner);
        }

        owners.push(_owner);
        ownersCount += 1;
        isOwner[_owner] = true;
    }

    function deleteOwner(
        address _owner
    ) external override onlyFactory nonZeroAddress(_owner) {
        if (!isOwner[_owner]) {
            revert OwnerNotExsits(_owner);
        }
        if (ownersCount - 1 < numConfirmationsRequired) {
            revert DeleteUnavailable();
        }

        ownersCount -= 1;
        isOwner[_owner] = false;
    }

    function setNumConfirmationsRequired(
        uint _numConfirmationsRequired
    ) external override onlyFactory {
        if (
            _numConfirmationsRequired == 0 ||
            _numConfirmationsRequired > ownersCount
        ) {
            revert InvalidNumberOfRequiredConfirmations(
                ownersCount,
                _numConfirmationsRequired
            );
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    function getOwners() public view returns (address[] memory) {
        address[] memory _owners = new address[](ownersCount);
        uint j = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (isOwner[owners[i]]) {
                _owners[j] = owners[i];
                j++;
            }
        }
        return _owners;
    }

    function getTransactions() public view returns (Transaction[] memory) {
        return transactions;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransactionByIndex(
        uint _txIndex
    ) public view txExists(_txIndex) returns (Transaction memory) {
        return transactions[_txIndex];
    }

    function submitTransaction(
        address _to,
        uint _value,
        bytes memory _data
    ) public onlyOwner {
        uint txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(
        uint _txIndex
    )
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(
        uint _txIndex
    ) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        if (transaction.numConfirmations < numConfirmationsRequired) {
            revert TransactionInvalidConfirmations(_txIndex);
        }

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        if (!success) {
            revert TransactionExecutedFailed(_txIndex);
        }

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(
        uint _txIndex
    ) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        if(!isConfirmed[_txIndex][msg.sender]) {
            revert TransactionNotConfirmed(_txIndex, msg.sender);
        }

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }
}
