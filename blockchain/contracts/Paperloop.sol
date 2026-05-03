// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Paperloop {
    enum Status {
        Created,
        Accepted,
        PickedUp,
        InTransit,
        Received,
        Recycled,
        SentToNGO,
        Delivered
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

    uint256 private _nextBatchId = 1;
    mapping(uint256 => Batch) public batches;

    event BatchCreated(uint256 indexed batchId, address indexed institutionWallet, uint256 weight, string ipfsHash);
    event BatchAccepted(uint256 indexed batchId, address indexed recyclerWallet);
    event PickupDone(uint256 indexed batchId, address indexed recyclerWallet);
    event BatchReceived(uint256 indexed batchId, address indexed recyclerWallet);
    event BatchRecycled(uint256 indexed batchId, address indexed recyclerWallet);
    event DonationAccepted(uint256 indexed batchId, address indexed ngoWallet);
    event BatchDelivered(uint256 indexed batchId, address indexed ngoWallet);

    modifier batchExists(uint256 batchId) {
        require(batches[batchId].batchId != 0, "Batch does not exist");
        _;
    }

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
        require(weight > 0, "Weight must be greater than zero");
        require(bytes(ipfsHash).length > 0, "IPFS hash is required");

        uint256 batchId = _nextBatchId;
        _nextBatchId += 1;

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

        emit BatchCreated(batchId, msg.sender, weight, ipfsHash);
        return batchId;
    }

    function acceptBatch(uint256 batchId) external batchExists(batchId) {
        require(batches[batchId].status == Status.Created, "Batch not in Created status");
        batches[batchId].recyclerWallet = msg.sender;
        batches[batchId].status = Status.Accepted;

        emit BatchAccepted(batchId, msg.sender);
    }

    function pickupBatch(uint256 batchId) external batchExists(batchId) onlyRecycler(batchId) {
        require(batches[batchId].status == Status.Accepted, "Batch not Accepted");
        batches[batchId].status = Status.PickedUp;

        emit PickupDone(batchId, msg.sender);
    }

    function markInTransit(uint256 batchId) external batchExists(batchId) onlyRecycler(batchId) {
        require(batches[batchId].status == Status.PickedUp, "Batch not PickedUp");
        batches[batchId].status = Status.InTransit;
    }

    function confirmReceived(uint256 batchId) external batchExists(batchId) onlyRecycler(batchId) {
        require(
            batches[batchId].status == Status.PickedUp || batches[batchId].status == Status.InTransit,
            "Batch not picked up or in transit"
        );
        batches[batchId].status = Status.Received;

        emit BatchReceived(batchId, msg.sender);
    }

    function markRecycled(uint256 batchId) external batchExists(batchId) onlyRecycler(batchId) {
        require(batches[batchId].status == Status.Received, "Batch not Received");
        batches[batchId].status = Status.Recycled;

        emit BatchRecycled(batchId, msg.sender);
    }

    function acceptDonation(uint256 batchId) external batchExists(batchId) {
        require(batches[batchId].status == Status.Recycled, "Batch not Recycled");
        batches[batchId].ngoWallet = msg.sender;
        batches[batchId].status = Status.SentToNGO;

        emit DonationAccepted(batchId, msg.sender);
    }

    function confirmDistribution(uint256 batchId) external batchExists(batchId) onlyNGO(batchId) {
        require(batches[batchId].status == Status.SentToNGO, "Batch not SentToNGO");
        batches[batchId].status = Status.Delivered;

        emit BatchDelivered(batchId, msg.sender);
    }

    function getBatch(uint256 batchId) external view batchExists(batchId) returns (Batch memory) {
        return batches[batchId];
    }
}
