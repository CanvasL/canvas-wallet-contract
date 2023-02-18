// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {IWalletEvents} from "../events/IWalletEvents.sol";
import {IWalletSettings} from "../interface/IWalletSettings.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MultiSigWallet is IWalletEvents, IWalletSettings {
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

    modifier onlyFactory() {
        require(msg.sender == factory, "not factory");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

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

    function addOwner(address _owner) external override onlyFactory {
        require(!isOwner[_owner], "owner already exists");

        owners.push(_owner);
        ownersCount += 1;
        isOwner[_owner] = true;
    }

    function deleteOwner(address _owner) external override onlyFactory {
        require(isOwner[_owner], "owner does not exist");

        ownersCount -= 1;
        isOwner[_owner] = false;
    }

    function setNumConfirmationsRequired(
        uint _numConfirmationsRequired
    ) external override onlyFactory {
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= ownersCount,
            "invalid number of required confirmations"
        );

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

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(
        uint _txIndex
    ) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }
}
