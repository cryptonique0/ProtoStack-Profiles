const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying monetization contracts with account:', deployer.address);
  console.log(
    'Account balance:',
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  const platformFeeRecipient = process.env.PLATFORM_FEE_RECIPIENT || deployer.address; // default to deployer

  console.log('\n=== Deploying ProtoStack Monetization Contracts ===\n');

  // 1) Subscription NFT (no constructor args)
  console.log('1. Deploying ProtoStackSubscriptionNFT...');
  const Subscription = await ethers.getContractFactory('ProtoStackSubscriptionNFT');
  const subscription = await Subscription.deploy();
  await subscription.waitForDeployment();
  const subscriptionAddress = await subscription.getAddress();
  console.log('   ProtoStackSubscriptionNFT deployed to:', subscriptionAddress);

  // 2) Tipping contract (needs platform fee recipient)
  console.log('2. Deploying ProtoStackTipping...');
  const Tipping = await ethers.getContractFactory('ProtoStackTipping');
  const tipping = await Tipping.deploy(platformFeeRecipient);
  await tipping.waitForDeployment();
  const tippingAddress = await tipping.getAddress();
  console.log('   ProtoStackTipping deployed to:', tippingAddress);

  // Summary
  console.log('\n=== Deployment Summary ===\n');
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Platform fee recipient:', platformFeeRecipient);
  console.log('ProtoStackSubscriptionNFT:', subscriptionAddress);
  console.log('ProtoStackTipping:', tippingAddress);

  return { subscriptionAddress, tippingAddress, platformFeeRecipient };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
