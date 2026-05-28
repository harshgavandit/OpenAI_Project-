"""Email service using Gmail SMTP."""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from sqlalchemy.orm import Session

GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


class EmailService:
    """Send emails via Gmail SMTP"""

    @staticmethod
    def send_otp_email(to_email: str, otp_code: str) -> bool:
        """Send OTP verification email"""
        try:
            subject = "MemoryGraph: Email Verification Code"
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
                        <h2 style="color: #333;">Email Verification</h2>
                        <p style="color: #666; font-size: 16px;">Your verification code is:</p>
                        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
                            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
                        </div>
                        <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
                        <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                    </div>
                </body>
            </html>
            """
            return EmailService._send_email(to_email, subject, html_body)
        except Exception as e:
            print(f"Failed to send OTP email: {e}")
            return False

    @staticmethod
    def send_welcome_email(to_email: str, full_name: str) -> bool:
        """Send welcome email after registration"""
        try:
            subject = "Welcome to MemoryGraph!"
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
                        <h2 style="color: #333;">Welcome, {full_name or 'User'}! 👋</h2>
                        <p style="color: #666; font-size: 16px;">Your MemoryGraph account is now active.</p>
                        <p style="color: #666;">You can now:</p>
                        <ul style="color: #666;">
                            <li>Upload and organize your memories</li>
                            <li>Create knowledge graphs</li>
                            <li>Share memories with others</li>
                        </ul>
                        <a href="http://localhost:3000/dashboard" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">Go to Dashboard</a>
                    </div>
                </body>
            </html>
            """
            return EmailService._send_email(to_email, subject, html_body)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
            return False

    @staticmethod
    def _send_email(to_email: str, subject: str, html_body: str) -> bool:
        """Internal method to send email via Gmail SMTP"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = GMAIL_EMAIL
            msg["To"] = to_email

            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
                server.sendmail(GMAIL_EMAIL, to_email, msg.as_string())

            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
