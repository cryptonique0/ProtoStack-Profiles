// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ProtoStackProfileRegistry
 * @notice On-chain registry for ProtoStack user profiles
 * @dev Stores profile data hashes (IPFS CIDs) and verification status on-chain
 */
contract ProtoStackProfileRegistry is 
    Initializable, 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // ============ Structs ============
    
    struct Profile {
        string ipfsHash;           // IPFS CID containing profile data
        string username;           // Unique username
        bool isVerified;           // Verification status
        uint256 createdAt;         // Creation timestamp
        uint256 updatedAt;         // Last update timestamp
        bool exists;               // Whether profile exists
    }

    // ============ State Variables ============

    /// @notice Mapping from address to profile
    mapping(address => Profile) public profiles;
    
    /// @notice Mapping from username to address (for uniqueness)
    mapping(string => address) public usernameToAddress;
    
    /// @notice List of all profile addresses
    address[] public profileAddresses;
    
    /// @notice Mapping to check if address is in the list
    mapping(address => bool) public isRegistered;
    
    /// @notice Verifiers who can verify profiles
    mapping(address => bool) public verifiers;
    
    /// @notice Profile creation fee
    uint256 public creationFee;
    
    /// @notice Username change fee
    uint256 public usernameFee;
    
    /// @notice Total profiles created
    uint256 public totalProfiles;

    // ============ Events ============

    event ProfileCreated(
        address indexed owner,
        string username,
        string ipfsHash,
        uint256 timestamp
    );
    
    event ProfileUpdated(
        address indexed owner,
        string ipfsHash,
        uint256 timestamp
    );
    
    event UsernameChanged(
        address indexed owner,
        string oldUsername,
        string newUsername,
        uint256 timestamp
    );
    
    event ProfileVerified(
        address indexed owner,
        address indexed verifier,
        uint256 timestamp
    );
    
    event ProfileUnverified(
        address indexed owner,
        address indexed verifier,
        uint256 timestamp
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event FeeUpdated(string feeType, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // ============ Errors ============

    error ProfileAlreadyExists();
    error ProfileDoesNotExist();
    error UsernameAlreadyTaken();
    error UsernameTooShort();
    error UsernameTooLong();
    error UsernameInvalidCharacters();
    error InsufficientFee();
    error NotVerifier();
    error ZeroAddress();
    error TransferFailed();

    // ============ Modifiers ============

    modifier onlyVerifier() {
        if (!verifiers[msg.sender] && msg.sender != owner()) {
            revert NotVerifier();
        }
        _;
    }

    modifier profileExists(address _owner) {
        if (!profiles[_owner].exists) {
            revert ProfileDoesNotExist();
        }
        _;
    }

    // ============ Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _creationFee, uint256 _usernameFee) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        creationFee = _creationFee;
        usernameFee = _usernameFee;
    }

    // ============ External Functions ============

    /**
     * @notice Create a new profile
     * @param _username Unique username (3-20 chars, alphanumeric + underscore)
     * @param _ipfsHash IPFS CID containing profile data
     */
    function createProfile(
        string calldata _username,
        string calldata _ipfsHash
    ) external payable whenNotPaused nonReentrant {
        if (profiles[msg.sender].exists) revert ProfileAlreadyExists();
        if (msg.value < creationFee) revert InsufficientFee();
        
        _validateUsername(_username);
        if (usernameToAddress[_username] != address(0)) {
            revert UsernameAlreadyTaken();
        }

        profiles[msg.sender] = Profile({
            ipfsHash: _ipfsHash,
            username: _username,
            isVerified: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });
        
        usernameToAddress[_username] = msg.sender;
        profileAddresses.push(msg.sender);
        isRegistered[msg.sender] = true;
        totalProfiles++;

        emit ProfileCreated(msg.sender, _username, _ipfsHash, block.timestamp);
    }

    /**
     * @notice Update profile IPFS hash
     * @param _ipfsHash New IPFS CID
     */
    function updateProfile(
        string calldata _ipfsHash
    ) external whenNotPaused profileExists(msg.sender) {
        profiles[msg.sender].ipfsHash = _ipfsHash;
        profiles[msg.sender].updatedAt = block.timestamp;

        emit ProfileUpdated(msg.sender, _ipfsHash, block.timestamp);
    }

    /**
     * @notice Change username
     * @param _newUsername New username
     */
    function changeUsername(
        string calldata _newUsername
    ) external payable whenNotPaused profileExists(msg.sender) nonReentrant {
        if (msg.value < usernameFee) revert InsufficientFee();
        
        _validateUsername(_newUsername);
        if (usernameToAddress[_newUsername] != address(0)) {
            revert UsernameAlreadyTaken();
        }

        string memory oldUsername = profiles[msg.sender].username;
        
        // Free old username
        delete usernameToAddress[oldUsername];
        
        // Set new username
        profiles[msg.sender].username = _newUsername;
        profiles[msg.sender].updatedAt = block.timestamp;
        usernameToAddress[_newUsername] = msg.sender;

        emit UsernameChanged(msg.sender, oldUsername, _newUsername, block.timestamp);
    }

    /**
     * @notice Verify a profile
     * @param _owner Profile owner address
     */
    function verifyProfile(
        address _owner
    ) external onlyVerifier profileExists(_owner) {
        profiles[_owner].isVerified = true;
        profiles[_owner].updatedAt = block.timestamp;

        emit ProfileVerified(_owner, msg.sender, block.timestamp);
    }

    /**
     * @notice Remove verification from a profile
     * @param _owner Profile owner address
     */
    function unverifyProfile(
        address _owner
    ) external onlyVerifier profileExists(_owner) {
        profiles[_owner].isVerified = false;
        profiles[_owner].updatedAt = block.timestamp;

        emit ProfileUnverified(_owner, msg.sender, block.timestamp);
    }

    // ============ Admin Functions ============

    function addVerifier(address _verifier) external onlyOwner {
        if (_verifier == address(0)) revert ZeroAddress();
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    function setCreationFee(uint256 _fee) external onlyOwner {
        creationFee = _fee;
        emit FeeUpdated("creation", _fee);
    }

    function setUsernameFee(uint256 _fee) external onlyOwner {
        usernameFee = _fee;
        emit FeeUpdated("username", _fee);
    }

    function withdrawFees(address payable _to) external onlyOwner nonReentrant {
        if (_to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        
        (bool success, ) = _to.call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit FeesWithdrawn(_to, balance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function getProfile(address _owner) external view returns (Profile memory) {
        return profiles[_owner];
    }

    function getProfileByUsername(string calldata _username) external view returns (Profile memory, address) {
        address owner = usernameToAddress[_username];
        return (profiles[owner], owner);
    }

    function getAllProfiles(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (Profile[] memory, address[] memory, uint256) 
    {
        uint256 total = profileAddresses.length;
        if (_offset >= total) {
            return (new Profile[](0), new address[](0), total);
        }

        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - _offset;
        Profile[] memory result = new Profile[](length);
        address[] memory addresses = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            addresses[i] = profileAddresses[_offset + i];
            result[i] = profiles[addresses[i]];
        }

        return (result, addresses, total);
    }

    function isUsernameAvailable(string calldata _username) external view returns (bool) {
        return usernameToAddress[_username] == address(0);
    }

    // ============ Internal Functions ============

    function _validateUsername(string calldata _username) internal pure {
        bytes memory usernameBytes = bytes(_username);
        uint256 length = usernameBytes.length;
        
        if (length < 3) revert UsernameTooShort();
        if (length > 20) revert UsernameTooLong();

        for (uint256 i = 0; i < length; i++) {
            bytes1 char = usernameBytes[i];
            bool isValid = (char >= 0x30 && char <= 0x39) || // 0-9
                          (char >= 0x41 && char <= 0x5A) || // A-Z
                          (char >= 0x61 && char <= 0x7A) || // a-z
                          (char == 0x5F);                   // _
            
            if (!isValid) revert UsernameInvalidCharacters();
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
