#!/usr/bin/env python3
"""
Simple CLI tool to interact with Google Gemini AI.
Usage:
    python gemini_cli.py "Your question here"
    python gemini_cli.py  # Interactive mode
"""

import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("❌ Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set.")
    print("\nTo set it:")
    print("  1. Add to .env file: GEMINI_API_KEY=your_api_key_here")
    print("  2. Or export: export GEMINI_API_KEY=your_api_key_here")
    sys.exit(1)

# Configure the API
genai.configure(api_key=API_KEY)

def chat_with_gemini(prompt: str, model: str = "gemini-2.0-flash-exp") -> str:
    """Send a prompt to Gemini and return the response."""
    try:
        model_instance = genai.GenerativeModel(model)
        response = model_instance.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"❌ Error: {str(e)}"

def interactive_mode():
    """Run in interactive chat mode."""
    print("🤖 Gemini CLI - Interactive Mode")
    print("Type 'exit', 'quit', or 'q' to exit")
    print("Type 'model <name>' to change model (default: gemini-2.0-flash-exp)")
    print("Available models: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash")
    print("-" * 60)
    
    model = "gemini-2.0-flash-exp"
    
    while True:
        try:
            user_input = input("\nYou: ").strip()
            
            if not user_input:
                continue
                
            if user_input.lower() in ['exit', 'quit', 'q']:
                print("👋 Goodbye!")
                break
                
            if user_input.lower().startswith('model '):
                new_model = user_input[6:].strip()
                model = new_model
                print(f"✅ Model changed to: {model}")
                continue
            
            print("\n🤖 Gemini:")
            response = chat_with_gemini(user_input, model)
            print(response)
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except EOFError:
            print("\n\n👋 Goodbye!")
            break

def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        # Single command mode
        prompt = " ".join(sys.argv[1:])
        response = chat_with_gemini(prompt)
        print(response)
    else:
        # Interactive mode
        interactive_mode()

if __name__ == "__main__":
    main()

