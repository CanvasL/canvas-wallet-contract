// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {MultiSigWallet} from "../wallets/MultiSigWallet.sol";
import {IWalletFactoryEvents} from "../events/IWalletFactoryEvents.sol";
import {IWalletSettings} from "../interface/IWalletSettings.sol";

contract MultiSigWalletFactory is IWalletFactoryEvents {
    mapping(address => address[]) public walletsByCreater;
    mapping(address => bool) public isMultiSigWallet;

    modifier onlyMultiSigWallet() {
        require(isMultiSigWallet[msg.sender], "invalid caller");
        _;
    }

    function createMultiSigWallet(
        address[] calldata _owners,
        uint _numConfirmationsRequired
    ) public {
        require(_owners.length > 0, "The wallet must have at least one owner");
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
        }

        require(
            _numConfirmationsRequired <= _owners.length,
            "Invalid number of required confirmations"
        );

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
        IWalletSettings(msg.sender).addOwner(_owner);
    }

    function deleteOwnerForWallet(address _owner) external onlyMultiSigWallet {
        IWalletSettings(msg.sender).deleteOwner(_owner);
    }

    function setNumConfirmationsRequiredForWallet(
        uint _numConfirmationsRequired
    ) external onlyMultiSigWallet {
        IWalletSettings(msg.sender).setNumConfirmationsRequired(
            _numConfirmationsRequired
        );
    }
}
