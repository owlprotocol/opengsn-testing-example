import { assert } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/gsn/dist/GsnTestEnvironment';
import Web3 from 'web3';
import type { Contract as Web3Contract } from "web3-eth-contract";
import { ethers as ethersHH } from "hardhat"; //HH-connected ethers
import CaptureTheFlagArtifact from '../artifacts/contracts/GSN/CaptureTheFlag.sol/CaptureTheFlag.json'
import { CaptureTheFlag__factory, CaptureTheFlag } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HttpProvider } from 'web3-core';

describe('CaptureTheFlag', () => {
    let FlagFactory: CaptureTheFlag__factory
    let Flag: CaptureTheFlag;

    let accounts: SignerWithAddress[]

    before(async () => {
        //Set accounts
        accounts = await ethersHH.getSigners();
        //Deploy Flag
        FlagFactory = await ethersHH.getContractFactory('CaptureTheFlag') as CaptureTheFlag__factory;
    })

    beforeEach(async () => {
        Flag = await FlagFactory.deploy()
        //Use account1 as account0 is used as relayer
        Flag = Flag.connect(accounts[1])
        await Flag.deployed()
    });

    describe('Regular', () => {
        it('captureFlag()', async () => {
            const initialBalance = await ethersHH.provider.getBalance(accounts[1].address);

            await Flag.captureFlag();
            const holder = await Flag.flagHolder()

            assert.equal(holder, accounts[1].address, 'Flag not captured!')

            //Gas was spent by user
            const finalBalance = await ethersHH.provider.getBalance(accounts[1].address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });
    })

    describe('GSN', () => {
        let gsn: TestEnvironment
        let gsnProvider: HttpProvider;
        let web3: Web3
        let gsnForwarderAddress: string;

        let FlagGSN: Web3Contract

        //Run GSN Tests here
        //Use account1 as account0 is used as relayer
        //Use Web3.js as better suited for provider
        before(async () => {
            //Setup Test Environment
            gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
            //@ts-ignore
            gsnProvider = gsn.relayProvider;
            web3 = new Web3(gsnProvider)
            gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;

            //Set forwarder
            await Flag.setTrustedForwarder(gsnForwarderAddress);

            //Setup GSN-connected contract
            FlagGSN = new web3.eth.Contract(CaptureTheFlagArtifact.abi as any, Flag.address)
        })

        after(() => {
            //Disconnect from relayer
            gsn.relayProvider.disconnect();
        });

        it('captureFlag()', async () => {
            const initialBalance = await ethersHH.provider.getBalance(accounts[1].address);

            await FlagGSN.methods.captureFlag().send({ from: accounts[1].address });
            const holder = await FlagGSN.methods.flagHolder().call()

            assert.equal(holder, accounts[1].address, 'Flag not captured!')

            //No gas was spent by user
            const finalBalance = await ethersHH.provider.getBalance(accounts[1].address);
            assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
        });

        /*
        //Run GSN Tests here
        //Use account1 as account0 is used as relayer
        before(async () => {
            //Setup Test Environment
            gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
            //@ts-ignore
            gsnProvider = new ethers.providers.Web3Provider(gsn.relayProvider);
            const pkey = '0x8253ed8da24264bd06df0281196eb8ce86f42878172d0caf178cfd9e01808761'
            gsnSigner = new ethers.Wallet(pkey, gsnProvider)

            gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;

            //Set forwarder
            await Flag.setTrustedForwarder(gsnForwarderAddress);

            //Setup GSN-connected contract
            FlagGSN = new ethers.Contract(Flag.address, Flag.interface, gsnSigner) as CaptureTheFlag
        })

        after(() => {
            //Disconnect from relayer
            gsn.relayProvider.disconnect();
        });

        it('captureFlag()', async () => {
            const initialBalance = await ethersHH.provider.getBalance(accounts[2].address);

            await FlagGSN.captureFlag({ from: accounts[2].address });
            const holder = await FlagGSN.flagHolder()

            assert.equal(holder, accounts[2].address, 'Flag not captured!')

            //No gas was spent by user
            const finalBalance = await ethersHH.provider.getBalance(accounts[2].address);
            console.debug(initialBalance.toString())
            console.debug(finalBalance.toString())
            assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
        });
    })
    */
    });

})