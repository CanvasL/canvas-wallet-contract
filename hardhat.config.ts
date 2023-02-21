import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const MNEMONIC_PHRASE = process.env.MNEMONIC_PHRASE || '';
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '';

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545/"
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: {
        mnemonic: MNEMONIC_PHRASE,
        path: "m/44'/60'/0'/0",
      }
    }
  }
};

export default config;
