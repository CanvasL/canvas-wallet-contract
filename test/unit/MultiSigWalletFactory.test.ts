import { expect } from "chai";
import { ethers } from "hardhat";

describe('MultiSigWalletFactory', async () => {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    let MultiSigWalletFactory: any;
    let factory: any;

    before(async () => {
        MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWalletFactory');
    })

    beforeEach(async () => {
        // const factoryContract = await MultiSigWalletFactory.deploy();
        // factory = await factoryContract.deployed();
        factory = await MultiSigWalletFactory.deploy();
    })

    describe('#createMultiSigWallet', async () => {
        const emptyOwners = [] as any;
        const ownersContainZeroAddress = [ZERO_ADDRESS];
        const owners = [
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
        ];

        it('Should set right owners array', async () => {
            const numConfirmations = 1;
            await expect(factory.createMultiSigWallet(emptyOwners, numConfirmations)).to.be.revertedWith(
                'The wallet must have at least one owner'
            );
        })
        it('Should contain valid owner address', async () => {
            const numConfirmations = 1;
            await expect(factory.createMultiSigWallet(ownersContainZeroAddress, numConfirmations)).to.be.revertedWith(
                'Invalid owner address'
            );
        })
        it('Should set right required confirmations', async () => {
            const numConfirmations = 4;
            await expect(factory.createMultiSigWallet(owners, numConfirmations)).to.be.revertedWith(
                'Invalid number of required confirmations'
            );
        })
        it('Succeed', async () => {
            const numConfirmations = 1;
            // const signer = ethers.getSigner(owners[0]);
            await expect(factory.createMultiSigWallet(owners, numConfirmations)).not.to.be.reverted;
            // await expect(factory.createMultiSigWallet(owners, numConfirmations)).to.emit(
            //     factory, "MultiSigWalletCreated"
            // ).withArgs(owners[0], )
        })
    })

    describe('#getWalletsByCreater', () => {
        const owners = [
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
        ];
        const numConfirmations = 2;
        let signer: any;

        before(async () => {
            signer = await ethers.getSigner(owners[0]);
            await factory.connect(signer).createMultiSigWallet(owners, numConfirmations);
            // const walletAddress = await tx.wait();
            // console.log("walletAddr=", walletAddress)
        })

        it('succeed', async () => {
            const wallets = await factory.getWalletsByCreater(signer.address);
            console.log("wallets=", wallets);
        })
    })
})