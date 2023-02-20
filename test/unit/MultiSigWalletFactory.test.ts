import { expect } from "chai";
import { ethers } from "hardhat";

describe('MultiSigWalletFactory', async () => {
    const OWNERS = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const NEW_OWNER = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

    let MultiSigWalletFactory: any;
    let factory: any;
    let signer1: any, signer2: any, signer3: any;

    before(async () => {
        MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWalletFactory');
        factory = await MultiSigWalletFactory.deploy();
        [signer1, signer2, signer3] = await Promise.all(
            OWNERS.map(async (addr) => await ethers.getSigner(addr))
        );
    })

    describe('#createMultiSigWallet', async () => {
        const emptyOwners = [] as any;
        const ownersContainZeroAddress = [ZERO_ADDRESS];

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
            await expect(factory.createMultiSigWallet(OWNERS, numConfirmations)).to.be.revertedWithCustomError(
                factory,
                'InvalidNumberOfRequiredConfirmations'
            );
        })
        it('Succeed', async () => {
            const numConfirmations = 1;
            // const signer = await ethers.getSigner(owners[0]);
            await expect(factory.connect(signer1).createMultiSigWallet(OWNERS, numConfirmations)).to.emit(
                factory,
                "MultiSigWalletCreated"
            );
        })
    })

    describe('#getWalletsByCreater', () => {
        const numConfirmations = 2;
        let receipt: any;

        before(async () => {
            const tx = await factory.connect(signer1).createMultiSigWallet(OWNERS, numConfirmations);
            receipt = await tx.wait();
        })

        it('Succeed', async () => {
            const wallets = await factory.getWalletsByCreater(signer1.address);
            expect(receipt.events[0].args.wallet).to.equal(wallets[wallets.length - 1]);
        })
    })

    describe('#addOwnerForWallet', () => {
        const numConfirmations = 2;
        let walletAddress: string;
        let wallet: any;

        before(async ()=> {
            const tx = await factory.connect(signer1).createMultiSigWallet(OWNERS, numConfirmations);
            const receipt = await tx.wait();
            walletAddress = receipt.events[0].args.wallet;
            wallet = await ethers.getContractAt('MultiSigWallet', walletAddress);
        })

        it('Should call by multi-sig wallet', async () => {
            await expect(factory.connect(signer1).addOwnerForWallet(NEW_OWNER)).to.be.revertedWithCustomError(
                factory,
                'NotMultiSigWallet'
            );
        })

        it('Succeed', async () => {
            const ABI = ['function addOwnerForWallet(address)'];
            const iface = new ethers.utils.Interface(ABI);
            const data = iface.encodeFunctionData('addOwnerForWallet', [NEW_OWNER]);

            await wallet.connect(signer1).submitTransaction(
                factory.address,
                0,
                data
            );

            await wallet.connect(signer1).confirmTransaction(0);
            await wallet.connect(signer2).confirmTransaction(0);

            await expect(wallet.connect(signer2).executeTransaction(0)).to.emit(
                factory,
                'OwnerAdded'
            ).withArgs(
                walletAddress,
                NEW_OWNER
            );
        })
    })

    describe('#deleteOwnerForWallet', () => {
        const numConfirmations = 2;
        let walletAddress: string;
        let wallet: any;

        before(async ()=> {
            const tx = await factory.connect(signer1).createMultiSigWallet(OWNERS, numConfirmations);
            const receipt = await tx.wait();
            walletAddress = receipt.events[0].args.wallet;
            wallet = await ethers.getContractAt('MultiSigWallet', walletAddress);
        })

        it('Should call by multi-sig wallet', async () => {
            await expect(factory.connect(signer1).deleteOwnerForWallet(OWNERS[0])).to.be.revertedWithCustomError(
                factory,
                'NotMultiSigWallet'
            );
        })

        it('Succeed', async () => {
            const ABI = ['function deleteOwnerForWallet(address)'];
            const iface = new ethers.utils.Interface(ABI);
            const data = iface.encodeFunctionData('deleteOwnerForWallet', [OWNERS[0]]);

            await wallet.connect(signer1).submitTransaction(
                factory.address,
                0,
                data
            );

            await wallet.connect(signer1).confirmTransaction(0);
            await wallet.connect(signer2).confirmTransaction(0);

            await expect(wallet.connect(signer2).executeTransaction(0)).to.emit(
                factory,
                'OwnerDeleted'
            ).withArgs(
                walletAddress,
                OWNERS[0]
            );
        })
    })

    describe('#setNumConfirmationsRequiredForWallet', () => {
        const numConfirmations = 2;
        const newNumConfirmations = 3;
        let walletAddress: string;
        let wallet: any;

        before(async ()=> {
            const tx = await factory.connect(signer1).createMultiSigWallet(OWNERS, numConfirmations);
            const receipt = await tx.wait();
            walletAddress = receipt.events[0].args.wallet;
            wallet = await ethers.getContractAt('MultiSigWallet', walletAddress);
        })

        it('Should call by multi-sig wallet', async () => {
            await expect(factory.connect(signer1).setNumConfirmationsRequiredForWallet(newNumConfirmations)).to.be.revertedWithCustomError(
                factory,
                'NotMultiSigWallet'
            );
        })

        it('Succeed', async () => {
            const ABI = ['function setNumConfirmationsRequiredForWallet(uint256)'];
            const iface = new ethers.utils.Interface(ABI);
            const data = iface.encodeFunctionData('setNumConfirmationsRequiredForWallet', [newNumConfirmations]);

            await wallet.connect(signer1).submitTransaction(
                factory.address,
                0,
                data
            );

            await wallet.connect(signer1).confirmTransaction(0);
            await wallet.connect(signer2).confirmTransaction(0);

            await expect(wallet.connect(signer2).executeTransaction(0)).to.emit(
                factory,
                'ConfirmationsRequiredSet'
            ).withArgs(
                walletAddress,
                newNumConfirmations
            );
        })
    })
})