#!/bin/bash
# Helper script to update WhatsApp configuration in .env file

ENV_FILE=".env"
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"

echo "═══════════════════════════════════════════════════════════════"
echo "  WhatsApp Configuration Updater"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Backup .env file
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo "✅ Backed up .env to $BACKUP_FILE"
    echo ""
fi

# Get values from user
echo "Please enter your WhatsApp configuration values:"
echo ""

read -p "WHATSAPP_API_TOKEN: " api_token
read -p "WHATSAPP_PHONE_NUMBER_ID (no + sign): " phone_number_id
read -p "WHATSAPP_VERIFY_TOKEN (or press Enter for default): " verify_token
read -p "WHATSAPP_APP_ID: " app_id

# Use default verify token if not provided
if [ -z "$verify_token" ]; then
    verify_token="peres_whatsapp_2024_secure_$(date +%s)"
    echo "Using generated verify token: $verify_token"
fi

# Remove + sign from phone number ID if present
phone_number_id=$(echo "$phone_number_id" | sed 's/^+//')

echo ""
echo "Updating .env file..."

# Update or add WhatsApp configuration
if grep -q "^WHATSAPP_API_URL=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^WHATSAPP_API_URL=.*|WHATSAPP_API_URL=https://graph.facebook.com/v18.0|" "$ENV_FILE"
else
    echo "WHATSAPP_API_URL=https://graph.facebook.com/v18.0" >> "$ENV_FILE"
fi

if grep -q "^WHATSAPP_API_TOKEN=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^WHATSAPP_API_TOKEN=.*|WHATSAPP_API_TOKEN=$api_token|" "$ENV_FILE"
else
    echo "WHATSAPP_API_TOKEN=$api_token" >> "$ENV_FILE"
fi

if grep -q "^WHATSAPP_PHONE_NUMBER_ID=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^WHATSAPP_PHONE_NUMBER_ID=.*|WHATSAPP_PHONE_NUMBER_ID=$phone_number_id|" "$ENV_FILE"
else
    echo "WHATSAPP_PHONE_NUMBER_ID=$phone_number_id" >> "$ENV_FILE"
fi

if grep -q "^WHATSAPP_VERIFY_TOKEN=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^WHATSAPP_VERIFY_TOKEN=.*|WHATSAPP_VERIFY_TOKEN=$verify_token|" "$ENV_FILE"
else
    echo "WHATSAPP_VERIFY_TOKEN=$verify_token" >> "$ENV_FILE"
fi

if grep -q "^WHATSAPP_APP_ID=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^WHATSAPP_APP_ID=.*|WHATSAPP_APP_ID=$app_id|" "$ENV_FILE"
else
    echo "WHATSAPP_APP_ID=$app_id" >> "$ENV_FILE"
fi

echo ""
echo "✅ Configuration updated!"
echo ""
echo "Current WhatsApp configuration:"
grep "^WHATSAPP_" "$ENV_FILE" | sed 's/\(API_TOKEN\|VERIFY_TOKEN\)=.*/\1=***HIDDEN***/'
echo ""
echo "Next steps:"
echo "1. Restart backend: docker-compose restart backend"
echo "2. Test sending a message from your website"
echo "3. Check logs: docker-compose logs backend | grep -i whatsapp"
echo ""

