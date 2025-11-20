# WhatsApp Business API Quick Setup

## Quick Start (5 Steps)

### Step 1: Create Meta App
1. Go to: https://developers.facebook.com/apps/
2. Click "Create App" → Select "Business"
3. App Name: "Peres Systems"
4. Note your **App ID**

### Step 2: Add WhatsApp Product
1. In your app dashboard → "Add Products"
2. Find "WhatsApp" → Click "Set Up"
3. Click "Get Started"

### Step 3: Get API Credentials
1. Go to WhatsApp → **API Setup**
2. Copy these values:
   - **Phone Number ID**: (shown in API Setup)
   - **Temporary Access Token**: Click "Generate" (or get permanent from Business Manager)
   - **Verify Token**: Create your own (e.g., `peres_whatsapp_2024_verify`)

### Step 4: Add to .env File

Edit `/home/kleber/peres_systems/.env` and fill in:

```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=paste_your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=paste_your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=peres_whatsapp_2024_verify
WHATSAPP_APP_ID=paste_your_app_id_here
```

### Step 5: Restart Backend

```bash
cd /home/kleber/peres_systems
docker restart msp_backend
```

## Verify Setup

### Check Logs
```bash
docker logs msp_backend | grep WhatsApp
```

### Test Sending
1. Visit your website
2. Click WhatsApp chat button
3. Send a test message
4. Check your WhatsApp for the message

## Webhook Setup (Optional - for receiving replies)

### Step 1: Configure Webhook URL
1. In WhatsApp → Configuration → Webhook
2. Callback URL: `https://peres.systems/api/whatsapp/webhook`
3. Verify Token: (same as WHATSAPP_VERIFY_TOKEN in .env)
4. Subscribe to: `messages` event

### Step 2: Verify Webhook
WhatsApp will send a GET request to verify. The backend handles this automatically.

## Important Notes

### Access Token
- **Temporary tokens** expire in 1-2 hours
- **Permanent tokens** require Business Manager setup
- For production, use permanent token

### Phone Number
- Use test number provided by WhatsApp for development
- For production, add your business phone number

### Rate Limits
- Free tier: 1,000 conversations/month
- Each conversation = 24-hour window after user replies

### Message Templates
- First message must be a template (pre-approved)
- After user replies, you can send free-form messages

## Troubleshooting

### "Invalid OAuth access token"
→ Token expired. Generate new temporary token or set up permanent token.

### "Phone number not registered"
→ Add phone number in WhatsApp Business Manager → Phone Numbers

### "Rate limit exceeded"
→ You've hit the free tier limit. Wait for reset or upgrade.

### Messages not appearing
→ Check backend logs: `docker logs msp_backend | grep WhatsApp`

## Production Checklist

- [ ] Meta Business Account verified
- [ ] WhatsApp Business API enabled
- [ ] Permanent access token generated
- [ ] Phone number added and verified
- [ ] Credentials added to .env
- [ ] Backend restarted
- [ ] Test message sent successfully
- [ ] Webhook configured (optional)

---

**Need Help?** See full guide: `docs/features/WHATSAPP_BUSINESS_API_SETUP.md`

