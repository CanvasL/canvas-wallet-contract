import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

describe("MultiSigWallet", () => {
    const OWNERS = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    const NEW_OWNER = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    let signer1: any, signer2: any, signer3: any, newSigner: any;
    let MultiSigWallet: any, wallet: Contract;
    let Target: any, target: Contract;

    before(async () => {
        MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
        Target = await ethers.getContractFactory('Target');

        [signer1, signer2, signer3, newSigner] = await Promise.all(
            [...OWNERS, NEW_OWNER].map(async (addr) => await ethers.getSigner(addr))
        );
    })

    beforeEach(async () => {
        target = await Target.deploy();
        wallet = await MultiSigWallet.deploy(OWNERS, 2);
    })

    describe('#addOwner()', () => {
        it('Should call by factory', async () => {
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
            await expect(wallet.connect(newSigner).submitTransaction(
                target.address,
                BigNumber.from(10).pow(18),
                '0x'
            )).to.be.revertedWithCustomError(
                wallet,
                'NotOwner'
            );
        })

        it('Succeed', async () => {
            await expect(wallet.connect(signer1).submitTransaction(
                target.address,
                BigNumber.from(10).pow(18),
                '0x'
            )).to.emit(
                wallet,
                'SubmitTransaction'
            ).withArgs(
                signer1.address,
                0,
                target.address,
                BigNumber.from(10).pow(18),
                '0x'
            );
        })
    })

    describe('#confirmTransaction', () => {
        beforeEach(async () => {
            await wallet.connect(signer1).submitTransaction(
                target.address,
                BigNumber.from(10).pow(18),
                '0x'
            );
        })

        it('Should call by owner', async () => {
            await expect(wallet.connect(newSigner).confirmTransaction(1)).to.be.revertedWithCustomError(
                wallet,
                'NotOwner'
            );
        })

        it('Should give existing tx index', async () => {
            await expect(wallet.connect(signer2).confirmTransaction(1)).to.be.revertedWithCustomError(
                wallet,
                'TransactionNotExsits'
            );
        })

        it('Should not be tag to confirmed', async () => {
            await expect(wallet.connect(signer2).confirmTransaction(0)).to.emit(
                wallet,
                'ConfirmTransaction'
            ).withArgs(
                signer2.address,
                0
            );

            await expect(wallet.connect(signer2).confirmTransaction(0)).to.be.revertedWithCustomError(
                wallet,
                'TransactionAlreadyConfirmed'
            );
        })

        it('Succeed', async () => {
            await expect(wallet.connect(signer2).confirmTransaction(0)).to.emit(
                wallet,
                'ConfirmTransaction'
            ).withArgs(
                signer2.address,
                0
            );
        })
    })

    describe('#revokeConfirmation', () => {
        beforeEach(async () => {
            await wallet.connect(signer1).submitTransaction(
                target.address,
                BigNumber.from(10).pow(18),
                '0x'
            );
            await wallet.connect(signer1).confirmTransaction(0);
            await wallet.connect(signer2).confirmTransaction(0);
        })

        it('Should call by owner', async () => {
            await expect(wallet.connect(newSigner).revokeConfirmation(0)).to.be.revertedWithCustomError(
                wallet,
                'NotOwner'
            );
        })

        it('Succeed', async () => {
            await expect(wallet.connect(signer2).revokeConfirmation(0)).to.emit(
                wallet,
                'RevokeConfirmation'
            ).withArgs(
                signer2.address,
                0
            );
        })
    })

    describe('#executeTransaction', () => {
        context('When transfer funds', () => {
            beforeEach(async () => {
                await signer3.sendTransaction({
                    to: wallet.address,
                    value: BigNumber.from(10).pow(20)
                });

                await wallet.connect(signer1).submitTransaction(
                    target.address,
                    BigNumber.from(10).pow(18),
                    '0x'
                );
                await wallet.connect(signer1).confirmTransaction(0);
            })

            it('Should call by owner', async () => {
                await expect(wallet.connect(newSigner).executeTransaction(0)).to.be.revertedWithCustomError(
                    wallet,
                    'NotOwner'
                );
            })

            it('Should integrage require confirmations', async () => {
                await expect(wallet.connect(signer2).executeTransaction(0)).to.be.revertedWithCustomError(
                    wallet,
                    'TransactionLackConfirmations'
                );
            })

            it('Should give a unexecuted transaction', async () => {
                await wallet.connect(signer2).confirmTransaction(0);
                await wallet.connect(signer2).executeTransaction(0);

                await expect(wallet.executeTransaction(0)).to.be.revertedWithCustomError(
                    wallet,
                    'TransactionAlreadyExecuted'
                ).withArgs(
                    0
                );
            })

            it('Succeed', async () => {
                await wallet.connect(signer2).confirmTransaction(0);
                await expect(wallet.connect(signer1).executeTransaction(0)).to.emit(
                    wallet,
                    'ExecuteTransaction'
                ).withArgs(
                    signer1.address,
                    0
                );
            })
        })

        context('When execute function', () => {
            // const data = target.interface.encodeFunctionData("add", [BigNumber.from(1)]);
            const ABI = ['function add(uint256 _num)'];
            const iface = new ethers.utils.Interface(ABI);
            const data = iface.encodeFunctionData('add', [BigNumber.from(1)]);

            beforeEach(async () => {
                await wallet.connect(signer1).submitTransaction(
                    target.address,
                    0,
                    data
                );
                await wallet.connect(signer1).confirmTransaction(0);
            })

            it('Should call by owner', async () => {
                await expect(wallet.connect(newSigner).executeTransaction(0)).to.be.revertedWithCustomError(
                    wallet,
                    'NotOwner'
                );
            })

            it('Should integrage require confirmations', async () => {
                await expect(wallet.connect(signer2).executeTransaction(0)).to.be.revertedWithCustomError(
                    wallet,
                    'TransactionLackConfirmations'
                );
            })

            it('Should give a unexecuted transaction', async () => {
                await wallet.connect(signer2).confirmTransaction(0);
                await wallet.connect(signer2).executeTransaction(0);

                await expect(wallet.executeTransaction(0)).to.be.revertedWithCustomError(
                    wallet,
                    'TransactionAlreadyExecuted'
                ).withArgs(
                    0
                );
            })

            it('Succeed', async () => {
                await wallet.connect(signer2).confirmTransaction(0);
                await expect(wallet.connect(signer2).executeTransaction(0)).to.emit(
                    wallet,
                    'ExecuteTransaction'
                ).withArgs(
                    signer2.address,
                    0
                );
                expect(await target.num()).to.be.equal(1);
            })
        })

    })

    describe('#receive', () => {
        it('Succeed', async () => {
            await expect(signer3.sendTransaction({
                to: wallet.address,
                value: BigNumber.from(10).pow(18)
            })).to.emit(
                wallet,
                'Deposit'
            ).withArgs(
                signer3.address,
                BigNumber.from(10).pow(18),
                BigNumber.from(10).pow(18)
            )
        })
    })
})