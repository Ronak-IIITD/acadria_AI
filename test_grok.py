import os
from openai import OpenAI
from dotenv import load_dotenv

# Load env vars
load_dotenv('backend/.env')

api_key = os.getenv("GROK_API_KEY")
print(f"API Key found: {api_key[:10]}..." if api_key else "API Key NOT found")

if not api_key:
    exit(1)

# Initialize client for xAI
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1"
)

try:
    print("Sending request to Grok...")
    response = client.chat.completions.create(
        model="grok-beta",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, are you working?"}
        ]
    )
    print("Response received:")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
