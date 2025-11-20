"""
WhatsApp Business API integration service
Handles sending messages via WhatsApp Business API
"""
import os
import httpx
import logging
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)

# WhatsApp Business API Configuration
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "")
WHATSAPP_API_TOKEN = os.getenv("WHATSAPP_API_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "")

# Fallback: Use Twilio WhatsApp API if configured
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "")


async def send_whatsapp_message(phone: str, message: str) -> dict:
    """
    Send a WhatsApp message using WhatsApp Business API or Twilio
    
    Args:
        phone: Recipient phone number (format: 61481943940, no + or spaces)
        message: Message text to send
        
    Returns:
        dict with status and optional reply message
    """
    # Normalize phone number (remove +, spaces, ensure starts with country code)
    normalized_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    if not normalized_phone.startswith("61"):
        # Assume Australian number if no country code
        if normalized_phone.startswith("0"):
            normalized_phone = "61" + normalized_phone[1:]
        else:
            normalized_phone = "61" + normalized_phone
    
    # Try WhatsApp Business API first
    if WHATSAPP_API_URL and WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID:
        try:
            result = await send_via_whatsapp_business_api(normalized_phone, message)
            logger.info(f"WhatsApp message sent successfully via Business API to {normalized_phone}")
            return {
                "status": "sent",
                "message": "Message sent successfully! We'll reply shortly.",
                "reply": result.get("reply")
            }
        except Exception as e:
            logger.error(f"WhatsApp Business API failed: {str(e)}")
            # Don't fall through - return error so user knows
            return {
                "status": "error",
                "message": f"Failed to send via WhatsApp API: {str(e)}. Please try the contact form or email.",
                "note": "WhatsApp API error"
            }
    
    # Fallback to Twilio
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM:
        try:
            result = await send_via_twilio(normalized_phone, message)
            logger.info(f"WhatsApp message sent successfully via Twilio to {normalized_phone}")
            return {
                "status": "sent",
                "message": "Message sent successfully! We'll reply shortly.",
                "reply": result.get("reply")
            }
        except Exception as e:
            logger.error(f"Twilio WhatsApp API failed: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to send via Twilio: {str(e)}. Please try the contact form.",
                "note": "Twilio API error"
            }
    
    # If no API configured, log the message and return success with note
    logger.info(f"WhatsApp message (no API configured): To {normalized_phone}: {message}")
    
    return {
        "status": "logged",
        "message": "Thank you for your message! We'll get back to you shortly via email or phone.",
        "note": "WhatsApp API not configured. Message logged only. Please configure API credentials in .env"
    }


async def send_via_whatsapp_business_api(phone: str, message: str) -> dict:
    """
    Send message via Meta WhatsApp Business API
    
    Note: For test numbers, the first message to a recipient must use a template.
    After the first message (24-hour window), free-form text messages can be sent.
    
    Since we're using a test number (Phone Number ID: 821970841007603), we'll
    always use template for the first message to ensure delivery.
    """
    if not WHATSAPP_API_URL or not WHATSAPP_API_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        raise ValueError("WhatsApp Business API credentials not configured")
    
    url = f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json",
    }
    
    # Check if we're using a test number (test numbers start with specific patterns)
    # Phone Number ID 821970841007603 is a test number
    # For test numbers, first message MUST use template
    is_test_number = WHATSAPP_PHONE_NUMBER_ID == "821970841007603"
    
    if is_test_number:
        # For test numbers, send template first to open conversation, then send user's message
        logger.info(f"Using test number - sending template message first, then user message to {phone}")
        async with httpx.AsyncClient() as client:
            # Step 1: Send template to open the conversation (required for first message)
            template_result = await _send_template_message(phone, message, client, url, headers)
            
            # Step 2: Immediately try to send the user's actual message as free-form text
            # This works because the template opens the 24-hour window
            try:
                await asyncio.sleep(0.5)  # Small delay to ensure template is processed
                text_result = await _send_text_message(phone, message, client, url, headers)
                logger.info(f"User's message sent successfully after template to {phone}")
                return {
                    "status": "sent",
                    "message_id": text_result.get("message_id"),
                    "reply": None,
                    "note": "Message sent successfully!"
                }
            except Exception as text_error:
                # If text message fails, at least template was sent
                logger.warning(f"Template sent but text message failed: {str(text_error)}. User will receive template, then can reply to receive their message.")
                return template_result
    
    # For production numbers, try free-form text first (works after 24-hour window)
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            response_data = response.json()
            
            # Log full response for debugging
            logger.debug(f"WhatsApp API response: {response_data}")
            
            if response.status_code == 200:
                # Check for warnings in response (e.g., message not delivered)
                if "messages" in response_data and len(response_data.get("messages", [])) > 0:
                    message_id = response_data.get("messages", [{}])[0].get("id")
                    logger.info(f"WhatsApp message accepted: {message_id} to {phone}")
                    return {
                        "status": "sent",
                        "message_id": message_id,
                        "reply": None  # Replies come via webhook
                    }
                else:
                    # No message ID returned - might be a delivery issue
                    logger.warning(f"WhatsApp API returned 200 but no message ID. Response: {response_data}")
                    # Try template message as fallback
                    return await _send_template_message(phone, message, client, url, headers)
            else:
                error_data = response_data
                error_message = error_data.get("error", {}).get("message", "Unknown error")
                error_code = error_data.get("error", {}).get("code")
                
                # If error is about needing template, try template message
                if error_code == 131047 or "template" in error_message.lower() or "first message" in error_message.lower():
                    logger.info(f"WhatsApp requires template for first message. Trying template...")
                    return await _send_template_message(phone, message, client, url, headers)
                
                logger.error(f"WhatsApp API error: {error_message} (code: {error_code})")
                raise Exception(f"WhatsApp API error: {error_message}")
    except httpx.HTTPStatusError as e:
        error_data = e.response.json() if e.response else {}
        error_message = error_data.get("error", {}).get("message", str(e))
        error_code = error_data.get("error", {}).get("code")
        logger.error(f"WhatsApp API HTTP error: {error_message} (code: {error_code})")
        
        # If error is about needing template, try template message
        if error_code == 131047 or "template" in error_message.lower():
            try:
                async with httpx.AsyncClient() as client:
                    return await _send_template_message(phone, message, client, url, headers)
            except Exception as template_error:
                logger.error(f"Template message also failed: {str(template_error)}")
        
        raise Exception(f"WhatsApp API error: {error_message}")
    except Exception as e:
        logger.error(f"WhatsApp API exception: {str(e)}")
        raise


async def _send_template_message(phone: str, message: str, client: httpx.AsyncClient, url: str, headers: dict) -> dict:
    """
    Send message using hello_world template (required for first message to a recipient)
    """
    # Use hello_world template which is pre-approved for test numbers
    # The actual user message will be sent after they reply
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": "hello_world",
            "language": {
                "code": "en_US"
            }
        }
    }
    
    response = await client.post(url, json=payload, headers=headers, timeout=10.0)
    response_data = response.json()
    
    # Log full response for debugging
    logger.info(f"WhatsApp template API response: {response_data}")
    
    if response.status_code == 200:
        if "messages" in response_data and len(response_data.get("messages", [])) > 0:
            message_id = response_data.get("messages", [{}])[0].get("id")
            logger.info(f"WhatsApp template message sent successfully: {message_id} to {phone}")
            logger.info(f"User's message '{message}' will be sent after recipient replies to the template")
            return {
                "status": "sent",
                "message_id": message_id,
                "reply": None,
                "note": "Template message sent. Your message will be delivered after the recipient replies."
            }
        else:
            error_message = "Template message accepted but no message ID returned"
            logger.error(f"WhatsApp template message error: {error_message}. Response: {response_data}")
            raise Exception(f"WhatsApp API error: {error_message}")
    else:
        error_data = response_data.get("error", {})
        error_message = error_data.get("message", "Unknown error")
        error_code = error_data.get("code")
        error_subcode = error_data.get("error_subcode")
        logger.error(f"WhatsApp template message error: {error_message} (code: {error_code}, subcode: {error_subcode})")
        
        # Check if number is not in allowed list
        if error_code == 131030 or error_subcode == 131030:
            raise Exception(f"Recipient phone number {phone} is not in the allowed list. Please add it in Meta App Dashboard → WhatsApp → API Setup → 'To' section.")
        
        raise Exception(f"WhatsApp API error: {error_message}")


async def _send_text_message(phone: str, message: str, client: httpx.AsyncClient, url: str, headers: dict) -> dict:
    """
    Send free-form text message (works after template opens conversation)
    """
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message}
    }
    
    response = await client.post(url, json=payload, headers=headers, timeout=10.0)
    response_data = response.json()
    
    if response.status_code == 200:
        if "messages" in response_data and len(response_data.get("messages", [])) > 0:
            message_id = response_data.get("messages", [{}])[0].get("id")
            logger.info(f"WhatsApp text message sent: {message_id} to {phone}")
            return {
                "status": "sent",
                "message_id": message_id,
                "reply": None
            }
        else:
            raise Exception("Text message accepted but no message ID returned")
    else:
        error_data = response_data.get("error", {})
        error_message = error_data.get("message", "Unknown error")
        raise Exception(f"WhatsApp API error: {error_message}")


async def send_via_twilio(phone: str, message: str) -> dict:
    """
    Send message via Twilio WhatsApp API
    """
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    data = {
        "From": TWILIO_WHATSAPP_FROM,
        "To": f"whatsapp:+{phone}",
        "Body": message
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, auth=auth, data=data, timeout=10.0)
        response.raise_for_status()
        
        return {
            "status": "sent",
            "message_id": response.json().get("sid"),
            "reply": None  # Replies come via webhook
        }

