const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Configuration
  const CREATION_FEE = ethers.parseEther("0.001"); // 0.001 ETH
  const USERNAME_FEE = ethers.parseEther("0.0005"); // 0.0005 ETH
  const NFT_MINT_FEE = ethers.parseEther("0.001"); // 0.001 ETH
  const NFT_MAX_SUPPLY = 0; // Unlimited

  console.log("\n=== Deploying ProtoStack Contracts ===\n");

  // 1. Deploy Profile Registry (Upgradeable)
  console.log("1. Deploying ProtoStackProfileRegistry...");
  const ProfileRegistry = await ethers.getContractFactory("ProtoStackProfileRegistry");
  const profileRegistry = await upgrades.deployProxy(
    ProfileRegistry,
    [CREATION_FEE, USERNAME_FEE],
    { initializer: "initialize", kind: "uups" }
  );
  await profileRegistry.waitForDeployment();
  const registryAddress = await profileRegistry.getAddress();
  console.log("   ProtoStackProfileRegistry deployed to:", registryAddress);

  // 2. Deploy Profile NFT
  console.log("2. Deploying ProtoStackProfileNFT...");
  const ProfileNFT = await ethers.getContractFactory("ProtoStackProfileNFT");
  const profileNFT = await ProfileNFT.deploy(
    "ProtoStack Profile",
    "PROTO",
    NFT_MINT_FEE,
    NFT_MAX_SUPPLY
  );
  await profileNFT.waitForDeployment();
  const nftAddress = await profileNFT.getAddress();
  console.log("   ProtoStackProfileNFT deployed to:", nftAddress);

  // 3. Deploy Badges
  console.log("3. Deploying ProtoStackBadges...");
  const Badges = await ethers.getContractFactory("ProtoStackBadges");
  const badges = await Badges.deploy(
    "ProtoStack Badges",
    "PROTOBADGE",
    "https://api.protostack.dev/badges/"
  );
  await badges.waitForDeployment();
  const badgesAddress = await badges.getAddress();
  console.log("   ProtoStackBadges deployed to:", badgesAddress);

  // 4. Setup initial configuration
  console.log("\n=== Setting Up Initial Configuration ===\n");

  // Add deployer as verifier in registry
  console.log("4. Adding deployer as verifier...");
  await profileRegistry.addVerifier(deployer.address);
  console.log("   Verifier added:", deployer.address);

  // Add deployer as minter in NFT
  console.log("5. Adding deployer as minter for NFT...");
  await profileNFT.addMinter(deployer.address);
  console.log("   Minter added:", deployer.address);

  // Create initial badges
  console.log("6. Creating initial badges...");
  
  const initialBadges = [
    {
      name: "Early Adopter",
      description: "One of the first to join ProtoStack",
      imageURI: "ipfs://QmEarlyAdopter",
      category: "achievement",
      points: 100,
      maxSupply: 1000,
      transferable: false,
    },
    {
      name: "Profile Creator",
      description: "Created a profile on ProtoStack",
      imageURI: "ipfs://QmProfileCreator",
      category: "achievement",
      points: 50,
      maxSupply: 0,
      transferable: false,
    },
    {
      name: "Verified",
      description: "Verified identity on ProtoStack",
      imageURI: "ipfs://QmVerified",
      category: "achievement",
      points: 200,
      maxSupply: 0,
      transferable: false,
    },
    {
      name: "Community Builder",
      description: "Followed 10 or more profiles",
      imageURI: "ipfs://QmCommunityBuilder",
      category: "community",
      points: 75,
      maxSupply: 0,
      transferable: false,
    },
    {
      name: "Social Butterfly",
      description: "Gained 100 or more followers",
      imageURI: "ipfs://QmSocialButterfly",
      category: "community",
      points: 150,
      maxSupply: 0,
      transferable: false,
    },
  ];

  for (const badge of initialBadges) {
    const tx = await badges.createBadge(
      badge.name,
      badge.description,
      badge.imageURI,
      badge.category,
      badge.points,
      badge.maxSupply,
      badge.transferable
    );
    await tx.wait();
    console.log(`   Created badge: ${badge.name}`);
  }

  // Summary
  console.log("\n=== Deployment Summary ===\n");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("");
  console.log("Contracts:");
  console.log("  ProtoStackProfileRegistry:", registryAddress);
  console.log("  ProtoStackProfileNFT:", nftAddress);
  console.log("  ProtoStackBadges:", badgesAddress);
  console.log("");
  console.log("Configuration:");
  console.log("  Profile Creation Fee:", ethers.formatEther(CREATION_FEE), "ETH");
  console.log("  Username Change Fee:", ethers.formatEther(USERNAME_FEE), "ETH");
  console.log("  NFT Mint Fee:", ethers.formatEther(NFT_MINT_FEE), "ETH");
  console.log("  NFT Max Supply:", NFT_MAX_SUPPLY === 0 ? "Unlimited" : NFT_MAX_SUPPLY);
  console.log("  Initial Badges Created:", initialBadges.length);
  console.log("");
  console.log("=== Deployment Complete ===");

  // Return addresses for verification
  return {
    profileRegistry: registryAddress,
    profileNFT: nftAddress,
    badges: badgesAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
