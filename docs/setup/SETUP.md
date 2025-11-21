# Peres Systems MSP Manager - Setup Guide

This guide will help you set up and run the Peres Systems MSP Manager application.

## Prerequisites

- Docker and Docker Compose installed
- (Optional) Node.js 20+ and Python 3.11+ if running locally without Docker

## Quick Start with Docker

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/klebercperes/peres-systems-app.git
   cd peres-systems-app
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Gemini API key if you want to use the AI Assistant feature.

3. **Start all services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   
   **Note**: If accessing from another machine on the network, replace `localhost` with your server's IP address (e.g., `http://192.168.1.100:5173`).

## Project Structure

```
peres-systems-app/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py   # FastAPI application
│   │   ├── models.py # SQLAlchemy models
│   │   ├── schemas.py # Pydantic schemas
│   │   └── database.py # Database configuration
│   └── requirements.txt
├── components/        # React components
├── services/         # Frontend services
│   ├── api.ts        # API client (NEW - uses backend)
│   └── database.ts   # Old localStorage service (deprecated)
├── docker-compose.yml
└── README_FOR_CURSOR.MD
```

## Running Locally (Without Docker)

### Backend Setup

1. **Create a virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up PostgreSQL**:
   - Install PostgreSQL locally
   - Create a database named `msp_db`
   - Update `DATABASE_URL` in `.env`

4. **Run database migrations** (tables are auto-created on first run):
   ```bash
   cd app
   uvicorn main:app --reload
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variable**:
   ```bash
   export VITE_API_URL=http://localhost:8000
   ```
   
   **Note**: If accessing from another machine, use your server's IP address (e.g., `http://192.168.1.100:8000`)

3. **Run the development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/{id}` - Get a specific client
- `POST /api/clients` - Create a new client
- `PUT /api/clients/{id}` - Update a client
- `DELETE /api/clients/{id}` - Delete a client

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/{id}` - Get a specific ticket
- `GET /api/clients/{id}/tickets` - Get tickets for a client
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/{id}` - Update a ticket
- `DELETE /api/tickets/{id}` - Delete a ticket

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/{id}` - Get a specific asset
- `GET /api/clients/{id}/assets` - Get assets for a client
- `POST /api/assets` - Create a new asset
- `PUT /api/assets/{id}` - Update an asset
- `DELETE /api/assets/{id}` - Delete an asset

## Migration Status

✅ **Completed**: All CRUD operations have been migrated from localStorage to PostgreSQL backend:
- ✅ Clients: GET, POST, PUT, DELETE
- ✅ Tickets: GET, POST, PUT, DELETE
- ✅ Assets: GET, POST, PUT, DELETE

The frontend now uses `services/api.ts` instead of `services/database.ts`.

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check that `DATABASE_URL` in `.env` is correct
- Verify database credentials

### CORS Errors
- Make sure the frontend URL is in the CORS allowed origins in `backend/app/main.py`
- Check that `VITE_API_URL` matches your backend URL
- If accessing via IP, ensure it's included in the CORS allowed origins

### Port Conflicts
- If port 8000 or 5173 are in use, modify `docker-compose.yml` to use different ports

## Development Notes

- The backend automatically creates database tables on first run
- Database data persists in the `postgres_data` Docker volume
- Hot reload is enabled for both frontend and backend in development mode

