import { HardhatUserConfig } from "hardhat/config";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";

dotenv.config()

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { 
        version: "0.8.24", 
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      { 
        version: "0.6.12", 
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS === 'true') ? true : false
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/scS7rThd70YD61xEU80rJAZnQArQ36Dw`,
      accounts: [`${process.env.MAINNET_DEPLOYER_PRIV_KEY}`],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/s6C7JIaQX-lqPyFsZBZe8fIR2eofhnI1`,
      accounts: [`${process.env.SEPOLIA_DEPLOYER_PRIV_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/9SJxEDr4JS4Yq8dWH6b1XcXTUWXrMu4J`,
      accounts: [`${process.env.GOERLI_DEPLOYER_PRIV_KEY}`],
    },
    bsctestnet: {
      url: `https://bsc-testnet-rpc.publicnode.com`,
      accounts: [`${process.env.BSC_DEPLOYER_PRIV_KEY}`]
    },
    puppynet: {
      url: `https://puppynet.shibrpc.com`,
      accounts: [`${process.env.PUPPY_DEPLOYER_PRIV_KEY}`]
    },
    rsktestnet: {
      url: `https://public-node.testnet.rsk.co`,
      accounts: [`${process.env.RSK_DEPLOYER_PRIV_KEY}`]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  mocha: {
    timeout: "1500s",
  }
};

export default config;
