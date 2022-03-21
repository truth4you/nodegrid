// const env = require("hardhat");

require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades')
// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
// require("./tasks/faucet");


// If you are using MetaMask, be sure to change the chainId to 1337
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 5,
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 5,
          },
        },
      }
    ]
  },
  // contractSizer: {
  //   alphaSort: true,
  //   disambiguatePaths: false,
  //   runOnCompile: true,
  //   strict: true,
  //   only: [':NodeGrid$',':NODERewardManagement$',':NodeManager$'],
  // },
  networks: {
    hardhat: {
      chainId: 31337
    },
    bsctestnet: {
      url: "https://speedy-nodes-nyc.moralis.io/9c7d826e61445651ed4326f8/bsc/testnet", // "https://data-seed-prebsc-1-s1.binance.org:8545/",   //  
      chainId:97,
      gasPrice: 20000000000,
      accounts: ["cde686c74df7db569dc5978b38ec5f051ad93a9f9729c4717993fec9a75fe335"]
    }
  },
  etherscan: {
    apiKey: "GJQFD5BXR754QEI1221TPAM94IRIE7B2FD"
  },
  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true
  }
};
