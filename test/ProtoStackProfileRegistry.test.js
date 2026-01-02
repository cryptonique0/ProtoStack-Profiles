const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('ProtoVMProfileRegistry', function () {
  let registry;
  let owner;
  let user1;
  let user2;
  let verifier;

  const CREATION_FEE = ethers.parseEther('0.001');
  const USERNAME_FEE = ethers.parseEther('0.0005');

  beforeEach(async function () {
    [owner, user1, user2, verifier] = await ethers.getSigners();

    const ProfileRegistry = await ethers.getContractFactory('ProtoVMProfileRegistry');
    registry = await upgrades.deployProxy(ProfileRegistry, [CREATION_FEE, USERNAME_FEE], {
      initializer: 'initialize',
      kind: 'uups',
    });
    await registry.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the correct creation fee', async function () {
      expect(await registry.creationFee()).to.equal(CREATION_FEE);
    });

    it('Should set the correct username fee', async function () {
      expect(await registry.usernameFee()).to.equal(USERNAME_FEE);
    });

    it('Should set the correct owner', async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe('Profile Creation', function () {
    it('Should create a profile with valid username and fee', async function () {
      const username = 'testuser';
      const ipfsHash = 'QmTestHash123';

      await expect(
        registry.connect(user1).createProfile(username, ipfsHash, { value: CREATION_FEE })
      )
        .to.emit(registry, 'ProfileCreated')
        .withArgs(
          user1.address,
          username,
          ipfsHash,
          await ethers.provider.getBlock('latest').then((b) => b.timestamp + 1)
        );

      const profile = await registry.getProfile(user1.address);
      expect(profile.username).to.equal(username);
      expect(profile.ipfsHash).to.equal(ipfsHash);
      expect(profile.exists).to.be.true;
    });

    it('Should reject profile creation with insufficient fee', async function () {
      await expect(
        registry.connect(user1).createProfile('testuser', 'QmHash', { value: 0 })
      ).to.be.revertedWithCustomError(registry, 'InsufficientFee');
    });

    it('Should reject duplicate profile creation', async function () {
      await registry.connect(user1).createProfile('user1', 'QmHash1', { value: CREATION_FEE });

      await expect(
        registry.connect(user1).createProfile('user1again', 'QmHash2', { value: CREATION_FEE })
      ).to.be.revertedWithCustomError(registry, 'ProfileAlreadyExists');
    });

    it('Should reject duplicate username', async function () {
      await registry.connect(user1).createProfile('testuser', 'QmHash1', { value: CREATION_FEE });

      await expect(
        registry.connect(user2).createProfile('testuser', 'QmHash2', { value: CREATION_FEE })
      ).to.be.revertedWithCustomError(registry, 'UsernameAlreadyTaken');
    });

    it('Should reject username shorter than 3 characters', async function () {
      await expect(
        registry.connect(user1).createProfile('ab', 'QmHash', { value: CREATION_FEE })
      ).to.be.revertedWithCustomError(registry, 'UsernameTooShort');
    });

    it('Should reject username longer than 20 characters', async function () {
      await expect(
        registry.connect(user1).createProfile('a'.repeat(21), 'QmHash', { value: CREATION_FEE })
      ).to.be.revertedWithCustomError(registry, 'UsernameTooLong');
    });

    it('Should reject username with invalid characters', async function () {
      await expect(
        registry.connect(user1).createProfile('test@user', 'QmHash', { value: CREATION_FEE })
      ).to.be.revertedWithCustomError(registry, 'UsernameInvalidCharacters');
    });
  });

  describe('Profile Updates', function () {
    beforeEach(async function () {
      await registry
        .connect(user1)
        .createProfile('testuser', 'QmOriginalHash', { value: CREATION_FEE });
    });

    it('Should update profile IPFS hash', async function () {
      const newHash = 'QmNewHash123';

      await expect(registry.connect(user1).updateProfile(newHash)).to.emit(
        registry,
        'ProfileUpdated'
      );

      const profile = await registry.getProfile(user1.address);
      expect(profile.ipfsHash).to.equal(newHash);
    });

    it('Should change username with fee', async function () {
      const newUsername = 'newusername';

      await expect(
        registry.connect(user1).changeUsername(newUsername, { value: USERNAME_FEE })
      ).to.emit(registry, 'UsernameChanged');

      const profile = await registry.getProfile(user1.address);
      expect(profile.username).to.equal(newUsername);
    });

    it('Should free old username after change', async function () {
      await registry.connect(user1).changeUsername('newusername', { value: USERNAME_FEE });

      // Old username should be available
      expect(await registry.isUsernameAvailable('testuser')).to.be.true;
    });
  });

  describe('Verification', function () {
    beforeEach(async function () {
      await registry.connect(user1).createProfile('testuser', 'QmHash', { value: CREATION_FEE });
      await registry.addVerifier(verifier.address);
    });

    it('Should allow verifier to verify profile', async function () {
      await expect(registry.connect(verifier).verifyProfile(user1.address)).to.emit(
        registry,
        'ProfileVerified'
      );

      const profile = await registry.getProfile(user1.address);
      expect(profile.isVerified).to.be.true;
    });

    it('Should allow verifier to unverify profile', async function () {
      await registry.connect(verifier).verifyProfile(user1.address);

      await expect(registry.connect(verifier).unverifyProfile(user1.address)).to.emit(
        registry,
        'ProfileUnverified'
      );

      const profile = await registry.getProfile(user1.address);
      expect(profile.isVerified).to.be.false;
    });

    it('Should reject non-verifier from verifying', async function () {
      await expect(
        registry.connect(user2).verifyProfile(user1.address)
      ).to.be.revertedWithCustomError(registry, 'NotVerifier');
    });
  });

  describe('Admin Functions', function () {
    it('Should allow owner to add verifier', async function () {
      await expect(registry.addVerifier(verifier.address)).to.emit(registry, 'VerifierAdded');

      expect(await registry.verifiers(verifier.address)).to.be.true;
    });

    it('Should allow owner to remove verifier', async function () {
      await registry.addVerifier(verifier.address);

      await expect(registry.removeVerifier(verifier.address)).to.emit(registry, 'VerifierRemoved');

      expect(await registry.verifiers(verifier.address)).to.be.false;
    });

    it('Should allow owner to update fees', async function () {
      const newFee = ethers.parseEther('0.01');

      await registry.setCreationFee(newFee);
      expect(await registry.creationFee()).to.equal(newFee);
    });

    it('Should allow owner to withdraw fees', async function () {
      await registry.connect(user1).createProfile('testuser', 'QmHash', { value: CREATION_FEE });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await registry.withdrawFees(owner.address);
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it('Should allow owner to pause and unpause', async function () {
      await registry.pause();

      await expect(
        registry.connect(user1).createProfile('testuser', 'QmHash', { value: CREATION_FEE })
      ).to.be.revertedWith('Pausable: paused');

      await registry.unpause();

      await expect(
        registry.connect(user1).createProfile('testuser', 'QmHash', { value: CREATION_FEE })
      ).to.emit(registry, 'ProfileCreated');
    });
  });

  describe('View Functions', function () {
    beforeEach(async function () {
      await registry.connect(user1).createProfile('user1', 'QmHash1', { value: CREATION_FEE });
      await registry.connect(user2).createProfile('user2', 'QmHash2', { value: CREATION_FEE });
    });

    it('Should get profile by username', async function () {
      const [profile, addr] = await registry.getProfileByUsername('user1');
      expect(addr).to.equal(user1.address);
      expect(profile.username).to.equal('user1');
    });

    it('Should check username availability', async function () {
      expect(await registry.isUsernameAvailable('user1')).to.be.false;
      expect(await registry.isUsernameAvailable('available')).to.be.true;
    });

    it('Should get all profiles with pagination', async function () {
      const [profiles, addresses, total] = await registry.getAllProfiles(0, 10);
      expect(total).to.equal(2);
      expect(profiles.length).to.equal(2);
      expect(addresses.length).to.equal(2);
    });
  });
});
