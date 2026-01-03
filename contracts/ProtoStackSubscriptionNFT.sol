// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProtoStackSubscriptionNFT
 * @notice Subscription NFTs for paid follows - allows creators to monetize their profile
 * @dev ERC721 with expiration dates and automatic renewal
 */
contract ProtoStackSubscriptionNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    struct Subscription {
        address creator;
        address subscriber;
        uint256 pricePerMonth; // in wei
        uint256 expiresAt;
        bool isActive;
        uint256 createdAt;
    }

    struct CreatorConfig {
        uint256 subscriptionPrice; // monthly price in wei
        bool isAcceptingSubscribers;
        uint256 totalSubscribers;
        uint256 totalEarned;
    }

    // Mapping from token ID to subscription details
    mapping(uint256 => Subscription) public subscriptions;

    // Mapping from creator address to their config
    mapping(address => CreatorConfig) public creatorConfigs;

    // Mapping from subscriber => creator => tokenId
    mapping(address => mapping(address => uint256)) public subscriberToCreator;

    // Events
    event SubscriptionCreated(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed subscriber,
        uint256 expiresAt
    );
    event SubscriptionRenewed(uint256 indexed tokenId, uint256 newExpiresAt);
    event SubscriptionCancelled(uint256 indexed tokenId);
    event CreatorConfigUpdated(
        address indexed creator,
        uint256 newPrice,
        bool accepting
    );
    event PaymentReceived(
        address indexed creator,
        address indexed subscriber,
        uint256 amount
    );

    constructor() ERC721("ProtoStack Subscription", "PSUB") {}

    /**
     * @notice Set creator's subscription configuration
     * @param pricePerMonth Monthly subscription price in wei
     * @param isAccepting Whether to accept new subscribers
     */
    function setCreatorConfig(
        uint256 pricePerMonth,
        bool isAccepting
    ) external {
        creatorConfigs[msg.sender].subscriptionPrice = pricePerMonth;
        creatorConfigs[msg.sender].isAcceptingSubscribers = isAccepting;

        emit CreatorConfigUpdated(msg.sender, pricePerMonth, isAccepting);
    }

    /**
     * @notice Subscribe to a creator (mint subscription NFT)
     * @param creator Address of the creator to subscribe to
     * @param durationMonths Number of months to subscribe for
     */
    function subscribe(
        address creator,
        uint256 durationMonths
    ) external payable {
        require(
            durationMonths > 0 && durationMonths <= 12,
            "Duration must be 1-12 months"
        );

        CreatorConfig storage config = creatorConfigs[creator];
        require(
            config.isAcceptingSubscribers,
            "Creator not accepting subscribers"
        );
        require(config.subscriptionPrice > 0, "Creator has not set price");

        uint256 totalPrice = config.subscriptionPrice * durationMonths;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Check if subscriber already has an active subscription
        uint256 existingTokenId = subscriberToCreator[msg.sender][creator];
        if (existingTokenId > 0 && subscriptions[existingTokenId].isActive) {
            // Extend existing subscription
            _renewSubscription(existingTokenId, durationMonths);
        } else {
            // Create new subscription
            _createSubscription(creator, durationMonths);
        }

        // Transfer payment to creator
        (bool success, ) = creator.call{value: totalPrice}("");
        require(success, "Payment transfer failed");

        // Update creator stats
        config.totalSubscribers += 1;
        config.totalEarned += totalPrice;

        emit PaymentReceived(creator, msg.sender, totalPrice);

        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = msg.sender.call{
                value: msg.value - totalPrice
            }("");
            require(refundSuccess, "Refund failed");
        }
    }

    /**
     * @notice Renew an existing subscription
     * @param tokenId ID of the subscription token
     * @param additionalMonths Number of months to extend
     */
    function renewSubscription(
        uint256 tokenId,
        uint256 additionalMonths
    ) external payable {
        require(_exists(tokenId), "Token does not exist");
        require(
            additionalMonths > 0 && additionalMonths <= 12,
            "Duration must be 1-12 months"
        );

        Subscription storage sub = subscriptions[tokenId];
        require(ownerOf(tokenId) == msg.sender, "Not the owner");

        CreatorConfig storage config = creatorConfigs[sub.creator];
        uint256 totalPrice = config.subscriptionPrice * additionalMonths;
        require(msg.value >= totalPrice, "Insufficient payment");

        _renewSubscription(tokenId, additionalMonths);

        // Transfer payment to creator
        (bool success, ) = sub.creator.call{value: totalPrice}("");
        require(success, "Payment transfer failed");

        config.totalEarned += totalPrice;

        emit PaymentReceived(sub.creator, msg.sender, totalPrice);

        // Refund excess
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = msg.sender.call{
                value: msg.value - totalPrice
            }("");
            require(refundSuccess, "Refund failed");
        }
    }

    /**
     * @notice Cancel subscription (mark as inactive, token remains but non-functional)
     * @param tokenId ID of the subscription token
     */
    function cancelSubscription(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner");

        subscriptions[tokenId].isActive = false;

        emit SubscriptionCancelled(tokenId);
    }

    /**
     * @notice Check if a subscription is currently active
     * @param tokenId ID of the subscription token
     * @return bool Whether the subscription is active and not expired
     */
    function isSubscriptionActive(
        uint256 tokenId
    ) external view returns (bool) {
        if (!_exists(tokenId)) return false;

        Subscription memory sub = subscriptions[tokenId];
        return sub.isActive && block.timestamp < sub.expiresAt;
    }

    /**
     * @notice Check if a subscriber has an active subscription to a creator
     * @param subscriber Address of the subscriber
     * @param creator Address of the creator
     * @return bool Whether the subscriber has an active subscription
     */
    function hasActiveSubscription(
        address subscriber,
        address creator
    ) external view returns (bool) {
        uint256 tokenId = subscriberToCreator[subscriber][creator];
        if (tokenId == 0) return false;

        Subscription memory sub = subscriptions[tokenId];
        return sub.isActive && block.timestamp < sub.expiresAt;
    }

    /**
     * @notice Get subscription details
     * @param tokenId ID of the subscription token
     * @return Subscription struct with all details
     */
    function getSubscription(
        uint256 tokenId
    ) external view returns (Subscription memory) {
        require(_exists(tokenId), "Token does not exist");
        return subscriptions[tokenId];
    }

    /**
     * @notice Get creator configuration
     * @param creator Address of the creator
     * @return CreatorConfig struct with all details
     */
    function getCreatorConfig(
        address creator
    ) external view returns (CreatorConfig memory) {
        return creatorConfigs[creator];
    }

    // Internal functions

    function _createSubscription(
        address creator,
        uint256 durationMonths
    ) internal {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        uint256 expiresAt = block.timestamp + (durationMonths * 30 days);

        subscriptions[newTokenId] = Subscription({
            creator: creator,
            subscriber: msg.sender,
            pricePerMonth: creatorConfigs[creator].subscriptionPrice,
            expiresAt: expiresAt,
            isActive: true,
            createdAt: block.timestamp
        });

        subscriberToCreator[msg.sender][creator] = newTokenId;

        _safeMint(msg.sender, newTokenId);

        emit SubscriptionCreated(newTokenId, creator, msg.sender, expiresAt);
    }

    function _renewSubscription(
        uint256 tokenId,
        uint256 additionalMonths
    ) internal {
        Subscription storage sub = subscriptions[tokenId];

        // If expired, renew from now, otherwise extend existing expiration
        if (block.timestamp > sub.expiresAt) {
            sub.expiresAt = block.timestamp + (additionalMonths * 30 days);
        } else {
            sub.expiresAt += (additionalMonths * 30 days);
        }

        sub.isActive = true;

        emit SubscriptionRenewed(tokenId, sub.expiresAt);
    }

    // Override transfer functions to update mappings
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._transfer(from, to, tokenId);

        Subscription storage sub = subscriptions[tokenId];
        sub.subscriber = to;
        subscriberToCreator[to][sub.creator] = tokenId;
        delete subscriberToCreator[from][sub.creator];
    }
}
