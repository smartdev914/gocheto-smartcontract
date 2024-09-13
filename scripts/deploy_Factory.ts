import hre, { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import ProgressBar from 'progress';
import chalk from "chalk";
import fs from "fs";

interface DeploymentObject {
  name: string;
  address: string;
  args: any;
  contract: Contract;
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// custom `deploy` in order to make verifying easier
const deploy = async (contractName, _args = [], overrides = {}) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  console.log(contractArgs);
  const stringifiedArgs = JSON.stringify(contractArgs);
  const contractArtifacts = await ethers.getContractFactory(contractName);
  const contract = await contractArtifacts.deploy(...contractArgs, overrides);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  fs.writeFileSync(`artifacts/${contractName}.address`, contractAddress);
  fs.writeFileSync(`artifacts/${contractName}.args`, stringifiedArgs);

  // tslint:disable-next-line: no-console
  console.log("Deploying", chalk.cyan(contractName), "contract to", chalk.magenta(contractAddress));

  const deployed = { name: contractName, address: contractAddress, args: contractArgs, contract };

  return deployed
}

const pause = (time: number) => new Promise(resolve => setTimeout(resolve, time));

const verifiableNetwork = ["mainnet", "goerli", "sepolia", "bsctestnet"];

async function main() {
  const network = process.env.HARDHAT_NETWORK === undefined ? "localhost" : process.env.HARDHAT_NETWORK;
  
  const [deployer] = await ethers.getSigners();
  // tslint:disable-next-line: no-console
  console.log("🚀 Deploying to", chalk.magenta(network), "!");
  if(
    network === "localhost" || 
    network === "hardhat"
  ) {

    // tslint:disable-next-line: no-console
    console.log(
      chalk.cyan("deploying contracts with the account:"),
      chalk.green(deployer.address)
    );

    // tslint:disable-next-line: no-console
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  }

  let contracts: DeploymentObject[] = [];
  // let coinAddresses: string[] = ["0x3a042493688489d3482e39435c2f6c8cf85a9d54", "0x236a6f60b554813486d84d581747217d77af05ff", "0x63e22542204da9978218fbb3c10e1c0f6d1dc2a7", "0x12cf8bf22be843f8c065a2474d1c439dadd238b6", "0x41c3f37587ebcd46c0f85ef43e38bcfe1e70ab56"]
  // let coinAddresses: string[] = ["0x11698417a0B237900C19c484Df62ceF2Df4d8D41", "0x3CDdc6764D5e7256f0F427508ADb6e5a969feDb6", "0xc106327e90Aa85A4Dd4Cd31f2E676459B3F5f81c"];
  let coinAddresses: string[] = ["0xdAC17F958D2ee523a2206206994597C13D831ec7", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", "0x6B175474E89094C44Da98b954EedeAC495271d0F"]

  const factory =  await deploy("UniswapV2Factory", [deployer.address, coinAddresses]);
  const coinHash = await factory.contract.pairCodeHash();
  console.log(coinHash);
  contracts.push(factory);

  // verification
  if(
    verifiableNetwork.includes(network)
    ) {
      let counter = 0;
      
      // tslint:disable-next-line: no-console
      console.log("Beginning Etherscan verification process...\n", 
        chalk.yellow(`WARNING: The process will wait two minutes for Etherscan 
        to update their backend before commencing, please wait and do not stop 
        the terminal process...`)
      );

      const bar = new ProgressBar('Etherscan update: [:bar] :percent :etas', { 
        total: 50,
        complete: '\u2588',
        incomplete: '\u2591',
      });

      // two minute timeout to let Etherscan update
      const timer = setInterval(() => {
        bar.tick();
        if(bar.complete) {
          clearInterval(timer);
        }
      }, 2300);

      await pause(120000);

      // tslint:disable-next-line: no-console
      console.log(chalk.cyan("\n🔍 Running Etherscan verification..."));
      
      await Promise.all(contracts.map(async contract => {
        // tslint:disable-next-line: no-console
        console.log(`Verifying ${contract.name}...`);
        try {
          await hre.run("verify:verify", {
            address: contract.address,
            constructorArguments: contract.args
          });
          // tslint:disable-next-line: no-console
          console.log(chalk.cyan(`✅ ${contract.name} verified!`));
        } catch (error) {
          // tslint:disable-next-line: no-console
          console.log(error);
        }
      }));
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // tslint:disable-next-line: no-console
    console.error(error);
    process.exit(1);
  });