import Web3 from 'web3';
import { RelayProvider } from '@opengsn/gsn';
import { assert } from 'chai';
import { CaptureTheFlagInstance } from '../../types/truffle-contracts/CaptureTheFlag';
import { CaptureTheFlag, gsnContracts } from '../artifacts';
import { accounts, configure } from './configure';

describe('CaptureTheFlag', () => {
    let provider: RelayProvider;
    let forwarderAddress: string;
    let flag: CaptureTheFlagInstance;
    let flagGSN: CaptureTheFlagInstance;
    let web3: Web3;

    before(async () => {
        const config = await configure({ gsn: true, ganacheConfig: { server: true } });
        const gsn = config.gsn!;
        //@ts-ignore
        provider = gsn.relayProvider;
        forwarderAddress = gsn.contractsDeployment.forwarderAddress as string;

        flag = await CaptureTheFlag.new();
        flagGSN = await gsnContracts['CaptureTheFlag'].at(flag.address);
        web3 = config.ganache.web3;
        await flag.setTrustedForwarder(forwarderAddress);
    });

    after(() => {
        provider.disconnect();
    });

    it('captureFlag() - Regular', async () => {
        const initialBalance = Web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
        const transaction = await flag.captureFlag();
        const FlagCaptured = transaction.logs[0].args;
        assert.equal(FlagCaptured._to, accounts[0], 'FlagCaptured._to != accounts[0]');

        const finalBalance = Web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
        assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');

        const transaction2 = await flagGSN.captureFlag({ from: accounts[1] });
        const FlagCaptured2 = transaction2.logs[0].args;
        assert.equal(FlagCaptured2._to, accounts[1], 'FlagCaptured._to != accounts[1]');
    });

    it('captureFlag() - GSN', async () => {
        const initialBalance = Web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
        const transaction = await flagGSN.captureFlag();
        const FlagCaptured = transaction.logs[0].args;
        assert.equal(FlagCaptured._to, accounts[0], 'FlagCaptured._to != accounts[0]');

        const finalBalance = Web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
        assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');

        const transaction2 = await flagGSN.captureFlag({ from: accounts[1] });
        const FlagCaptured2 = transaction2.logs[0].args;
        assert.equal(FlagCaptured2._to, accounts[1], 'FlagCaptured._to != accounts[1]');
    });
});
