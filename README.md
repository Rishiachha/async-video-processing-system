Video Forge — Async Video Processing System

A high-performance, asynchronous video transcoding platform with a futuristic aurora-themed interface. Upload cinematic content and monitor the "forging" progress in real-time.


📋 Table of Contents

Architecture Overview

Prerequisites

Project Structure

Database Setup

Environment Variables

Installation & Startup

API Reference

Processing Pipeline

UI Components

Troubleshooting


Architecture Overview
Video Forge uses a three-tier decoupled architecture — the frontend, API server, and background worker run as completely independent processes.
This ensures no single component blocks another.





┌─────────────────┐              ┌──────────────────┐                ┌──────────────────┐

│   React Client  │    ─upload─▶ │  Express API     │     ─insert─▶ │   PostgreSQL DB  │

│   (Port 5173)   │    ◀─poll─── │  (Port 4000)     │     ◀─update─ │  video_forge     │

└─────────────────┘               └──────────────────┘                └────────┬─────────┘
                                                                 
                                                                                │ poll every 5s
           
                                                                       ┌────────▼─────────┐
                                                            
                                                                       │  FFmpeg Worker   │
                                                             
                                                                       │  (processor.js)  │

                                                                        └──────────────────┘





Why decoupled?

The API responds immediately after queuing — no waiting for FFmpeg to finish

The worker can be scaled horizontally or restarted independently

The frontend's 3-second poll interval is intentionally shorter than the worker's 5-second cycle to catch state transitions quickly


Prerequisites

Ensure the following are installed before proceeding:

DependencyMinimum VersionInstallNode.jsv18+nodejs.orgPostgreSQLv14+postgresql.orgFFmpegv5+See below

FFmpeg Installation:

bash# macOS

brew install ffmpeg

# Ubuntu / Debian

sudo apt update && sudo apt install ffmpeg

# Windows (via Chocolatey)

choco install ffmpeg

# Verify installation

ffmpeg -version

Project Structure

video-forge/

├── frontend/

│   ├── src/

│   │   ├── App.jsx          # Core upload UI + Processing Timeline

│   │   ├── api.js           # Axios base config → http://localhost:4000

│   │   └── index.css        # Glassmorphism theme, aurora gradients, noise filters

│   ├── package.json         # React 19, Vite, Axios

│   └── vite.config.js

│

└── backend/
    
    ├── api/
    
    │   ├── upload.js        # POST /upload — Multer + UUID + DB task creation
    
    │   └── tasks.js         # GET /tasks/:id — status polling endpoint
    
    ├── server_2.js          # Express app + GET /download endpoint
    
    ├── processor.js         # Background worker — FFmpeg transcoding engine

    └── db.js                # PostgreSQL connection pool (pg)

Database Setup

1. Create the database

sqlCREATE DATABASE video_forge;

2. Run the schema

Connect to video_forge and execute:


sqlCREATE TABLE tasks (

  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  original    TEXT NOT NULL,          -- path to raw uploaded file
  
  output      TEXT,                   -- path to transcoded output file
  
  variant     TEXT DEFAULT '480p',    -- target resolution label
  
  status      TEXT DEFAULT 'QUEUED',  -- QUEUED | PROCESSING | COMPLETED | FAILED
  
  error       TEXT,                   -- FFmpeg stderr on failure
  
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  updated_at  TIMESTAMPTZ DEFAULT NOW()

);

Task Status Flow


QUEUED ──▶ PROCESSING ──▶ COMPLETED
                    └────▶ FAILED

StatusEnergyBar %DescriptionQUEUED30%File saved, awaiting worker pickupPROCESSING65%FFmpeg actively transcodingCOMPLETED100%Output file ready for downloadFAILED0% (red)FFmpeg error — check error column


Environment Variables

Create a .env file inside backend/:

env# PostgreSQL Connection

DB_HOST=localhost

DB_PORT=5432

DB_NAME=video_forge

DB_USER=your_pg_username

DB_PASSWORD=your_pg_password

# Server

PORT=4000

# File Storage

UPLOAD_DIR=./uploads

OUTPUT_DIR=./outputs

Update backend/db.js to read from process.env if not already configured:


jsconst pool = new Pool({
  
  host:     process.env.DB_HOST,
  
  port:     process.env.DB_PORT,
  
  database: process.env.DB_NAME,
  
  user:     process.env.DB_USER,

  password: process.env.DB_PASSWORD,

});

Installation & Startup

⚠️ Order matters. Start components in the sequence below.



Step 1 — Backend API

bashcd backend


npm install

node server_2.js

# ✅ API running on http://localhost:4000

Step 2 — Background Worker

bash# In a new terminal (keep the API running)

node backend/processor.js

# ✅ Worker polling for QUEUED tasks every 5 seconds

Step 3 — Frontend

bashcd frontend

npm install

npm run dev


# ✅ UI available at http://localhost:5173

a

API Reference

POST /upload

Upload a raw video file for processing.

Request — multipart/form-data

FieldTypeDescriptionvideoFileThe video file to transcode

Response — 201 Created

json{
  
  "taskId": "a3f8c2d1-...",
  
  "status": "QUEUED",

  "message": "Video queued for processing"

}

GET /tasks/:taskId

Poll the current status of a processing task.

Response — 200 OK

json{
  
  "id": "a3f8c2d1-...",
  
  "status": "PROCESSING",
  
  "variant": "480p",
  
  "output": null,

  "error": null,

  "created_at": "2025-01-15T10:30:00Z"

}

GET /download/:taskId

Download the completed transcoded video. Only available when status === "COMPLETED".

Response — Binary video stream (video/mp4)

Processing Pipeline

When processor.js picks up a QUEUED task, it runs the following FFmpeg command for the default 480p MP4 variant:

bashffmpeg -i <input_path> \
  
  -vf scale=-2:480 \
  
  -c:v libx264 \

  -preset fast \


  -crf 23 \
  
  -c:a aac \

  <output_path>

Parameter rationale:


scale=-2:480 — maintains aspect ratio while targeting 480p height

preset fast — balances encoding speed vs. file size

crf 23 — visually lossless quality threshold (lower = larger file)

To add more variants (e.g., 720p, 1080p), extend the variant logic in processor.js and insert additional task rows per variant on upload.


UI Components

EnergyBar

Animated progress indicator tied to task status:

QUEUED      ████░░░░░░░░░░░░  30%  (pulsing amber)

PROCESSING  ████████░░░░░░░░  65%  (animated neon blue)

COMPLETED   ████████████████ 100%  (static green)

FAILED      ░░░░░░░░░░░░░░░░   0%  (static red)

Processing Timeline

The timeline renders one card per task, auto-refreshing every 3 seconds via setInterval. Once status reaches COMPLETED, a download button appears linked to /download/:taskId.


Troubleshooting

ECONNREFUSED on API calls

The backend isn't running. Start node server_2.js first and confirm port 4000 is free:

bashlsof -i :4000

FFmpeg not found in worker logs

FFmpeg isn't in your system PATH. Verify with ffmpeg -version and re-install if needed.

Tasks stuck in QUEUED

The worker (processor.js) isn't running. It must be started as a separate process — the API does not auto-start it.

PostgreSQL authentication failed

Double-check credentials in your .env and ensure the video_forge database exists:

bashpsql -U your_user -d video_forge -c "\dt"

Port 5173 already in use

Vite will auto-select the next available port. Check terminal output for the actual URL.
