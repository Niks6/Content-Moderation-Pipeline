# Content Moderation Pipeline

Content Moderation Pipeline is a three-stage pre-upload moderation pipeline for social media videos.

## Features

- Three-stage content scanning:
  - Stage 1: OCR text detection with EasyOCR + multilingual risk scoring
  - Stage 2: Audio transcription with Whisper + NLP classification
  - Stage 3: Visual sensitivity and deepfake analysis with EfficientNet-B4
- FastAPI backend with REST + WebSocket progress updates
- React + TypeScript + Tailwind moderation dashboard
- Demo mode for UI testing without heavy model inference
- Review queue endpoint for human moderation workflow

## Project Structure

```text
content-moderation-pipeline/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── types/
│   │   ├── api/
│   │   └── App.tsx
├── backend/
│   ├── main.py
│   ├── pipeline/
│   ├── models/
│   └── utils/
└── .env.example
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- ffmpeg installed and available in PATH
- GPU optional (CPU mode supported)

## Backend Setup

1. Create environment and install dependencies:

```powershell
cd backend
python -m venv .venv
.\.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

2. Copy env file and update values:

```powershell
cd ..
Copy-Item .env.example .env
```

3. Run API server:

```powershell
cd backend
& ".\.\.venv\Scripts\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

1. Install dependencies:

```powershell
cd frontend
npm install
```

2. Run dev server:

```powershell
npx vite --host 0.0.0.0 --port 5173
```

Frontend runs on `http://localhost:5173` by default.

## API Documentation

### `GET /api/health`
Returns service status:

```json
{ "status": "ok", "models_loaded": true }
```

### `POST /api/analyze`
- Content type: `multipart/form-data`
- Field: `file` (video)
- Optional query: `video_id`

Returns `FlagReport` JSON:

```json
{
  "videoId": "string",
  "filename": "string",
  "processedAt": "ISO-8601",
  "overallSeverity": "Low|Medium|High|Critical",
  "recommendedAction": "Allow|Auto-Hold|Human-Review-Queue|Auto-Reject",
  "stages": [],
  "processingTimeMs": 1234
}
```

### `POST /api/review-queue`
Accepts full `FlagReport` payload and queues it for human moderators.

### `WS /ws/progress/{videoId}`
Pushes real-time updates:

```json
{
  "videoId": "uuid",
  "stage": 1,
  "status": "running|completed|failed",
  "message": "optional",
  "stageResult": {}
}
```

## Error Format

All API errors return:

```json
{ "error": "string", "stage": 1 }
```

`stage` is `null` for non-stage-specific failures.

## Demo Mode

Set `DEMO_MODE=true` in `.env`.

- Skips expensive ML inference
- Returns a prebuilt sample report
- Still emits stage progress through WebSocket

## Model Weights and Datasets

- FaceForensics++ access request form:
  - https://docs.google.com/forms/d/e/1FAIpQLSd-N86H6n8Q3JfA9x-z6fC8dH_3Y4fiyQk6vI2eSXx04G2f3Q/viewform
- EfficientNet-B4 reference (torchvision):
  - https://pytorch.org/vision/main/models/generated/torchvision.models.efficientnet_b4.html
- Whisper reference:
  - https://github.com/openai/whisper

Place downloaded weights in:

- `backend/weights/efficientnet_b4_deepfake.pth`
- `backend/weights/efficientnet_b4_sensitive.pth`

## Notes

- Stage 2 Google Speech-to-Text fallback is stubbed for MVP extension.
- Stage 3 uses optional InsightFace integration when available.
- For production, secure CORS, add authentication, and use persistent DB for review queue.
