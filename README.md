# Twelve Tones Music Generator

This web application automatically generates music based on Schoenberg's twelve-tone technique.

## Try it out! 🚀
<a href="https://huggingface.co/spaces/atsushieee/twelve-tones-music-generator" target="_blank">
    <img src="https://img.shields.io/badge/🤗_Demo-Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face Spaces" />
</a>

## Features

- Music generation based on twelve-tone technique
- Real-time MIDI playback
- Interactive Web UI
- Real-time communication using WebSocket
- Easy deployment with Docker containers

## Tech Stack

- Frontend: Vue.js
- Backend: FastAPI
- Music Generation: Python (midiutil)
- Containerization: Docker
- Deployment: Hugging Face Spaces

## Local Development

### Prerequisites
- Node.js v18 or higher
- Docker
- Docker Compose

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/twelve-tones-music-generator.git
cd twelve-tones-music-generator
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
npm run dev
```

3. Start the backend (in a separate terminal):
```bash
docker-compose -f docker-compose.yml up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Production Deployment

The application will be automatically deployed to Hugging Face Spaces when you push to the repository.

## License

MIT License

## Author

Atsushi Tabata

---
Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference
