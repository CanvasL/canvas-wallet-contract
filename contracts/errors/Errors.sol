// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

interface Errors {
    error ZeroAddress();
    error InvalidOwnerLength();
    error InvalidNumberOfRequiredConfirmations(
        uint256 maxNum,
        uint256 inputNum
    );
}
