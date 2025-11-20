# Virtual Environment Setup

This project uses Docker for production, but you can use a virtual environment for local development.

## Quick Start

### Activate Virtual Environment

**Option 1: Use the activation script (easiest)**
```bash
cd backend
source activate_venv.sh
```

**Option 2: Manual activation**
```bash
cd backend
source venv/bin/activate
```

### Install Dependencies

After activating the virtual environment:
```bash
pip install -r requirements.txt
```

### Deactivate

When you're done:
```bash
deactivate
```

## Setup from Scratch

If the virtual environment doesn't exist:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Verify Installation

Check if google-generativeai is installed:
```bash
source venv/bin/activate
python -c "import google.generativeai as genai; print('✅ Google Generative AI installed!')"
```

## Using Gemini CLI

A simple CLI tool is available to interact with Google Gemini AI.

### Setup API Key

Add your Gemini API key to the `.env` file in the `backend` directory:
```bash
GEMINI_API_KEY=your_api_key_here
```

Or export it in your shell:
```bash
export GEMINI_API_KEY=your_api_key_here
```

### Usage

**Single command mode:**
```bash
cd backend
source venv/bin/activate
python gemini_cli.py "What is Python?"
```

**Interactive chat mode:**
```bash
cd backend
source venv/bin/activate
python gemini_cli.py
```

In interactive mode:
- Type your questions and press Enter
- Type `exit`, `quit`, or `q` to exit
- Type `model <name>` to change the model (e.g., `model gemini-1.5-pro`)
- Available models: `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`

**Direct execution (if executable):**
```bash
cd backend
source venv/bin/activate
./gemini_cli.py "Your question here"
```

## When to Use Virtual Environment

- Running migration scripts locally
- Running admin creation scripts
- Local development and testing
- Installing new Python packages before adding to requirements.txt
- Testing Python code outside Docker

## When Docker is Sufficient

- Production deployment
- Running the full application
- When you want isolated environments

## Note

The Docker container uses Python 3.11, while your system may have a different version. The virtual environment will use your system's Python version, which is fine for local development.

## Troubleshooting

If you get "externally-managed-environment" error:
1. Make sure you've activated the virtual environment first
2. Check that `venv/bin/activate` exists
3. Verify with: `which python` (should show path to venv)
