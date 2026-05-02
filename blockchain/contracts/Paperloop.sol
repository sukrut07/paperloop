// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Paperloop {
    enum Status { 
        Created,      // 0
        Accepted,     // 1
        PickedUp,     // 2
        InTransit,    // 3
        Received,     // 4
        Recycled,     // 5
        SentToNGO,    // 6
        Delivered     // 7
    }

    struct Batch {
        uint256 batchId;
        address institutionWallet;
        address recyclerWallet;
        address ngoWallet;
        uint256 weight;
        string ipfsHash;
        Status status;
        uint256 createdAt;
    }

    uint256 private _nextBatchId;
    mapping(uint256 => Batch) public batches;

    event BatchCreated(uint256 indexed batchId, address indexed institution, uint256 weight);
    event BatchAccepted(uint256 indexed batchId, address indexed recycler);
    event PickupDone(uint256 indexed batchId);
    event BatchReceived(uint256 indexed batchId);
    event BatchRecycled(uint256 indexed batchId);
    event BatchDonated(uint256 indexed batchId, address indexed ngo);
    event BatchDelivered(uint256 indexed batchId);

    modifier onlyInstitution(uint256 batchId) {
        require(batches[batchId].institutionWallet == msg.sender, "Only institution can call this");
        _;
    }

    modifier onlyRecycler(uint256 batchId) {
        require(batches[batchId].recyclerWallet == msg.sender, "Only assigned recycler can call this");
        _;
    }

    modifier onlyNGO(uint256 batchId) {
        require(batches[batchId].ngoWallet == msg.sender, "Only assigned NGO can call this");
        _;
    }

    function createBatch(uint256 weight, string memory ipfsHash) external returns (uint256) {
        uint256 batchId = _nextBatchId++;
        batches[batchId] = Batch({
            batchId: batchId,
            institutionWallet: msg.sender,
            recyclerWallet: address(0),
            ngoWallet: address(0),
            weight: weight,
            ipfsHash: ipfsHash,
            status: Status.Created,
            createdAt: block.timestamp
        });

        emit BatchCreated(batchId, msg.sender, weight);
        return batchId;
    }

    function acceptBatch(uint256 batchId) external {
        require(batches[batchId].status == Status.Created, "Batch not in Created status");
        batches[batchId].recyclerWallet = msg.sender;
        batches[batchId].status = Status.Accepted;

        emit BatchAccepted(batchId, msg.sender);
    }

    function pickupBatch(uint256 batchId) external onlyRecycler(batchId) {
        require(batches[batchId].status == Status.Accepted, "Batch not Accepted");
        batches[batchId].status = Status.PickedUp;

        emit PickupDone(batchId);
    }

    function confirmReceived(uint256 batchId) external onlyRecycler(batchId) {
        require(batches[batchId].status == Status.PickedUp, "Batch not PickedUp");
        batches[batchId].status = Status.Received;

        emit BatchReceived(batchId);
    }

    function markRecycled(uint256 batchId) external onlyRecycler(batchId) {
        require(batches[batchId].status == Status.Received, "Batch not Received");
        batches[batchId].status = Status.Recycled;

        emit BatchRecycled(batchId);
    }

    function acceptDonation(uint256 batchId) external {
        require(batches[batchId].status == Status.Recycled, "Batch not Recycled");
        batches[batchId].ngoWallet = msg.sender;
        batches[batchId].status = Status.SentToNGO;

        emit BatchDonated(batchId, msg.sender);
    }

    function confirmDistribution(uint256 batchId) external onlyNGO(batchId) {
        require(batches[batchId].status == Status.SentToNGO, "Batch not SentToNGO");
        batches[batchId].status = Status.Delivered;

        emit BatchDelivered(batchId);
    }

    function getBatch(uint256 batchId) external view returns (Batch memory) {
        return batches[batchId];
    }
}
