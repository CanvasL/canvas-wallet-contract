// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import "hardhat/console.sol";

contract Target {
    uint256 public num = 0;

    constructor() {}

    function add(uint256 _num) public {
        num += _num;
    }

    receive() payable external {
        console.log("received %s", msg.value);
    }
}
