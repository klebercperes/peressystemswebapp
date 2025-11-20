# WhatsApp Chat Widget - Keep Visitors On-Site

## Overview

A custom WhatsApp chat widget that allows visitors to chat directly on your website without leaving. Messages are sent via WhatsApp Business API, and you can reply directly from your WhatsApp.

## Features

✅ **Floating Chat Button** - Always visible, doesn't block content  
✅ **Chat Window** - Opens on-site, WhatsApp-style interface  
✅ **Real-time Messaging** - Send messages without leaving the site  
✅ **WhatsApp Integration** - Messages sent via WhatsApp Business API  
✅ **Auto-replies** - Automatic acknowledgment messages  
✅ **Mobile Responsive** - Works on all devices  

## How It Works

1. **Visitor clicks chat button** → Chat window opens on-site
2. **Visitor types message** → Message sent to backend API
3. **Backend forwards to WhatsApp** → Via WhatsApp Business API
4. **You receive on WhatsApp** → Reply directly from your phone
5. **Replies appear in widget** → (Requires webhook setup for full two-way)

## Current Implementation

### Frontend Component
- **Location**: `components/WhatsAppChat.tsx`
- **Features**:
  - Floating green button (bottom-right)
  - Chat window with message history
  - WhatsApp-style UI
  - Auto-scroll to latest message
  - Loading states

### Backend API
- **Endpoint**: `POST /api/whatsapp/send`
- **Location**: `backend/app/main.py`
- **Service**: `backend/app/whatsapp_service.py`
- **Rate Limit**: 10 messages/minute

## Setup Options

### Option 1: WhatsApp Business API (Meta)

**Requirements:**
- WhatsApp Business Account
- Meta Business Verification
- API credentials from Meta

**Configuration:**
```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

**Steps:**
1. Create Meta Business Account
2. Set up WhatsApp Business API
3. Get API credentials
4. Add to `.env` file
5. Configure webhook for receiving messages

### Option 2: Twilio WhatsApp API

**Requirements:**
- Twilio account
- WhatsApp-enabled phone number

**Configuration:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**Steps:**
1. Sign up for Twilio
2. Enable WhatsApp on your number
3. Get credentials
4. Add to `.env` file

### Option 3: Current Mode (Logging Only)

**Current Behavior:**
- Messages are logged to backend
- No actual WhatsApp sending (API not configured)
- Auto-reply shown to user
- You can check logs for messages

**To view messages:**
```bash
docker logs msp_backend | grep "WhatsApp message"
```

## Webhook Setup (For Receiving Replies)

To receive replies in the chat widget, you need to set up a webhook:

1. **Create webhook endpoint** in backend
2. **Register webhook** with WhatsApp Business API
3. **Handle incoming messages** and update chat widget

This requires WebSocket or polling for real-time updates.

## Usage

The chat widget automatically appears on:
- Landing page (HomePage)
- Services page
- Contact page

**Not shown on:**
- Login page
- Authenticated user pages (dashboard, etc.)

## Customization

### Change Phone Number
Edit `App.tsx`:
```tsx
<WhatsAppChat phoneNumber="61493929511" businessName="Peres Systems" />
```

### Change Business Name
Same as above, update `businessName` prop.

### Styling
Edit `components/WhatsAppChat.tsx` to customize:
- Colors
- Size
- Position
- Welcome message

## Testing

### Without API (Current)
1. Open any public page
2. Click WhatsApp button
3. Type a message
4. Check backend logs: `docker logs msp_backend`

### With API Configured
1. Configure API credentials in `.env`
2. Restart backend: `docker restart msp_backend`
3. Send test message
4. Check your WhatsApp for message

## Future Enhancements

- [ ] WebSocket for real-time replies
- [ ] Message history persistence
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File attachments
- [ ] Multiple agents support

## Troubleshooting

### Messages Not Sending
- Check API credentials in `.env`
- Verify backend logs for errors
- Check rate limiting (10/minute)

### Widget Not Showing
- Check browser console for errors
- Verify component is imported in `App.tsx`
- Check if on authenticated page (widget only shows on public pages)

### API Errors
- Verify API credentials are correct
- Check API provider status
- Review backend logs for detailed errors

---

**Note**: Currently, the widget sends messages but doesn't receive replies in real-time. For full two-way chat, webhook setup is required.

