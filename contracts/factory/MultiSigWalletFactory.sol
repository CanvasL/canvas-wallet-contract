// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import {MultiSigWallet} from "../wallets/MultiSigWallet.sol";
import {IMultiSigWalletFactoryEvents} from "../events/IMultiSigWalletFactoryEvents.sol";

contract MultiSigWalletFactory is IMultiSigWalletFactoryEvents {
    mapping(address => address[]) public walletsByCreater;
    mapping(address => bool) public isMultiSigWallet;

    function createMultiSigWallet(
        address[] calldata _owners,
        uint _numConfirmationsRequired
    ) public {
        // 确保只有工厂合约可以创建新的钱包
        // require(
        //     msg.sender == address(this),
        //     "Only the factory contract can create new wallets"
        // );

        // 确保所有的拥有者地址都是有效的，且地址数量必须大于 0
        require(_owners.length > 0, "The wallet must have at least one owner");
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
        }

        // 确保所需确认数目不大于拥有者数量
        require(
            _numConfirmationsRequired <= _owners.length,
            "Invalid number of required confirmations"
        );

        // 创建新的钱包
        MultiSigWallet newWallet = new MultiSigWallet(
            _owners,
            _numConfirmationsRequired
        );

        // 将新的钱包地址添加到索引中
        walletsByCreater[msg.sender].push(address(newWallet));

        isMultiSigWallet[address(newWallet)] = true;

        // 触发事件
        emit MultiSigWalletCreated(msg.sender, address(newWallet));
    }

    function addOwnerForWallet(address _to, address _owner) external {
        require(isMultiSigWallet[msg.sender], "invalid caller");

        
    }
}
