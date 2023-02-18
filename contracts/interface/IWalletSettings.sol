// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

interface IWalletSettings {
    function addOwner(address _owner) external;

    function deleteOwner(address _owner) external;

    function setNumConfirmationsRequired(
        uint _numConfirmationsRequired
    ) external;
}
