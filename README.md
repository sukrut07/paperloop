# Paperloop

Paperloop is a full-stack web-native platform for educational paper recycling. Institutions create shipment rooms, recyclers manage pickup and recycling milestones, and NGOs track notebook delivery and distribution.

## Room-Based Workflow

1. **Institution flow**
   - Create a shipment room with a 6-digit invite code.
   - Add room batches, invite members, and connect a recycler.
   - Upload proofs directly into the room documents tab.

2. **Recycler flow**
   - Review incoming room requests.
   - Accept terms, enter the room, and move the shipment through pickup, plant intake, recycling, and notebook production.
   - Attach proofs to major milestones when needed.

3. **NGO flow**
   - Receive notebook deliveries inside the room workflow.
   - Update receipt, distribution start, and final delivery.
   - Keep final distribution proofs and impact history together.

## What Lives Where

- **MongoDB:** users, rooms, batches, tracking logs, impact reports
- **Firebase Auth:** Google login, email/password login, session identity
- **Google Maps:** recycler matching by pickup location
- **Web-native proof storage:** proof URLs, proof filenames, verification records

## Project Structure

```text
frontend/      Next.js app, dashboards, rooms, tracking, Google login UI
backend/       Express API, MongoDB models, Firebase middleware
```

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Important API routes:

```text
POST /batch/proof-upload
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
- **Auth:** Firebase web config in frontend and Firebase service account in backend
- **Optional notifications:** hook a mail provider into the backend if you want live outbound email delivery instead of the built-in app notification queue

## Implementation Flow

1. Institution admin creates a room and shares the 6-digit code.
2. Institution creates batches inside that room.
3. Recycler is matched and connected to the room.
4. Room tracking updates as the shipment moves through pickup, recycling, and NGO delivery.
5. Proofs stay attached to the room documents tab with system verification metadata.
6. Analytics aggregates operational and impact metrics from completed workflows.
