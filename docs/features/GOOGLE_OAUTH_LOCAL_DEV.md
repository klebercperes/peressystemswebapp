# Google OAuth and Local Development

## Problem
Google OAuth does **not** support LAN IP addresses (like `10.0.1.122:5173`). You'll get an error:
```
Invalid origin: Must end with a public top-level domain (such as .com or .org).
```

## Solution
The login page now automatically detects if you're on a LAN IP and **hides the Google OAuth button** in that case.

## Supported Origins

### ✅ Google OAuth Works On:
- `https://peres.systems` (production)
- `https://www.peres.systems` (production)
- `http://localhost:5173` (local development)
- `http://127.0.0.1:5173` (local development)

### ❌ Google OAuth Does NOT Work On:
- `http://10.0.1.122:5173` (LAN IP - not supported by Google)
- Any other LAN IP addresses

## For Local Development

### Option 1: Use localhost (Recommended)
Instead of accessing `http://10.0.1.122:5173`, use:
```
http://localhost:5173
```

This will enable Google OAuth for local testing.

### Option 2: Use Production Domain
Test Google OAuth on the production site:
```
https://peres.systems
```

### Option 3: Email/Password Login
When testing on LAN IPs, you can still use the email/password login form. Google OAuth will simply be hidden.

## Configuration

The code automatically checks the hostname:
- If on `peres.systems`, `www.peres.systems`, `localhost`, or `127.0.0.1` → Shows Google OAuth
- If on any other hostname (like LAN IPs) → Hides Google OAuth

## Testing

1. **On LAN IP** (`http://10.0.1.122:5173`):
   - ✅ Email/password login works
   - ❌ Google OAuth button is hidden

2. **On localhost** (`http://localhost:5173`):
   - ✅ Email/password login works
   - ✅ Google OAuth button is shown

3. **On production** (`https://peres.systems`):
   - ✅ Email/password login works
   - ✅ Google OAuth button is shown

## Notes

- This is a Google limitation, not a bug in our code
- Google requires public domains or localhost for OAuth
- The email/password login always works regardless of the origin

