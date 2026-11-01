import os
from pathlib import Path
from getpass import getpass
from dotenv import load_dotenv
from supabase import create_client

# Load variables from backend/.env
load_dotenv(Path(__file__).parent / ".env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

if not url or not key:
    raise RuntimeError(
        "SUPABASE_URL or SUPABASE_ANON_KEY missing in backend/.env"
    )

email = input("Reviewer email: ")
password = getpass("Reviewer password: ")

supabase = create_client(url, key)

response = supabase.auth.sign_in_with_password({
    "email": email,
    "password": password
})

print("Login successful!")
print("User ID:", response.user.id)

if not response.session:
    raise RuntimeError("No authentication session returned.")

token = response.session.access_token

Path(__file__).parent.joinpath(".reviewer_token.tmp").write_text(token)

print("Access token obtained and saved temporarily.")