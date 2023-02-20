import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSigWallet", () => {
    const OWNERS = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    const NEW_OWNER = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    let MultiSigWallet: any, wallet: any;
    let Target: any, target: any;

    before(async () => {
        MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
        Target = await ethers.getContractFactory('Target');
    })

    beforeEach(async () => {
        wallet = await MultiSigWallet.deploy(OWNERS, 2);
        target = await Target.deploy();
    })

    describe('#addOwner()', () => {
        it('Should call by factory', async () => {
            const newSigner = await ethers.getSigner(NEW_OWNER);
            await expect(wallet.connect(newSigner).addOwner(NEW_OWNER)).to.be.revertedWithCustomError(
                wallet,
                'NotFactory'
            );
        })

        it('Should give valid owner address', async () => {
            await expect(wallet.addOwner(ZERO_ADDRESS)).to.be.revertedWithCustomError(
                wallet,
                "ZeroAddress"
            );
        })

        it('Should give a new owner', async () => {
            await expect(wallet.addOwner(OWNERS[0])).to.be.revertedWithCustomError(
                wallet,
                "OwnerAlreadyExsits"
            );
        })

        it('Succeed', async () => {
            await wallet.addOwner(NEW_OWNER);
            expect(await wallet.owners(3)).to.be.equal(NEW_OWNER);
            expect(await wallet.isOwner(NEW_OWNER)).to.be.true;
            expect(await wallet.ownersCount()).to.be.equal(4);
        })
    })

    describe('#deleteOwner()', () => {
        it('Should call by factory', async () => {
            const newSigner = await ethers.getSigner(NEW_OWNER);
            await expect(wallet.connect(newSigner).deleteOwner(NEW_OWNER)).to.be.revertedWithCustomError(
                wallet,
                'NotFactory'
            );
        })

        it('Should give valid owner address', async () => {
            await expect(wallet.deleteOwner(ZERO_ADDRESS)).to.be.revertedWithCustomError(
                wallet,
                "ZeroAddress"
            );
        })

        it('Should give a exsiting owner', async () => {
            await expect(wallet.deleteOwner(NEW_OWNER)).to.be.revertedWithCustomError(
                wallet,
                "OwnerNotExsits"
            );
        })

        it('Succeed', async () => {
            await expect(wallet.deleteOwner(OWNERS[0])).to.be.not.reverted;
            expect(await wallet.isOwner(OWNERS[0])).to.be.false;
            expect(await wallet.ownersCount()).to.be.equal(2);
        })
    })

    describe('#setNumConfirmationsRequired()', () => {
        it('Should call by factory', async () => {
            const newSigner = await ethers.getSigner(NEW_OWNER);
            await expect(wallet.connect(newSigner).setNumConfirmationsRequired(3)).to.be.revertedWithCustomError(
                wallet,
                'NotFactory'
            );
        })

        it('Should give a num greater than 0', async () => {
            await expect(wallet.setNumConfirmationsRequired(0)).to.be.revertedWithCustomError(
                wallet,
                "InvalidNumberOfRequiredConfirmations"
            );
        })

        it('Should give a lower equan than ownersCount', async () => {
            await expect(wallet.setNumConfirmationsRequired(4)).to.be.revertedWithCustomError(
                wallet,
                "InvalidNumberOfRequiredConfirmations"
            );
        })

        it('Succeed', async () => {
            await expect(wallet.setNumConfirmationsRequired(3)).to.be.not.reverted;
            expect(await wallet.numConfirmationsRequired()).to.be.equal(3);
        })
    })

    describe('#getOwners', () => {
        it('succeed', async () => {
            let ownersGet = await wallet.getOwners();
            expect(ownersGet.length).to.be.equal(OWNERS.length);
            ownersGet.forEach((_: any, i: number) => {
                expect(ownersGet[i]).to.be.equal(OWNERS[i]);
            });

            await wallet.deleteOwner(OWNERS[0]);
            ownersGet = await wallet.getOwners();
            expect(ownersGet.length).to.be.equal(OWNERS.length - 1);
            ownersGet.forEach((_: any, i: number) => {
                expect(ownersGet[i]).to.be.equal(OWNERS[i + 1]);
            });

            await wallet.addOwner(OWNERS[0]);
            ownersGet = await wallet.getOwners();
            expect(ownersGet.length).to.be.equal(OWNERS.length);
            ownersGet.forEach((_: any, i: number) => {
                expect(ownersGet[i]).to.be.equal(OWNERS[i]);
            });
        })
    })

    describe('#submitTransaction', () => {
        it('Should call by owner', async () => {
            const signer = await ethers.getSigner(NEW_OWNER);

            await expect(wallet.connect(signer).submitTransaction(
                target.address,
                ethers.BigNumber.from(10).pow(18),
                '0x'
            )).to.be.revertedWithCustomError(
                wallet,
                'NotOwner'
            );
        })

        it('Succeed', async () => {
            const signer = await ethers.getSigner(OWNERS[0]);

            await expect(wallet.connect(signer).submitTransaction(
                target.address,
                ethers.BigNumber.from(10).pow(18),
                '0x'
            )).to.emit(
                wallet,
                'SubmitTransaction'
            ).withArgs(
                signer.address,
                0,
                target.address,
                ethers.BigNumber.from(10).pow(18),
                '0x'
            );
        })
    })

    describe('#confirmTransaction', () => {
        beforeEach(async () => {
            const signer = await ethers.getSigner(OWNERS[0]);
            await wallet.connect(signer).submitTransaction(
                target.address,
                ethers.BigNumber.from(10).pow(18),
                '0x'
            );
        })

        it('Should call by owner', async () => {
            const signer = await ethers.getSigner(NEW_OWNER);

            await expect(wallet.connect(signer).confirmTransaction(1)).to.be.revertedWithCustomError(
                wallet,
                'NotOwner'
            );
        })

        it('Should give existing tx index', async () => {
            const signer = await ethers.getSigner(OWNERS[1]);

            await expect(wallet.connect(signer).confirmTransaction(1)).to.be.revertedWithCustomError(
                wallet,
                'TransactionNotExsits'
            );
        })

        it('Should not be tag to confirmed', async () => {
            const signer = await ethers.getSigner(OWNERS[1]);

            await expect(wallet.connect(signer).confirmTransaction(0)).to.emit(
                wallet,
                'ConfirmTransaction'
            ).withArgs(
                signer.address,
                0
            );

            await expect(wallet.connect(signer).confirmTransaction(0)).to.be.revertedWithCustomError(
                wallet,
                'TransactionAlreadyConfirmed'
            );
        })

        it('Succeed', async () => {
            const signer = await ethers.getSigner(OWNERS[1]);

            await expect(wallet.connect(signer).confirmTransaction(0)).to.emit(
                wallet,
                'ConfirmTransaction'
            ).withArgs(
                signer.address,
                0
            );
        })
    })

    describe('revokeConfirmation', () => {
        beforeEach(async () => {
            const proposer = await ethers.getSigner(OWNERS[0]);
            await wallet.connect(proposer).submitTransaction(
                target.address,
                ethers.BigNumber.from(10).pow(18),
                '0x'
            );
            await wallet.connect(proposer).confirmTransaction(0);

            const signer1 = await ethers.getSigner(OWNERS[1]);
            await wallet.connect(signer1).confirmTransaction(0);
        })

        it('Should call by owner', async () => {
            const signer = await ethers.getSigner(NEW_OWNER);

            await expect(wallet.connect(signer).revokeConfirmation(0)).to.be.revertedWithCustomError(
                wallet,
                'NotOwner'
            );
        })

        it('Succeed', async () => {
            const signer1 = await ethers.getSigner(OWNERS[1]);
            await expect(wallet.connect(signer1).revokeConfirmation(0)).to.emit(
                wallet,
                'RevokeConfirmation'
            ).withArgs(
                signer1.address, 
                0
            );
        })
    })

    describe('executeTransaction', () => {
        beforeEach(() => {

        })

        it('Should call by owner', async () => {
            const signer = await ethers.getSigner(NEW_OWNER);

            await expect(wallet.connect(signer).executeTransaction(0)).to.be.revertedWithCustomError(
                wallet,
                'NotOwner'
            );
        })

        it('Should integrage require confirmations', async () => {

        })

        it('Succeed when transfer funds', async () => {

        })

        it('Succeed when execute function', async () => {

        })
    })
})