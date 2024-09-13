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

  const weth9 =  await deploy("WETH9Mock", []);
  contracts.push(weth9);

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