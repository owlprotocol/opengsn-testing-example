import { assert } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/dev';
import Web3 from 'web3';
import { ethers } from 'ethers';
import type { Contract as Web3Contract } from "web3-eth-contract";
import { ethers as ethersHH } from "hardhat"; //HH-connected ethers
import type { HttpProvider as Web3HttpProvider } from 'web3-providers-http'
import CaptureTheFlagArtifact from '../artifacts/contracts/GSN/CaptureTheFlag.sol/CaptureTheFlag.json'
import { CaptureTheFlag__factory, CaptureTheFlag } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const from = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const privKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

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
        let gsnProvider: TestEnvironment['relayProvider'];
        let gsnForwarderAddress: string;

        //Run GSN Tests here
        //Use account1 as account0 is used as relayer
        before(async () => {
            //Setup Test Environment
            gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
            gsnProvider = gsn.relayProvider;
            gsnProvider.addAccount(privKey)
            gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress!;

        })

        beforeEach(async () => {
            //Set forwarder
            await Flag.setTrustedForwarder(gsnForwarderAddress);
        })

        after(() => {
            //Disconnect from relayer
            gsn.relayProvider.disconnect();
        });

        describe('GSN - web3', () => {
            let web3: Web3
            let FlagGSNWeb3: Web3Contract

            //Run GSN Tests here
            //Use account1 as account0 is used as relayer
            //Use Web3.js as better suited for provider
            beforeEach(async () => {
                //Setup GSN-connected contract
                web3 = new Web3(gsnProvider)
                FlagGSNWeb3 = new web3.eth.Contract(CaptureTheFlagArtifact.abi as any, Flag.address)
            })

            it('captureFlag()', async () => {
                const initialBalance = await ethersHH.provider.getBalance(accounts[1].address);

                await FlagGSNWeb3.methods.captureFlag().send({ from: accounts[1].address, gasLimit: 1e6 });
                const holder = await FlagGSNWeb3.methods.flagHolder().call()

                assert.equal(holder, accounts[1].address, 'Flag not captured!')

                //No gas was spent by user
                const finalBalance = await ethersHH.provider.getBalance(accounts[1].address);
                assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
            });
        });

        describe('GSN - ethers', () => {
            let ethersProvider: ethers.providers.Web3Provider
            let FlagGSNEthers: CaptureTheFlag

            //Run GSN Tests here
            //Use account1 as account0 is used as relayer
            //Use Web3.js as better suited for provider
            beforeEach(async () => {
                ethersProvider = new ethers.providers.Web3Provider(gsnProvider as unknown as Web3HttpProvider)
                //Setup GSN-connected contract
                FlagGSNEthers = Flag.connect(ethersProvider.getSigner(from))
            })

            it('captureFlag()', async () => {
                const initialBalance = await ethersHH.provider.getBalance(accounts[1].address);

                await FlagGSNEthers.captureFlag({ gasLimit: 1e6 });
                const holder = await FlagGSNEthers.callStatic.flagHolder()

                assert.equal(holder, accounts[1].address, 'Flag not captured!')

                //No gas was spent by user
                const finalBalance = await ethersHH.provider.getBalance(accounts[1].address);
                assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
            });
        })
    })
});