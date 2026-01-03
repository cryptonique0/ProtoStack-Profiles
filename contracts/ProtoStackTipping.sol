// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ProtoStackTipping
 * @notice Handle tips (ETH/USDC) with optional creator fee splits
 * @dev Supports direct tips and split payments to multiple recipients
 */
contract ProtoStackTipping is Ownable, ReentrancyGuard {
    struct CreatorFeeConfig {
        address[] recipients;
        uint256[] percentages; // in basis points (10000 = 100%)
        bool isActive;
    }

    struct TipRecord {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string message;
    }

    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeePercentage = 250;
    address public platformFeeRecipient;

    // Mapping from creator address to their fee split config
    mapping(address => CreatorFeeConfig) public creatorFeeConfigs;

    // Mapping from creator address to total tips received
    mapping(address => uint256) public totalTipsReceived;

    // Mapping from tipper address to total tips sent
    mapping(address => uint256) public totalTipsSent;

    // All tip records
    TipRecord[] public tipRecords;

    // Events
    event TipSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        string message
    );
    event FeeSplitConfigured(
        address indexed creator,
        address[] recipients,
        uint256[] percentages
    );
    event PlatformFeeUpdated(uint256 newPercentage);
    event PlatformFeeRecipientUpdated(address newRecipient);

    constructor(address _platformFeeRecipient) {
        platformFeeRecipient = _platformFeeRecipient;
    }

    /**
     * @notice Send a tip to a creator
     * @param to Address of the creator receiving the tip
     * @param message Optional message with the tip
     */
    function sendTip(
        address to,
        string calldata message
    ) external payable nonReentrant {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot tip yourself");

        uint256 tipAmount = msg.value;

        // Calculate platform fee
        uint256 platformFee = (tipAmount * platformFeePercentage) / 10000;
        uint256 amountAfterPlatformFee = tipAmount - platformFee;

        // Transfer platform fee
        if (platformFee > 0 && platformFeeRecipient != address(0)) {
            (bool platformSuccess, ) = platformFeeRecipient.call{
                value: platformFee
            }("");
            require(platformSuccess, "Platform fee transfer failed");
        }

        // Check if creator has fee split configured
        CreatorFeeConfig storage feeConfig = creatorFeeConfigs[to];

        if (feeConfig.isActive && feeConfig.recipients.length > 0) {
            // Split payment according to configuration
            _splitPayment(to, amountAfterPlatformFee, feeConfig);
        } else {
            // Direct payment to creator
            (bool success, ) = to.call{value: amountAfterPlatformFee}("");
            require(success, "Tip transfer failed");
        }

        // Record tip
        totalTipsReceived[to] += tipAmount;
        totalTipsSent[msg.sender] += tipAmount;

        tipRecords.push(
            TipRecord({
                from: msg.sender,
                to: to,
                amount: tipAmount,
                timestamp: block.timestamp,
                message: message
            })
        );

        emit TipSent(msg.sender, to, tipAmount, message);
    }

    /**
     * @notice Configure fee split for a creator
     * @param recipients Array of recipient addresses
     * @param percentages Array of percentages (in basis points, must sum to 10000)
     */
    function configureFeeSplit(
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external {
        require(
            recipients.length == percentages.length,
            "Arrays length mismatch"
        );
        require(
            recipients.length > 0 && recipients.length <= 10,
            "Invalid number of recipients"
        );

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(percentages[i] > 0, "Percentage must be greater than 0");
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 10000, "Percentages must sum to 100%");

        CreatorFeeConfig storage config = creatorFeeConfigs[msg.sender];
        config.recipients = recipients;
        config.percentages = percentages;
        config.isActive = true;

        emit FeeSplitConfigured(msg.sender, recipients, percentages);
    }

    /**
     * @notice Disable fee split configuration
     */
    function disableFeeSplit() external {
        creatorFeeConfigs[msg.sender].isActive = false;
    }

    /**
     * @notice Get creator's fee split configuration
     * @param creator Address of the creator
     * @return recipients Array of recipient addresses
     * @return percentages Array of percentages
     * @return isActive Whether the config is active
     */
    function getFeeSplitConfig(
        address creator
    )
        external
        view
        returns (
            address[] memory recipients,
            uint256[] memory percentages,
            bool isActive
        )
    {
        CreatorFeeConfig memory config = creatorFeeConfigs[creator];
        return (config.recipients, config.percentages, config.isActive);
    }

    /**
     * @notice Get tip records for a creator
     * @param creator Address of the creator
     * @param limit Maximum number of records to return
     * @return Array of tip records
     */
    function getTipsReceived(
        address creator,
        uint256 limit
    ) external view returns (TipRecord[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < tipRecords.length; i++) {
            if (tipRecords[i].to == creator) {
                count++;
            }
        }

        uint256 resultCount = count > limit ? limit : count;
        TipRecord[] memory result = new TipRecord[](resultCount);

        uint256 resultIndex = 0;
        for (
            uint256 i = tipRecords.length;
            i > 0 && resultIndex < resultCount;
            i--
        ) {
            if (tipRecords[i - 1].to == creator) {
                result[resultIndex] = tipRecords[i - 1];
                resultIndex++;
            }
        }

        return result;
    }

    /**
     * @notice Get tip records sent by a tipper
     * @param tipper Address of the tipper
     * @param limit Maximum number of records to return
     * @return Array of tip records
     */
    function getTipsSent(
        address tipper,
        uint256 limit
    ) external view returns (TipRecord[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < tipRecords.length; i++) {
            if (tipRecords[i].from == tipper) {
                count++;
            }
        }

        uint256 resultCount = count > limit ? limit : count;
        TipRecord[] memory result = new TipRecord[](resultCount);

        uint256 resultIndex = 0;
        for (
            uint256 i = tipRecords.length;
            i > 0 && resultIndex < resultCount;
            i--
        ) {
            if (tipRecords[i - 1].from == tipper) {
                result[resultIndex] = tipRecords[i - 1];
                resultIndex++;
            }
        }

        return result;
    }

    /**
     * @notice Get total number of tip records
     */
    function getTipRecordsCount() external view returns (uint256) {
        return tipRecords.length;
    }

    // Admin functions

    /**
     * @notice Update platform fee percentage (only owner)
     * @param newPercentage New percentage in basis points
     */
    function setPlatformFeePercentage(
        uint256 newPercentage
    ) external onlyOwner {
        require(newPercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newPercentage;
        emit PlatformFeeUpdated(newPercentage);
    }

    /**
     * @notice Update platform fee recipient (only owner)
     * @param newRecipient New recipient address
     */
    function setPlatformFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        platformFeeRecipient = newRecipient;
        emit PlatformFeeRecipientUpdated(newRecipient);
    }

    // Internal functions

    function _splitPayment(
        address creator,
        uint256 amount,
        CreatorFeeConfig storage config
    ) internal {
        for (uint256 i = 0; i < config.recipients.length; i++) {
            uint256 share = (amount * config.percentages[i]) / 10000;
            (bool success, ) = config.recipients[i].call{value: share}("");
            require(success, "Split payment failed");
        }
    }
}
