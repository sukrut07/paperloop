# Paperloop - Blockchain Paper Recycling Ecosystem

Paperloop is a full-stack platform designed to facilitate educational paper recycling. It connects Institutions, Recyclers, and NGOs on the Polygon blockchain to create a sustainable cycle of educational resources.

## Features

- **Institution Dashboard**: Create rooms, generate paper batches, and track recycling impact.
- **Recycler Dashboard**: View nearby pickup requests, manage batch processing, and update status on-chain.
- **NGO Dashboard**: Accept recycled notebook stock and confirm distribution to students.
- **Real-time Tracking**: Amazon-style progress tracker for every batch.
- **Blockchain Verified**: All state transitions and proof-of-recycling are stored on Polygon Amoy.
- **IPFS Storage**: Batch proofs and metadata are stored on Pinata.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Ethers.js
- **Backend**: Node.js, Express, MongoDB, Firebase Admin
- **Blockchain**: Solidity, Hardhat, Polygon Amoy
- **Auth**: Firebase Authentication
- **Storage**: IPFS (Pinata)

## Setup Instructions

### 1. Blockchain
1. Navigate to `/blockchain`.
2. Create a `.env` file:
   ```env
   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
   PRIVATE_KEY=your_wallet_private_key
   ```
3. Deploy contract:
   ```bash
   npx hardhat run scripts/deploy.js --network amoy
   ```

### 2. Backend
1. Navigate to `/backend`.
2. Create a `.env` file:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_atlas_uri
   PINATA_API_KEY=your_pinata_key
   PINATA_SECRET_API_KEY=your_pinata_secret
   FIREBASE_SERVICE_ACCOUNT=path_to_json
   ```
3. Start server:
   ```bash
   npm run dev
   ```

### 3. Frontend
1. Navigate to `/frontend`.
2. Create a `.env.local` file with Firebase and Google Maps keys.
3. Start dev server:
   ```bash
   npm run dev
   ```

## Design Principles
The UI follows a **Neo-brutalist** aesthetic:
- Thick black borders (4px)
- Aggressive box shadows
- Vibrant, high-contrast colors
- Uppercase typography for emphasis

## Architecture
- **Immutable Layer**: Ownership, Status, IPFS Hashes (Polygon)
- **Mutable Layer**: User Profiles, Room Codes, Notifications (MongoDB)
- **Identity Layer**: Email/Password and Wallet mapping (Firebase + MetaMask)
