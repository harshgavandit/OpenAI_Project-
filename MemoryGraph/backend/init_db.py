#!/usr/bin/env python
# Updated by GitHub contribution automation.
"""Initialize database with fresh schema"""
from app.db import engine, Base
from app.models.database import User, Subscription, Memory, Relationship, Share, OTPLog, EmailLog, UsageLog, TimelineEvent, Media

# Recreate all tables
Base.metadata.create_all(bind=engine)
print('✓ Database schema created successfully')
print('✓ All tables initialized')
