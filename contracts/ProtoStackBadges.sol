// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ProtoStackBadges
 * @notice Achievement badge NFTs for ProtoStack profiles
 * @dev ERC1155 multi-token standard for badges
 */
contract ProtoStackBadges is 
    ERC1155, 
    ERC1155Supply, 
    AccessControl, 
    ReentrancyGuard 
{
    // ============ Roles ============

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BADGE_ADMIN_ROLE = keccak256("BADGE_ADMIN_ROLE");

    // ============ Structs ============

    struct Badge {
        string name;
        string description;
        string imageURI;
        string category;
        uint256 points;
        uint256 maxSupply;      // 0 = unlimited
        bool transferable;
        bool active;
        uint256 createdAt;
    }

    // ============ State Variables ============

    /// @notice Contract name
    string public name;

    /// @notice Contract symbol
    string public symbol;

    /// @notice Badge metadata
    mapping(uint256 => Badge) public badges;

    /// @notice Track which addresses have earned which badges
    mapping(address => mapping(uint256 => bool)) public hasBadge;

    /// @notice Track when badge was earned
    mapping(address => mapping(uint256 => uint256)) public badgeEarnedAt;

    /// @notice Total badges created
    uint256 public totalBadges;

    /// @notice Categories
    string[] public categories;
    mapping(string => bool) public categoryExists;

    // ============ Events ============

    event BadgeCreated(
        uint256 indexed badgeId,
        string name,
        string category,
        uint256 points,
        uint256 maxSupply
    );

    event BadgeAwarded(
        address indexed recipient,
        uint256 indexed badgeId,
        uint256 timestamp
    );

    event BadgeRevoked(
        address indexed holder,
        uint256 indexed badgeId,
        uint256 timestamp
    );

    event BadgeUpdated(uint256 indexed badgeId);
    event CategoryAdded(string category);

    // ============ Errors ============

    error BadgeDoesNotExist();
    error BadgeNotActive();
    error MaxSupplyReached();
    error AlreadyHasBadge();
    error DoesNotHaveBadge();
    error BadgeNotTransferable();
    error CategoryDoesNotExist();
    error ZeroAddress();

    // ============ Constructor ============

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    ) ERC1155(_baseURI) {
        name = _name;
        symbol = _symbol;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BADGE_ADMIN_ROLE, msg.sender);

        // Initialize default categories
        _addCategory("achievement");
        _addCategory("participation");
        _addCategory("special");
        _addCategory("seasonal");
        _addCategory("community");
    }

    // ============ Badge Management ============

    /**
     * @notice Create a new badge type
     */
    function createBadge(
        string calldata _name,
        string calldata _description,
        string calldata _imageURI,
        string calldata _category,
        uint256 _points,
        uint256 _maxSupply,
        bool _transferable
    ) external onlyRole(BADGE_ADMIN_ROLE) returns (uint256) {
        if (!categoryExists[_category]) revert CategoryDoesNotExist();

        totalBadges++;
        uint256 badgeId = totalBadges;

        badges[badgeId] = Badge({
            name: _name,
            description: _description,
            imageURI: _imageURI,
            category: _category,
            points: _points,
            maxSupply: _maxSupply,
            transferable: _transferable,
            active: true,
            createdAt: block.timestamp
        });

        emit BadgeCreated(badgeId, _name, _category, _points, _maxSupply);
        return badgeId;
    }

    /**
     * @notice Update badge metadata
     */
    function updateBadge(
        uint256 _badgeId,
        string calldata _description,
        string calldata _imageURI,
        uint256 _points,
        bool _active
    ) external onlyRole(BADGE_ADMIN_ROLE) {
        if (!_badgeExists(_badgeId)) revert BadgeDoesNotExist();

        badges[_badgeId].description = _description;
        badges[_badgeId].imageURI = _imageURI;
        badges[_badgeId].points = _points;
        badges[_badgeId].active = _active;

        emit BadgeUpdated(_badgeId);
    }

    /**
     * @notice Add a new category
     */
    function addCategory(
        string calldata _category
    ) external onlyRole(BADGE_ADMIN_ROLE) {
        _addCategory(_category);
    }

    // ============ Badge Distribution ============

    /**
     * @notice Award a badge to an address
     */
    function awardBadge(
        address _to,
        uint256 _badgeId
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        _awardBadge(_to, _badgeId);
    }

    /**
     * @notice Award badges to multiple addresses
     */
    function awardBadgeBatch(
        address[] calldata _recipients,
        uint256 _badgeId
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        for (uint256 i = 0; i < _recipients.length; i++) {
            _awardBadge(_recipients[i], _badgeId);
        }
    }

    /**
     * @notice Award multiple badges to an address
     */
    function awardBadges(
        address _to,
        uint256[] calldata _badgeIds
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        for (uint256 i = 0; i < _badgeIds.length; i++) {
            _awardBadge(_to, _badgeIds[i]);
        }
    }

    /**
     * @notice Revoke a badge from an address
     */
    function revokeBadge(
        address _from,
        uint256 _badgeId
    ) external onlyRole(BADGE_ADMIN_ROLE) {
        if (!hasBadge[_from][_badgeId]) revert DoesNotHaveBadge();

        hasBadge[_from][_badgeId] = false;
        delete badgeEarnedAt[_from][_badgeId];
        
        _burn(_from, _badgeId, 1);

        emit BadgeRevoked(_from, _badgeId, block.timestamp);
    }

    // ============ View Functions ============

    function getBadge(uint256 _badgeId) external view returns (Badge memory) {
        return badges[_badgeId];
    }

    function getBadgesByCategory(
        string calldata _category
    ) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First pass: count matching badges
        for (uint256 i = 1; i <= totalBadges; i++) {
            if (keccak256(bytes(badges[i].category)) == keccak256(bytes(_category))) {
                count++;
            }
        }

        // Second pass: collect badge IDs
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalBadges; i++) {
            if (keccak256(bytes(badges[i].category)) == keccak256(bytes(_category))) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    function getUserBadges(
        address _user
    ) external view returns (uint256[] memory, uint256[] memory) {
        uint256 count = 0;
        
        // Count badges
        for (uint256 i = 1; i <= totalBadges; i++) {
            if (hasBadge[_user][i]) {
                count++;
            }
        }

        // Collect badges
        uint256[] memory badgeIds = new uint256[](count);
        uint256[] memory earnedTimes = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalBadges; i++) {
            if (hasBadge[_user][i]) {
                badgeIds[index] = i;
                earnedTimes[index] = badgeEarnedAt[_user][i];
                index++;
            }
        }

        return (badgeIds, earnedTimes);
    }

    function getUserPoints(address _user) external view returns (uint256) {
        uint256 points = 0;
        
        for (uint256 i = 1; i <= totalBadges; i++) {
            if (hasBadge[_user][i]) {
                points += badges[i].points;
            }
        }

        return points;
    }

    function getAllCategories() external view returns (string[] memory) {
        return categories;
    }

    function uri(uint256 _badgeId) public view override returns (string memory) {
        if (!_badgeExists(_badgeId)) revert BadgeDoesNotExist();
        return badges[_badgeId].imageURI;
    }

    // ============ Internal Functions ============

    function _awardBadge(address _to, uint256 _badgeId) internal {
        if (_to == address(0)) revert ZeroAddress();
        if (!_badgeExists(_badgeId)) revert BadgeDoesNotExist();
        if (!badges[_badgeId].active) revert BadgeNotActive();
        if (hasBadge[_to][_badgeId]) revert AlreadyHasBadge();
        
        Badge storage badge = badges[_badgeId];
        if (badge.maxSupply > 0 && totalSupply(_badgeId) >= badge.maxSupply) {
            revert MaxSupplyReached();
        }

        hasBadge[_to][_badgeId] = true;
        badgeEarnedAt[_to][_badgeId] = block.timestamp;
        
        _mint(_to, _badgeId, 1, "");

        emit BadgeAwarded(_to, _badgeId, block.timestamp);
    }

    function _addCategory(string memory _category) internal {
        if (!categoryExists[_category]) {
            categories.push(_category);
            categoryExists[_category] = true;
            emit CategoryAdded(_category);
        }
    }

    function _badgeExists(uint256 _badgeId) internal view returns (bool) {
        return _badgeId > 0 && _badgeId <= totalBadges;
    }

    // ============ Overrides ============

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        // Check transferability for each badge
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                if (!badges[ids[i]].transferable) {
                    revert BadgeNotTransferable();
                }
            }
        }
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
