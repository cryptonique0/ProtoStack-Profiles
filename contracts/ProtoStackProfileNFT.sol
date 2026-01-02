// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ProtoStackProfileNFT
 * @notice Soulbound Profile NFT for ProtoStack users
 * @dev Non-transferable NFT representing a user's profile
 */
contract ProtoStackProfileNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    Ownable, 
    ReentrancyGuard 
{
    using Counters for Counters.Counter;

    // ============ State Variables ============

    Counters.Counter private _tokenIds;

    /// @notice Mapping from address to token ID (1 profile per address)
    mapping(address => uint256) public addressToTokenId;

    /// @notice Mapping from token ID to address
    mapping(uint256 => address) public tokenIdToAddress;

    /// @notice Whether transfers are allowed (soulbound by default)
    bool public transfersEnabled;

    /// @notice Minting fee
    uint256 public mintFee;

    /// @notice Maximum supply (0 = unlimited)
    uint256 public maxSupply;

    /// @notice Authorized minters
    mapping(address => bool) public minters;

    // ============ Events ============

    event ProfileMinted(
        address indexed owner,
        uint256 indexed tokenId,
        string tokenURI,
        uint256 timestamp
    );
    
    event ProfileBurned(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 timestamp
    );
    
    event TokenURIUpdated(
        uint256 indexed tokenId,
        string oldURI,
        string newURI
    );
    
    event TransfersToggled(bool enabled);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // ============ Errors ============

    error AlreadyHasProfile();
    error NoProfileToUpdate();
    error TransfersDisabled();
    error InsufficientFee();
    error MaxSupplyReached();
    error NotMinter();
    error ZeroAddress();
    error NotOwnerOfToken();

    // ============ Modifiers ============

    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) {
            revert NotMinter();
        }
        _;
    }

    // ============ Constructor ============

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _mintFee,
        uint256 _maxSupply
    ) ERC721(_name, _symbol) {
        mintFee = _mintFee;
        maxSupply = _maxSupply;
        transfersEnabled = false; // Soulbound by default
    }

    // ============ External Functions ============

    /**
     * @notice Mint a new profile NFT
     * @param _tokenURI IPFS URI for profile metadata
     */
    function mint(string calldata _tokenURI) external payable nonReentrant {
        if (addressToTokenId[msg.sender] != 0) revert AlreadyHasProfile();
        if (msg.value < mintFee) revert InsufficientFee();
        if (maxSupply > 0 && _tokenIds.current() >= maxSupply) {
            revert MaxSupplyReached();
        }

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        addressToTokenId[msg.sender] = newTokenId;
        tokenIdToAddress[newTokenId] = msg.sender;

        emit ProfileMinted(msg.sender, newTokenId, _tokenURI, block.timestamp);
    }

    /**
     * @notice Mint a profile NFT for another address (minter only)
     * @param _to Recipient address
     * @param _tokenURI IPFS URI for profile metadata
     */
    function mintFor(
        address _to,
        string calldata _tokenURI
    ) external onlyMinter nonReentrant {
        if (_to == address(0)) revert ZeroAddress();
        if (addressToTokenId[_to] != 0) revert AlreadyHasProfile();
        if (maxSupply > 0 && _tokenIds.current() >= maxSupply) {
            revert MaxSupplyReached();
        }

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        addressToTokenId[_to] = newTokenId;
        tokenIdToAddress[newTokenId] = _to;

        emit ProfileMinted(_to, newTokenId, _tokenURI, block.timestamp);
    }

    /**
     * @notice Update profile token URI
     * @param _newTokenURI New IPFS URI
     */
    function updateTokenURI(string calldata _newTokenURI) external {
        uint256 tokenId = addressToTokenId[msg.sender];
        if (tokenId == 0) revert NoProfileToUpdate();

        string memory oldURI = tokenURI(tokenId);
        _setTokenURI(tokenId, _newTokenURI);

        emit TokenURIUpdated(tokenId, oldURI, _newTokenURI);
    }

    /**
     * @notice Burn your profile NFT
     */
    function burn() external {
        uint256 tokenId = addressToTokenId[msg.sender];
        if (tokenId == 0) revert NoProfileToUpdate();

        delete addressToTokenId[msg.sender];
        delete tokenIdToAddress[tokenId];
        
        _burn(tokenId);

        emit ProfileBurned(msg.sender, tokenId, block.timestamp);
    }

    // ============ Admin Functions ============

    function addMinter(address _minter) external onlyOwner {
        if (_minter == address(0)) revert ZeroAddress();
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    function setMintFee(uint256 _fee) external onlyOwner {
        mintFee = _fee;
    }

    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        maxSupply = _maxSupply;
    }

    function toggleTransfers(bool _enabled) external onlyOwner {
        transfersEnabled = _enabled;
        emit TransfersToggled(_enabled);
    }

    function withdraw(address payable _to) external onlyOwner nonReentrant {
        if (_to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        (bool success, ) = _to.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ============ View Functions ============

    function totalMinted() external view returns (uint256) {
        return _tokenIds.current();
    }

    function hasProfile(address _owner) external view returns (bool) {
        return addressToTokenId[_owner] != 0;
    }

    function getTokenId(address _owner) external view returns (uint256) {
        return addressToTokenId[_owner];
    }

    // ============ Overrides ============

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block transfers unless enabled
        if (from != address(0) && to != address(0) && !transfersEnabled) {
            revert TransfersDisabled();
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
