import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSigWallet", () => {
    const owners = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    let MultiSigWallet: any;
    let wallet: any;

    before(async ()=>{
        MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
    })

    beforeEach(async () =>{
        wallet = await MultiSigWallet.deploy(owners, 2);
    })

    describe("#addOwner()", () => {
        
    })
})