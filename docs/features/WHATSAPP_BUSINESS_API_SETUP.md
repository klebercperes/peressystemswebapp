# WhatsApp Business API Setup Guide

## Overview

This guide walks you through setting up WhatsApp Business API to enable real-time chat on your website.

## Prerequisites

- Meta Business Account
- WhatsApp Business Account
- Business verification (may be required)

## Step-by-Step Setup

### Step 1: Create Meta Business Account

1. Go to: https://business.facebook.com/
2. Create or log in to your Meta Business Account
3. Complete business verification if prompted

### Step 2: Set Up WhatsApp Business API

1. Go to: https://developers.facebook.com/apps/
2. Click "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - App Name: "Peres Systems"
   - Contact Email: your email
   - Business Account: Select your business

### Step 3: Add WhatsApp Product

1. In your app dashboard, go to "Add Products"
2. Find "WhatsApp" and click "Set Up"
3. Click "Get Started" on the WhatsApp Business API

### Step 4: Get API Credentials

1. Go to WhatsApp → API Setup
2. You'll need:
   - **Phone Number ID**: Found in API Setup section
   - **Access Token**: Generate a temporary token (or permanent via Business Manager)
   - **Verify Token**: Create your own (e.g., random string)
   - **App ID**: From app settings

### Step 5: Configure Environment Variables

Add to `/home/kleber/peres_systems/.env`:

```env
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=your_random_verify_token_here
WHATSAPP_APP_ID=your_app_id_here
```

### Step 6: Set Up Webhook (For Receiving Messages)

1. In WhatsApp → Configuration → Webhook
2. Set Callback URL: `https://peres.systems/api/whatsapp/webhook`
3. Set Verify Token: (same as WHATSAPP_VERIFY_TOKEN in .env)
4. Subscribe to: `messages` event

### Step 7: Test Phone Number

WhatsApp provides a test phone number for development:
- Use this to test before going live
- Send test messages to verify setup

## Important Notes

### Rate Limits
- **Tier 1**: 1,000 conversations per month (free tier)
- **Tier 2+**: Higher limits (paid)

### Message Templates
- First message must be a pre-approved template
- After user replies, you can send free-form messages for 24 hours

### Phone Number Format
- Use international format: `61493929511` (no +, no spaces)
- Backend automatically normalizes phone numbers

## Verification

### Test Sending
```bash
# Check backend logs
docker logs msp_backend | grep WhatsApp

# Test API endpoint
curl -X POST https://peres.systems/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"61493929511","message":"Test message"}'
```

### Check Webhook
```bash
# Webhook verification (GET request)
curl https://peres.systems/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test
```

## Troubleshooting

### "Invalid OAuth access token"
- Token expired (temporary tokens expire)
- Generate new token or use permanent token

### "Phone number not registered"
- Add phone number in WhatsApp Business Manager
- Verify phone number ownership

### "Rate limit exceeded"
- You've hit the free tier limit
- Wait for reset or upgrade tier

### Messages not sending
- Check API credentials in .env
- Verify phone number format
- Check backend logs for errors

## Production Checklist

- [ ] Meta Business Account created
- [ ] WhatsApp Business API enabled
- [ ] API credentials added to .env
- [ ] Webhook configured
- [ ] Test message sent successfully
- [ ] Backend restarted with new credentials
- [ ] Frontend deployed with widget

## Next Steps

After setup:
1. Test sending a message from the widget
2. Check your WhatsApp for the message
3. Reply from WhatsApp
4. Set up webhook to receive replies in widget (optional)

---

**Note**: WhatsApp Business API requires business verification for production use. The free tier is limited but sufficient for testing.

