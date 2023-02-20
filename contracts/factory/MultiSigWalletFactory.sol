// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {MultiSigWallet} from "../wallets/MultiSigWallet.sol";
import {IMultiSigWalletFactory} from "../interface/IMultiSigWalletFactory.sol";
import {IMultiSigWallet} from "../interface/IMultiSigWallet.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract MultiSigWalletFactory is IMultiSigWalletFactory {
    mapping(address => address[]) public walletsByCreater;
    mapping(address => bool) public isMultiSigWallet;

    modifier onlyMultiSigWallet() {
        if(isMultiSigWallet[msg.sender]) {
            revert NotMultiSigWallet();
        }
        _;
    }

    function createMultiSigWallet(
        address[] calldata _owners,
        uint _numConfirmationsRequired
    ) public {
        if(_owners.length == 0) {
            revert InvalidOwnerLength();
        }
        for (uint i = 0; i < _owners.length; i++) {
            if(_owners[i] == address(0)) {
                revert ZeroAddress();
            }
        }
        if (_numConfirmationsRequired == 0 || _numConfirmationsRequired > _owners.length) {
            revert InvalidNumberOfRequiredConfirmations(
                _owners.length,
                _numConfirmationsRequired
            );
        }

        MultiSigWallet newWallet = new MultiSigWallet(
            _owners,
            _numConfirmationsRequired
        );

        walletsByCreater[msg.sender].push(address(newWallet));

        isMultiSigWallet[address(newWallet)] = true;

        emit MultiSigWalletCreated(msg.sender, address(newWallet));
    }

    function getWalletsByCreater(
        address creater
    ) public view returns (address[] memory) {
        return walletsByCreater[creater];
    }

    function addOwnerForWallet(address _owner) external onlyMultiSigWallet {
        IMultiSigWallet(msg.sender).addOwner(_owner);
        emit OwnerAdded(msg.sender, _owner);
    }

    function deleteOwnerForWallet(address _owner) external onlyMultiSigWallet {
        IMultiSigWallet(msg.sender).deleteOwner(_owner);
        emit OwnerDeleted(msg.sender, _owner);
    }

    function setNumConfirmationsRequiredForWallet(
        uint _numConfirmationsRequired
    ) external onlyMultiSigWallet {
        IMultiSigWallet(msg.sender).setNumConfirmationsRequired(
            _numConfirmationsRequired
        );
        emit ConfirmationsRequiredSet(msg.sender, _numConfirmationsRequired);
    }
}
