# Fix Google OAuth Origin Mismatch Error

## Error Message
```
Access blocked: Authorization Error
Error 400: origin_mismatch
```

## Problem
The domain/URL where your app is running is not registered in Google Cloud Console as an authorized JavaScript origin.

## Solution: Add Missing Origins to Google Cloud Console

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project (or create one if needed)
3. Find your OAuth 2.0 Client ID: `195201008846-r2l59ff7tal07r7ursh2rb8pamob3n15.apps.googleusercontent.com`
4. Click on the Client ID to edit it

### Step 2: Add Authorized JavaScript Origins
In the "Authorized JavaScript origins" section, add ALL of these:

**Production:**
- `https://peres.systems`
- `https://www.peres.systems`

**Local Development (if testing locally):**
- `http://10.0.1.122:5173`
- `http://localhost:5173`

**Important Notes:**
- Include the protocol (`http://` or `https://`)
- Include the port number if not using standard ports (80 for HTTP, 443 for HTTPS)
- Do NOT include trailing slashes
- Do NOT include paths (just the origin)

### Step 3: Add Authorized Redirect URIs
In the "Authorized redirect URIs" section, add:

**Production:**
- `https://peres.systems`
- `https://www.peres.systems`

**Local Development (if testing locally):**
- `http://10.0.1.122:5173`
- `http://localhost:5173`

### Step 4: Save Changes
1. Click "Save" at the bottom
2. Wait a few minutes for changes to propagate (can take up to 5 minutes)

### Step 5: Test
1. Clear your browser cache
2. Try Google login again
3. If still not working, wait a few more minutes and try again

## Current Configuration

**OAuth Client ID:** `195201008846-r2l59ff7tal07r7ursh2rb8pamob3n15.apps.googleusercontent.com`

**Required Origins:**
- `https://peres.systems` ✅ (should already be there)
- `https://www.peres.systems` ✅ (should already be there)
- `http://10.0.1.122:5173` ⚠️ (add if testing locally)
- `http://localhost:5173` ⚠️ (add if testing locally)

## Troubleshooting

### Still Getting Error After Adding Origins?
1. **Wait 5-10 minutes** - Google's changes can take time to propagate
2. **Clear browser cache** - Old cached credentials might be causing issues
3. **Check the exact URL** - Make sure the origin matches exactly (including protocol and port)
4. **Verify in browser console** - Check what origin the browser is sending:
   ```javascript
   console.log(window.location.origin);
   ```

### Testing Locally
If you're testing on `http://10.0.1.122:5173`, make sure:
- This exact origin is in the "Authorized JavaScript origins" list
- The origin matches exactly (no trailing slash, correct port)

### Production Issues
If production (`https://peres.systems`) is not working:
- Verify SSL certificate is valid
- Check that `https://peres.systems` (not `http://`) is in the list
- Ensure both `https://peres.systems` and `https://www.peres.systems` are added

## Quick Reference

**Google Cloud Console:** https://console.cloud.google.com/apis/credentials

**OAuth Client ID:** `195201008846-r2l59ff7tal07r7ursh2rb8pamob3n15.apps.googleusercontent.com`

**Documentation:** https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#creatingcred

