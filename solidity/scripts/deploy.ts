import hre from "hardhat";
import { TournamentManager, BracketNFT, GameScoreOracle, TestScoreOracle } from "../typechain-types";
import { enterTournamentWithTesters } from "../utils/enterTournamentWithTesters";
// Colour codes for terminal prints
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

const DURATION_BEFORE_TOURNAMENT_STARTS = 600; // 10 minutes
// TURN THIS OFF ON PRODUCTION DEPLOYS
const CREATE_TOURNAMENT_ON_DEPLOY = {
  enabled: true,
  entryFee: "10000000000000", // 0.00001 ETH
  paymentToken: "0x0000000000000000000000000000000000000000", // ETH
  startTime: Math.floor(Date.now() / 1000) + DURATION_BEFORE_TOURNAMENT_STARTS, // Current time + 1 hour
}

// TURN THIS OFF ON PRODUCTION DEPLOYS
const AUTOMATICALLY_FETCH_TEAM_WINS_ON_DEPLOY = {
  enabled: true,
  jobId: "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000",
  gasLimit: 200000n,
}

// TURN THIS OFF ON PRODUCTION DEPLOYS
const automaticallyEnterTournament = true;
const AUTOMATICALLY_ENTER_TOURNAMENT_ON_DEPLOY = {
  // create must be enabled to enter the tournament
  enabled: !CREATE_TOURNAMENT_ON_DEPLOY.enabled ? false : automaticallyEnterTournament,
  numEntries: 10,
}

// TURN THIS OFF ON PRODUCTION DEPLOYS
const DEPLOY_TEST_SCORE_ORACLE = true;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FUNCTIONS_ROUTER = {
  "84532": "0xf9B8fc078197181C841c296C876945aaa425B278",
  "8453": "0xf9b8fc078197181c841c296c876945aaa425b278",
}

const FUNCTIONS_SUBSCRIPTION_ID = {
  "84532": 290,// 208 is myk's subscription
  "8453": 6,
}

const CHAINLINK_SUBSCRIPTION_ID = {
  "84532": 290n,
  "8453": 6n,
}

const FUNCTIONS_SUBSCRIPTIONS_REGISTRY = {
  "84532": "0xf9B8fc078197181C841c296C876945aaa425B278",
  "8453": "0xf9B8fc078197181C841c296C876945aaa425B278",
}

const FUNCTION_SUBSCRIPTION_ABI = [{
  "inputs":[{"internalType":"uint64","name":"subscriptionId","type":"uint64"},{"internalType":"address","name":"consumer","type":"address"}],
  "name":"addConsumer",
  "outputs":[],
  "stateMutability":"nonpayable",
  "type":"function"
}];

interface ContractToVerify {
  name: string;
  address: string;
  constructorArguments: unknown[];
}
const contractsToVerify: ContractToVerify[] = [];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const { chainId } = await deployer.provider.getNetwork();

  // log the amount of ether in the deployer's account
  const balanceBefore = await deployer.provider.getBalance(deployer.address);
  console.log(`Deployer balance (ETH): ${hre.ethers.formatEther(balanceBefore)}\n\n`);

  let nft: BracketNFT;
  try {
    nft = await hre.ethers.deployContract("BracketNFT");
    await nft.waitForDeployment();
  } catch (e) {
    console.log("Error deploying BracketNFT contract, waiting 10 seconds before retrying...\n", e);
    await delay(10000); // wait 10 seconds
    nft = await hre.ethers.deployContract("BracketNFT");
    await nft.waitForDeployment();
  }
  const nftAddress = await nft.getAddress();
  contractsToVerify.push({
    name: "BracketNFT",
    address: nftAddress,
    constructorArguments: [],
  });
  console.log("BracketNFT deployed to: " + `${GREEN}${nftAddress}${RESET}\n`);

  const gameScoreOracleArgs = DEPLOY_TEST_SCORE_ORACLE ? [deployer.address] : [
    FUNCTIONS_ROUTER[chainId.toString() as keyof typeof FUNCTIONS_ROUTER]
  ];
  let gameScoreOracle: GameScoreOracle | TestScoreOracle;

  if (DEPLOY_TEST_SCORE_ORACLE) {
    gameScoreOracle = await hre.ethers.deployContract("TestScoreOracle", gameScoreOracleArgs);
    await gameScoreOracle.waitForDeployment();
  } else {
    try {
      gameScoreOracle = await hre.ethers.deployContract("GameScoreOracle", gameScoreOracleArgs);
      await gameScoreOracle.waitForDeployment();
    } catch (e) {
      console.log("Error deploying GameScoreOracle contract, waiting 10 seconds before retrying...\n", e);
      await delay(10000); // wait 10 seconds
      gameScoreOracle = await hre.ethers.deployContract("GameScoreOracle", gameScoreOracleArgs);
      await gameScoreOracle.waitForDeployment();
    }
  }
  const gameScoreOracleAddress = await gameScoreOracle.getAddress();
  contractsToVerify.push({
    name: "gameScoreOracle",
    address: gameScoreOracleAddress,
    constructorArguments: gameScoreOracleArgs,
  });
  console.log("gameScoreOracle deployed to: " + `${GREEN}${gameScoreOracleAddress}${RESET}\n`);

  if (!DEPLOY_TEST_SCORE_ORACLE) {
    // get the contract deployed at the functions subscription registry
    const functionsSubscriptionRegistry = await hre.ethers.getContractAt(
      FUNCTION_SUBSCRIPTION_ABI,
      FUNCTIONS_SUBSCRIPTIONS_REGISTRY[chainId.toString() as keyof typeof FUNCTIONS_SUBSCRIPTIONS_REGISTRY]
    );
    // call the addConsumer function
    await functionsSubscriptionRegistry.addConsumer(
      FUNCTIONS_SUBSCRIPTION_ID[chainId.toString() as keyof typeof FUNCTIONS_SUBSCRIPTION_ID],
      gameScoreOracleAddress
    );
    console.log("GameScoreOracle added to the Functions Subscription Registry\n");
  }

  const isAutomaticallyFetchingTeamWins = AUTOMATICALLY_FETCH_TEAM_WINS_ON_DEPLOY.enabled;
  const automaticFetchColor = isAutomaticallyFetchingTeamWins ? GREEN : RED;
  console.log("Automatically fetch team wins on deploy enabled: " + `${automaticFetchColor}${isAutomaticallyFetchingTeamWins}${RESET}`);
  // check if the automatically fetch team wins is enabled
  if (isAutomaticallyFetchingTeamWins) {
    console.log("Fetching team wins...\n");
    if (DEPLOY_TEST_SCORE_ORACLE) {
      await (gameScoreOracle as TestScoreOracle).setTeamWins(51, 6);
      await (gameScoreOracle as TestScoreOracle).setTeamWins(2, 5);
      await (gameScoreOracle as TestScoreOracle).setTeamWins(9, 4);
      await (gameScoreOracle as TestScoreOracle).setTeamWins(145, 4);
      await (gameScoreOracle as TestScoreOracle).setTeamWins(24, 3);
      await (gameScoreOracle as TestScoreOracle).setTeamWins(155, 3);
      await (gameScoreOracle as TestScoreOracle).setTeamWins(22, 3);
    } else {
      try {
        // call the fetchTeamWins function
        await gameScoreOracle.fetchTeamWins(
          [],
          CHAINLINK_SUBSCRIPTION_ID[chainId.toString() as keyof typeof CHAINLINK_SUBSCRIPTION_ID],
          AUTOMATICALLY_FETCH_TEAM_WINS_ON_DEPLOY.gasLimit,
          AUTOMATICALLY_FETCH_TEAM_WINS_ON_DEPLOY.jobId,
        );
        console.log("Team wins fetched\n");
      } catch (e) {
        console.log("Error fetching team wins, waiting 5 seconds before retrying...\n", e);
        await delay(5000); // wait 5 seconds
        try {
          // call the fetchTeamWins function
          await gameScoreOracle.fetchTeamWins(
            [],
            CHAINLINK_SUBSCRIPTION_ID[chainId.toString() as keyof typeof CHAINLINK_SUBSCRIPTION_ID],
            AUTOMATICALLY_FETCH_TEAM_WINS_ON_DEPLOY.gasLimit,
            AUTOMATICALLY_FETCH_TEAM_WINS_ON_DEPLOY.jobId,
          );
          console.log("Team wins fetched\n");
        } catch (e) {
          console.log(`${RED}Error fetching team wins, giving up...\n${RESET}`, e);
        }
      }
    }
  }

  const tournamentManagerArgs = [
    await nft.getAddress(),
    await deployer.getAddress(),
    gameScoreOracleAddress,
  ];
  let tournamentManager: TournamentManager;
  try {
    tournamentManager = await hre.ethers.deployContract("TournamentManager", tournamentManagerArgs);
    await tournamentManager.waitForDeployment();
  } catch (e) {
    console.log("Error deploying TournamentManager contract, waiting 10 seconds before retrying...\n", e);
    await delay(10000); // wait 10 seconds
    tournamentManager = await hre.ethers.deployContract("TournamentManager", tournamentManagerArgs);
    await tournamentManager.waitForDeployment();
  }
  const tournamentManagerAddress = await tournamentManager.getAddress();
  contractsToVerify.push({
    name: "TournamentManager",
    address: tournamentManagerAddress,
    constructorArguments: tournamentManagerArgs,
  });
  console.log("TournamentManager deployed to: " + `${GREEN}${tournamentManagerAddress}${RESET}\n`);

  // set the tournament manager in the bracket NFT
  await nft.setTournamentManager(tournamentManagerAddress);
  console.log("TournamentManager set in the BracketNFT contract\n");

  const isCreatingTournamentOnDeploy = CREATE_TOURNAMENT_ON_DEPLOY.enabled;
  const createTournamentColor = isCreatingTournamentOnDeploy ? GREEN : RED;
  console.log("Creation of tournament on deploy enabled: " + `${createTournamentColor}${isCreatingTournamentOnDeploy}${RESET}`);
  if (isCreatingTournamentOnDeploy) {
    console.log("Creating tournament on deploy...\n");  
    await tournamentManager.createTournament(
      CREATE_TOURNAMENT_ON_DEPLOY.entryFee,
      CREATE_TOURNAMENT_ON_DEPLOY.paymentToken,
      CREATE_TOURNAMENT_ON_DEPLOY.startTime
    );
    const durationHumanReadable = `${DURATION_BEFORE_TOURNAMENT_STARTS / 60} minutes`;
    console.log(`Tournament created on deploy. You have ${durationHumanReadable} to add your bracket before the tournament starts.\n`);
  }

  console.log(
    "Waiting 30 seconds before beginning the contract verification to allow the block explorer to index the contract...\n",
  );

  const isAutomaticallyEnteringTournament = AUTOMATICALLY_ENTER_TOURNAMENT_ON_DEPLOY.enabled;
  const automaticallyEnterTournamentColor = isAutomaticallyEnteringTournament ? GREEN : RED;
  console.log("Automatically enter tournament on deploy enabled: " + `${automaticallyEnterTournamentColor}${isAutomaticallyEnteringTournament}${RESET}`);
  if (isAutomaticallyEnteringTournament) {
    console.log("Entering tournament on deploy...\n");
    await enterTournamentWithTesters(
      tournamentManager,
      0,
      AUTOMATICALLY_ENTER_TOURNAMENT_ON_DEPLOY.numEntries,
    );
  }


  await delay(30000); // Wait for 30 seconds before verifying the contracts

  for (const contract of contractsToVerify) {
    const { name, address, constructorArguments } = contract;
    console.log(`Verifying ${name} at address: ${GREEN}${address}${RESET}`);
    // if this is the last contract to verify, wait 20 seconds before verifying
    if (address === contractsToVerify[contractsToVerify.length - 1].address) {
      console.log("Waiting 20 seconds before verifying the last contract...\n");
      await delay(20000);
      console.log("Verifying the last contract...\n");
    }
    try {
      await hre.run("verify:verify", {
        address, 
        constructorArguments
      });
      console.log(`Successfully verified ${contract.name} at address: ${GREEN}${contract.address}${RESET}\n`);
    } catch (e) {
      console.log("Error verifying contract, waiting 10 seconds before retrying...\n", e);
      await delay(10000); // wait 10 seconds
      try {
        await hre.run("verify:verify", {
          address, 
          constructorArguments
        });
        console.log(`Successfully verified ${contract.name} at address: ${GREEN}${contract.address}${RESET}\n`);
      } catch (e) {
        console.log(`${RED}Error verifying contract, giving up...\n${RESET}`, e);
      }
    }
  }
  const balanceAfter = await deployer.provider.getBalance(deployer.address);
  const gasSpent = balanceBefore - balanceAfter;
  console.log(`\n\nDeployer balance after (ETH): ${hre.ethers.formatEther(balanceAfter)}`);
  console.log(`Deployer gas spent (ETH): ${hre.ethers.formatEther(gasSpent)}\n\n`);

  console.table(contractsToVerify.reduce((acc: Record<string, string>, contract) => {
    acc[contract.name] = contract.address;
    return acc;
  }, {}));
  // Uncomment if you want to enable the `tenderly` extension
  // await hre.tenderly.verify({
  //   name: "Greeter",
  //   address: contractAddress,
  // });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});