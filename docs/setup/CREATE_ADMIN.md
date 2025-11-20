# Creating an Administrator Account

There are several ways to create an administrator account:

## Method 1: Register First User (Automatic Admin)

The **first user** to register automatically becomes an administrator:

1. Start your application
2. Go to the registration page
3. Create an account
4. That user will have `is_superuser=True` automatically

## Method 2: Using the Interactive Script (Recommended)

```bash
cd /home/kleber/peres_systems/backend
python3 create_admin_interactive.py
```

This will prompt you for:
- Username
- Email
- Password (hidden input)
- Full Name (optional)

## Method 3: Using Command-Line Arguments

```bash
cd /home/kleber/peres_systems/backend
python3 create_admin.py admin admin@example.com SecurePassword123 "Admin User"
```

Arguments:
1. Username
2. Email
3. Password
4. Full Name (optional)

## Method 4: Using Docker

If running in Docker:

```bash
# Interactive
docker-compose exec backend python3 create_admin_interactive.py

# Or with arguments
docker-compose exec backend python3 create_admin.py admin admin@example.com SecurePassword123
```

## Method 5: Using Python Directly

```python
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
import uuid

db = SessionLocal()
admin = models.User(
    id=f"usr-{uuid.uuid4().hex[:8]}",
    username="admin",
    email="admin@example.com",
    hashed_password=get_password_hash("your_password"),
    is_active=True,
    is_superuser=True
)
db.add(admin)
db.commit()
```

## Quick Start (Recommended)

```bash
# Navigate to backend directory
cd /home/kleber/peres_systems/backend

# Run interactive script
python3 create_admin_interactive.py
```

Then follow the prompts to create your admin account.

## Default Admin Credentials

**There are NO default credentials.** You must create an admin account using one of the methods above.

## Security Notes

- Use a strong password (minimum 8 characters, but 12+ recommended)
- Never share admin credentials
- Consider using different admin accounts for different environments
- The first registered user automatically becomes admin (for convenience)

## Troubleshooting

### "No module named 'app'"
Make sure you're in the backend directory and the Python path is set:
```bash
cd /home/kleber/peres_systems/backend
export PYTHONPATH=/home/kleber/peres_systems/backend
python3 create_admin_interactive.py
```

### "Username already exists"
The username is already taken. Choose a different username.

### "Email already exists"
The email is already registered. Use a different email or login with existing account.

