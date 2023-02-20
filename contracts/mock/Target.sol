// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Target {
    uint256 num = 0;

    constructor() {}

    function add(uint256 _num) public {
        num += _num;
    }

    receive() payable external {}
}
