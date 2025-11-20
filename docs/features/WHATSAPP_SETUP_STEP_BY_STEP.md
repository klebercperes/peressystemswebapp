# WhatsApp Business API Setup - Step by Step Guide

## Prerequisites
- Facebook/Meta account
- Business Manager account (or create one)
- Phone number for WhatsApp Business

---

## Step 1: Create a Meta App

1. Go to **Meta for Developers**: https://developers.facebook.com/
2. Click **"My Apps"** (top right)
3. Click **"Create App"**
4. Select **"Business"** as the app type
5. Fill in:
   - **App Name**: `Peres Systems` (or your business name)
   - **App Contact Email**: `kleber@peres.systems`
   - Click **"Create App"**

**Note your App ID** - you'll need this later!

---

## Step 2: Add WhatsApp Product

1. In your app dashboard, find **"Add Products"** section
2. Look for **"WhatsApp"** product
3. Click **"Set Up"** button
4. You'll be redirected to WhatsApp setup page

---

## Step 3: Get Your Phone Number ID

### For Test Number (Initial Setup):
1. In WhatsApp setup page, go to **"API Setup"** tab
2. You'll see a **"Phone number ID"** - this is a long number like `123456789012345`
3. **Copy this number** - this is your `WHATSAPP_PHONE_NUMBER_ID` (for testing)

**Note**: You may also see a "WhatsApp Business Account ID" - this is different from the Phone Number ID. Use the Phone Number ID for `WHATSAPP_PHONE_NUMBER_ID`.

### For Business Number (After Adding Your Phone):
1. Go to **WhatsApp** → **"Phone Numbers"** (or **"API Setup"** → scroll to phone numbers section)
2. Find your business phone number (e.g., +61493929511)
3. Click on it or view details
4. Find the **"Phone Number ID"** associated with that number
5. **Copy this number** - this is your new `WHATSAPP_PHONE_NUMBER_ID` (for production)

**⚠️ Important**: 
- Each phone number has its own unique Phone Number ID
- The test number ID is different from your business number ID
- Make sure you're copying the ID for the correct phone number

---

## Step 4: Generate Access Token

1. Still in **"API Setup"** tab
2. Find **"Temporary access token"** section
3. Click **"Generate"** or **"Copy"** button
4. **Copy this token** - this is your `WHATSAPP_API_TOKEN`

**⚠️ Important Notes:**
- **Temporary tokens expire in 1-2 hours**
- For production, you need a **permanent token** (see Step 7)
- Keep this token secret - never share it publicly

---

## Step 5: Create Verify Token

1. Create your own verify token (any random string)
2. Example: `peres_whatsapp_2024_secure_token_xyz123`
3. This is your `WHATSAPP_VERIFY_TOKEN`
4. **Write it down** - you'll need it for webhook setup

**Tip**: Use a strong, unique string that's hard to guess.

---

## Step 6: Get Your App ID

1. In your app dashboard, go to **"Settings"** → **"Basic"**
2. Find **"App ID"** - it's a long number like `1234567890123456`
3. **Copy this number** - this is your `WHATSAPP_APP_ID`

---

## Step 7: Get Permanent Access Token (For Production)

### Option A: Using System User (Recommended for Production)

1. Go to **Meta Business Suite**: https://business.facebook.com/
2. Go to **"Business Settings"** → **"Users"** → **"System Users"**
3. Click **"Add"** → Create a new system user
4. Assign **"WhatsApp Business"** permissions
5. Generate token for this system user
6. **Copy the permanent token**

### Option B: Using App Access Token (Simpler, but less secure)

1. In your app dashboard → **"Settings"** → **"Basic"**
2. Find **"App ID"** and **"App Secret"**
3. Your permanent token format: `{APP_ID}|{APP_SECRET}`
4. Example: `1234567890123456|abcdef1234567890abcdef1234567890`

**⚠️ Security Note**: App Secret tokens are less secure. Use System User tokens for production.

---

## Step 8: Update Your .env File

Add these values to your `.env` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=paste_your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=paste_your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=peres_whatsapp_2024_secure_token_xyz123
WHATSAPP_APP_ID=paste_your_app_id_here

# Admin Email (already set)
ADMIN_EMAIL=kleber@peres.systems
```

**Replace the placeholder values with your actual values from Steps 3-6.**

---

## Step 9: Restart Backend

```bash
cd /home/kleber/peres_systems
docker-compose restart backend
```

---

## Step 10: Add Test Phone Number to Allowed List

**⚠️ IMPORTANT**: Before testing, you must add your phone number to the allowed recipients list!

1. Go to your app dashboard → **WhatsApp** → **"API Setup"**
2. Scroll down to **"To"** section
3. Click **"Manage phone number list"** or **"Add phone number"**
4. Enter your phone number (the one you want to receive test messages)
5. Verify it via SMS or call
6. Click **"Add"**

**Note**: With test numbers, you can only send messages to numbers in this allowed list. This is a security feature to prevent spam.

---

## Step 11: Test Sending a Message

1. Visit your website
2. Click the WhatsApp chat button
3. Send a test message
4. Check your WhatsApp for the message

**If it works**: ✅ Setup complete!

**If you get error "(#131030) Recipient phone number not in allowed list"**:
- Go back to Step 10 and add your phone number to the allowed list
- Make sure the phone number format is correct (with country code, no + sign)

**If it doesn't work**: Check backend logs:
```bash
docker-compose logs backend | grep -i whatsapp
```

---

## Step 12: Set Up Webhook (Optional - For Receiving Replies)

### 12.1: Get Your Webhook URL

Your webhook URL should be:
```
https://peres.systems/api/whatsapp/webhook
```

(Replace `peres.systems` with your actual domain)

### 12.2: Configure Webhook in Meta

1. Go to your app dashboard → **WhatsApp** → **"Configuration"**
2. Find **"Webhook"** section
3. Click **"Edit"** or **"Set up webhook"**
4. Enter:
   - **Callback URL**: `https://peres.systems/api/whatsapp/webhook`
   - **Verify Token**: (same as `WHATSAPP_VERIFY_TOKEN` in your .env)
5. Click **"Verify and Save"**

### 12.3: Subscribe to Events

1. After webhook is verified, click **"Manage"**
2. Subscribe to these events:
   - ✅ **messages** (to receive messages)
   - ✅ **message_status** (to track delivery status)
3. Click **"Save"**

---

## Step 13: Add Your Business Phone Number (For Production)

1. Go to **Meta Business Suite**: https://business.facebook.com/
2. Go to **"WhatsApp Accounts"** → **"Phone Numbers"**
3. Click **"Add Phone Number"**
4. Enter your business phone number
5. Verify it via SMS or call
6. Once verified, update `WHATSAPP_PHONE_NUMBER_ID` in .env with the new number ID

**⚠️ If Status Shows "Pending":**

If your phone number shows **"Pending"** status (instead of "Active" or "Connected"), you need to complete additional verification steps:

### Step 13.1: Check What's Needed

1. In **WhatsApp Manager** → **Phone numbers**, click on your phone number (`+61 493 929 511`)
2. Look for any **action buttons** or **notifications** indicating what's required
3. Common requirements:
   - **Phone verification**: Complete SMS/call verification
   - **Business verification**: Verify your Meta Business account
   - **Additional documentation**: Submit business documents

### Step 13.2: Complete Phone Verification

1. Click on your phone number in the list
2. Look for **"Verify"** or **"Complete Verification"** button
3. Choose verification method:
   - **SMS**: Receive code via text message
   - **Call**: Receive code via automated call
4. Enter the verification code when prompted
5. Status should change from "Pending" to "Active" or "Connected"

### Step 13.3: Complete Business Verification (If Required)

If Meta requires business verification:

1. Go to **Meta Business Suite**: https://business.facebook.com/
2. Go to **"Security Center"** or **"Business Info"**
3. Look for **"Business Verification"** section
4. Click **"Start Verification"** or **"Continue Verification"**
5. Submit required documents:
   - Business registration documents
   - Proof of business address
   - Business website URL
   - Business phone number (should match your WhatsApp number)
6. Wait for review (typically 7-10 days, can take longer)

**Note**: As of November 2023, business verification is **not mandatory** for basic messaging, but may be required for:
- Higher messaging limits
- Certain features
- Production use

### Step 13.4: Check Phone Number Settings

1. Click the **gear icon** (⚙️) next to your phone number
2. Review all settings and complete any required fields
3. Ensure the phone number is properly linked to your WhatsApp Business Account

**Once status changes to "Active" or "Connected":**
- You can use the phone number for sending messages
- Update `WHATSAPP_PHONE_NUMBER_ID` in .env with the correct ID
- Restart backend: `docker-compose restart backend`

---

## Step 14: Link Phone Number to WhatsApp Business App (Optional - To Receive Messages on Mobile)

**✅ YES!** You can link your business number to WhatsApp Business app on your phone to receive messages directly.

### Step 14.1: Install WhatsApp Business App

1. Download **"WhatsApp Business"** app on your phone:
   - **iOS**: App Store
   - **Android**: Google Play Store

### Step 14.2: Verify Phone Number in App

1. Open WhatsApp Business app
2. Tap **"Agree and Continue"**
3. Enter your phone number: `+61493929511`
4. Tap **"Next"**
5. You'll receive a verification code via SMS
6. Enter the code to verify

### Step 14.3: Link to Business Account (Recommended)

1. In WhatsApp Business app → **Settings** → **Business tools**
2. Look for **"Business Account"** or **"Meta Business"**
3. Tap **"Connect"** or **"Link Account"**
4. Log in with your Meta Business account
5. Select your business
6. Your number will be linked!

### Step 14.4: Verify Connection

1. Go to: https://business.facebook.com/
2. Go to: **WhatsApp Accounts** → **Phone Numbers**
3. Find `+61493929511`
4. Check status - should show **"Connected"** or **"Active"**

**Benefits of Linking:**
- ✅ Receive messages directly on your phone
- ✅ Reply from your phone
- ✅ Use both API and mobile app
- ✅ Better for customer support

**Note**: You can use both API (for automated sending) and mobile app (for receiving/replies) at the same time!

---

## Troubleshooting

### "Invalid OAuth access token"
- **Cause**: Token expired (if using temporary token)
- **Solution**: Generate new token or use permanent token

### "Phone number not registered"
- **Cause**: Phone number not added to WhatsApp Business account
- **Solution**: Add phone number in Meta Business Suite (Step 13)

### "(#131030) Recipient phone number not in allowed list"
- **Cause**: Phone number not in the allowed recipients list (required for test numbers)
- **Solution**: Add your phone number to the allowed list in API Setup → "To" section (Step 10)

### "Rate limit exceeded"
- **Cause**: Hit free tier limit (1,000 conversations/month)
- **Solution**: Wait for reset or upgrade plan

### "Webhook verification failed"
- **Cause**: Verify token doesn't match
- **Solution**: Check `WHATSAPP_VERIFY_TOKEN` in .env matches webhook config

### Messages not sending
- Check backend logs: `docker-compose logs backend | grep -i whatsapp`
- Verify all credentials in .env are correct
- Ensure backend was restarted after updating .env

### "Phone number status: Pending"
- **Cause**: Phone number not fully verified or business verification incomplete
- **Solution**: 
  1. Click on the phone number in WhatsApp Manager
  2. Complete phone verification (SMS/call)
  3. Complete business verification if required (see Step 13.3)
  4. Wait for status to change to "Active" or "Connected"
  5. Check for any action buttons or notifications in the phone number details
- **Note**: You cannot send messages while status is "Pending"

### "Test number stopped sending messages"
- **Cause**: Most commonly, temporary access token expired (expires in 1-2 hours)
- **Solution**: 
  1. Go to: https://developers.facebook.com/apps/
  2. Select your app → **WhatsApp** → **API Setup**
  3. Find **"Temporary access token"** section
  4. Click **"Generate"** or **"Copy"** to get a new token
  5. Update `.env` file: `WHATSAPP_API_TOKEN=new_token_here`
  6. Restart backend: `docker-compose restart backend`
  7. Test sending a message again
- **Alternative**: Set up a permanent token (see Step 7) to avoid this issue
- **Other possible causes**:
  - Test number ID changed (check API Setup for current Phone Number ID)
  - Rate limit reached (check WhatsApp → Insights → Messaging limits)
  - Recipient not in allowed list (check API Setup → "To" section)

---

## Production Checklist

Before going live:

- [ ] Meta Business Account verified
- [ ] WhatsApp Business API enabled
- [ ] Permanent access token generated (not temporary)
- [ ] Business phone number added and verified
- [ ] All credentials added to .env file
- [ ] Backend restarted
- [ ] Test message sent successfully
- [ ] Webhook configured (optional, for receiving replies)
- [ ] Rate limits understood (1,000 conversations/month free tier)

---

## Quick Reference

| Value | Where to Find |
|-------|---------------|
| `WHATSAPP_API_URL` | Always: `https://graph.facebook.com/v18.0` |
| `WHATSAPP_API_TOKEN` | App Dashboard → WhatsApp → API Setup → Access Token |
| `WHATSAPP_PHONE_NUMBER_ID` | App Dashboard → WhatsApp → API Setup → Phone Number ID |
| `WHATSAPP_VERIFY_TOKEN` | You create this (any random string) |
| `WHATSAPP_APP_ID` | App Dashboard → Settings → Basic → App ID |

---

## Need Help?

- Meta Developer Docs: https://developers.facebook.com/docs/whatsapp
- WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
- Check backend logs: `docker-compose logs backend | grep -i whatsapp`

