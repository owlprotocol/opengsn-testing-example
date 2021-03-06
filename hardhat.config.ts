/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import { HardhatUserConfig } from 'hardhat/types/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';

const config: HardhatUserConfig = {
    solidity: '0.8.9',
    networks: {
        hardhat: {
            chainId: 1337,
        },
        ganache: {
            chainId: 1337,
            url: 'http://localhost:8545'
        }
    },
    //@ts-ignore
    typechain: {
        outDir: 'typechain', //default
        target: 'ethers-v5', //All options: ethers-v5, web3-v1, truffle-v5
    },
};

export default config;
