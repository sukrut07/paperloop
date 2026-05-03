# Paperloop

Paperloop is a full-stack blockchain platform for educational paper recycling. Institutions donate unused assignment sheets, files, and paper waste; recyclers collect and convert it into notebooks/books; NGOs distribute the finished stock to underprivileged students.

## Three-Layer Blockchain Workflow

1. **Institution Layer**
   - Teachers and institution admins create 6-digit rooms.
   - Institutions create paper batches with weight, proof images, location, and room code.
   - Proof metadata is pinned to IPFS through Pinata.
   - The IPFS hash and ownership are written to Polygon Amoy through `Paperloop.sol`.

2. **Recycling Layer**
   - Recyclers view available batches and nearby pickup locations.
   - Recycler wallet accepts the batch on-chain.
   - Pickup, received, and recycled milestones are recorded in MongoDB and Polygon.

3. **NGO Layer**
   - NGOs view recycled notebook stock.
   - NGO wallet accepts donation stock.
   - Final distribution is confirmed on-chain and included in impact analytics.

## What Lives Where

- **MongoDB:** profiles, rooms, analytics, mutable batch metadata, tracking logs, impact reports.
- **Polygon Amoy:** immutable batch ownership, proof hash, status transitions, delivery verification.
- **IPFS/Pinata:** paper proof metadata and uploaded proof image payloads.
- **Firebase Auth:** user identity and session tokens.
- **MetaMask/Ethers.js:** wallet connection and contract writes from the browser.
- **Google Maps:** recycler pickup context and location links.

## Project Structure

```text
frontend/      Next.js app, dashboards, tracking, wallet hooks, contract ABI
backend/       Express API, MongoDB models, Firebase middleware, Pinata service
blockchain/    Solidity contract, Hardhat config, Polygon Amoy deploy script
```

## Local Setup

### Blockchain

```bash
cd blockchain
cp .env.example .env
npm install
npm run compile
npm run deploy:amoy
```

Copy the deployed contract address into:

- `backend/.env` as `PAPERLOOP_CONTRACT_ADDRESS`
- `frontend/.env.local` as `NEXT_PUBLIC_PAPERLOOP_CONTRACT_ADDRESS`

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Important API routes:

```text
POST /batch/ipfs
POST /batch/create
GET  /batch/:id
GET  /batch/available
GET  /batch/recycled
POST /batch/accept
POST /batch/pickup
POST /batch/receive
POST /batch/recycle
POST /batch/distribute
GET  /tracking/:batchId
POST /room/create
POST /room/join
GET  /batch/analytics/summary
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Deployment

- **Frontend:** Vercel using `frontend/vercel.json`
- **Backend:** Render using `backend/render.yaml`
- **Database:** MongoDB Atlas connection string in `MONGODB_URI`
- **Blockchain:** Polygon Amoy RPC and deployed `Paperloop.sol`
- **Storage:** Pinata API key and secret in backend environment variables
- **Auth:** Firebase web config in frontend and Firebase service account in backend

## Implementation Flow

1. Institution admin creates a room and shares the 6-digit code with teachers.
2. Teacher/admin creates a paper batch from `/batch/create`.
3. Frontend sends proof metadata to `POST /batch/ipfs`.
4. Backend pins metadata to Pinata and returns `ipfsHash`.
5. Frontend calls `createBatch(weight, ipfsHash)` through MetaMask.
6. Frontend sends the final `batchId`, `ipfsHash`, and `txHash` to `POST /batch/create`.
7. Recycler accepts and updates pickup lifecycle from the recycler dashboard.
8. NGO accepts recycled stock and confirms final delivery.
9. Tracking page shows the Amazon/Flipkart-style progress bar and timeline logs.
10. Analytics page aggregates operational and impact metrics.
