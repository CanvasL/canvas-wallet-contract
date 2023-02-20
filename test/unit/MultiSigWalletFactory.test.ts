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

        it('Should set valid owners array', async () => {
            const numConfirmations = 1;
            await expect(factory.createMultiSigWallet(emptyOwners, numConfirmations)).to.be.revertedWithCustomError(
                factory,
                'InvalidOwnerLength'
            );
        })
        it('Should contain valid owner address', async () => {
            const numConfirmations = 1;
            await expect(factory.createMultiSigWallet(ownersContainZeroAddress, numConfirmations)).to.be.revertedWithCustomError(
                factory,
                'ZeroAddress'
            );
        })
        it('Should set valid required confirmations', async () => {
            const numConfirmations = 4;
            await expect(factory.createMultiSigWallet(owners, numConfirmations)).to.be.revertedWithCustomError(
                factory,
                'InvalidNumberOfRequiredConfirmations'
            );
        })
        it('Succeed', async () => {
            const numConfirmations = 1;
            const signer = await ethers.getSigner(owners[0]);
            await expect(factory.connect(signer).createMultiSigWallet(owners, numConfirmations)).to.emit(
                factory,
                "MultiSigWalletCreated"
            ).withArgs(signer.address, (await factory.getWalletsByCreater(signer.address))[0]);
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
        let receipt: any;

        beforeEach(async () => {
            signer = await ethers.getSigner(owners[0]);
            const tx = await factory.connect(signer).createMultiSigWallet(owners, numConfirmations);
            receipt = await tx.wait();
        })

        it('succeed', async () => {
            const [newWallet] = await factory.getWalletsByCreater(signer.address);
            expect(receipt.events[0].args.wallet).to.equal(newWallet);
        })
    })

    describe('#addOwnerForWallet', () => {

    })
})