
# Infinity Quiz Live

QR Based Real-Time Quiz System

## Backend Setup
cd server
npm install
npm run dev

For MongoDB Atlas, copy the complete URI from Atlas **Connect > Drivers** into `server/.env`, set the database user's password, and confirm that your current IP is allowed in Atlas Network Access. Do not manually guess the cluster hostname. When the URI is valid, the backend uses Atlas automatically; while the placeholder remains, it uses the local SQLite database.

## Frontend Setup
cd client
npm install
npm start

## Features
- User Registration
- Unique ID Generation
- QR Code Generation
- SQLite Database
- MongoDB Atlas support with SQLite fallback
- Socket.IO Support
