"""
Email service for sending verification emails
"""
import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from typing import Optional
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Email configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Peres Systems")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://peres.systems")

# Email template
VERIFICATION_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Peres Systems</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <a href="{{ verification_url }}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">{{ verification_url }}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2024 Peres Systems. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

async def send_verification_email(email: str, verification_token: str) -> bool:
    """
    Send email verification email
    
    Args:
        email: Recipient email address
        verification_token: Verification token to include in the link
        
    Returns:
        True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Email sending disabled.")
        logger.info(f"Verification link for {email}: {FRONTEND_URL}/verify-email?token={verification_token}")
        return False
    
    try:
        verification_url = f"{FRONTEND_URL}/verify-email?token={verification_token}"
        
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = email
        message["Subject"] = "Verify Your Email Address - Peres Systems"
        
        # Render HTML template
        template = Template(VERIFICATION_EMAIL_TEMPLATE)
        html_content = template.render(verification_url=verification_url)
        
        # Create HTML part
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email using STARTTLS (required for Gmail on port 587)
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,  # Use STARTTLS instead of direct TLS
        )
        
        logger.info(f"Verification email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        return False


# Password reset email template
PASSWORD_RESET_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <a href="{{ reset_url }}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #DC2626;">{{ reset_url }}</p>
            <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 Peres Systems. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

async def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    Send password reset email
    
    Args:
        email: Recipient email address
        reset_token: Password reset token to include in the link
        
    Returns:
        True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Email sending disabled.")
        logger.info(f"Password reset link for {email}: {FRONTEND_URL}/reset-password?token={reset_token}")
        return False
    
    try:
        reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = email
        message["Subject"] = "Reset Your Password - Peres Systems"
        
        # Render HTML template
        template = Template(PASSWORD_RESET_EMAIL_TEMPLATE)
        html_content = template.render(reset_url=reset_url)
        
        # Create HTML part
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email using STARTTLS (required for Gmail on port 587)
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,  # Use STARTTLS instead of direct TLS
        )
        
        logger.info(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        return False


async def send_contact_email(name: str, email: str, phone: str, subject: str, message: str) -> bool:
    """
    Send contact form email to admin
    
    Args:
        name: Sender's name
        email: Sender's email address
        phone: Sender's phone number (optional)
        subject: Email subject
        message: Email message content
        
    Returns:
        True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Email sending disabled.")
        logger.info(f"Contact form submission from {name} ({email}): {subject}")
        return False
    
    try:
        admin_email = os.getenv("ADMIN_EMAIL", SMTP_USER)
        
        logger.info(f"Attempting to send contact email to {admin_email} from {name} ({email})")
        
        # Create message
        msg = MIMEMultipart("mixed")
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg["To"] = admin_email
        msg["Subject"] = f"Contact Form: {subject}"
        msg["Reply-To"] = email
        
        # Email body (plain text)
        body = f"""New contact form submission from Peres Systems website:

Name: {name}
Email: {email}
Phone: {phone or 'Not provided'}
Subject: {subject}

Message:
{message}

---
This email was sent from the contact form on peres.systems
You can reply directly to this email to respond to {name} at {email}
"""
        
        text_part = MIMEText(body, "plain", "utf-8")
        msg.attach(text_part)
        
        # Log email details before sending
        logger.debug(f"SMTP Config - Host: {SMTP_HOST}, Port: {SMTP_PORT}, User: {SMTP_USER}, From: {SMTP_FROM_EMAIL}")
        
        # Send email using STARTTLS (required for Gmail on port 587)
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        
        logger.info(f"Contact email sent successfully to {admin_email} from {name} ({email})")
        logger.info(f"Email details - Subject: 'Contact Form: {subject}', Reply-To: {email}, From: {SMTP_FROM_EMAIL}")
        return True
        
    except aiosmtplib.SMTPException as e:
        logger.error(f"SMTP error sending contact email: {type(e).__name__}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Failed to send contact email: {type(e).__name__}: {str(e)}", exc_info=True)
        return False

