"""
AI Machine Models
AI system monitoring and management
"""

from django.db import models
from django.conf import settings
import uuid


class AIMachineProfile(models.Model):
    """
    AI Machine Profile
    Profile for AI system users/services
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_machine_profile'
    )
    
    # AI Machine Specific Fields
    api_key = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="API Key for AI service"
    )
    service_name = models.CharField(max_length=100)
    service_version = models.CharField(max_length=50, default='1.0.0')
    
    # Status
    is_online = models.BooleanField(default=False)
    last_ping = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_machine_profiles'
        verbose_name = 'AI Machine Profile'
        verbose_name_plural = 'AI Machine Profiles'
    
    def __str__(self):
        return f"{self.service_name} ({self.service_version})"


class AIChatSession(models.Model):
    """
    AI Chat Sessions
    Track AI conversations with students
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='ai_sessions'
    )
    
    # Session Details
    session_token = models.CharField(max_length=255, unique=True, db_index=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    
    # AI Model Info
    model_used = models.CharField(max_length=100, default='gpt-3.5-turbo')
    
    # Usage Tracking
    total_messages = models.IntegerField(default=0)
    total_tokens_used = models.IntegerField(default=0)
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'ai_chat_sessions'
        verbose_name = 'AI Chat Session'
        verbose_name_plural = 'AI Chat Sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['student', '-started_at']),
            models.Index(fields=['session_token']),
        ]
    
    def __str__(self):
        return f"Session {self.session_token[:8]} - {self.student.user.get_full_name()}"


class ChatMessage(models.Model):
    """
    Chat Messages
    Individual messages in AI chat sessions
    """
    
    ROLE_CHOICES = [
        ('USER', 'User'),
        ('ASSISTANT', 'Assistant'),
        ('SYSTEM', 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AIChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    # Message Details
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # Tokens
    tokens_used = models.IntegerField(default=0)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_messages'
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.role} - {self.content[:50]}"


class AIUsageMetrics(models.Model):
    """
    AI Usage Metrics
    Daily/hourly metrics for AI usage
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # School or Platform level
    school = models.ForeignKey(
        'superadmin.School',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ai_metrics',
        help_text="Leave blank for platform-level metrics"
    )
    
    # Metrics
    total_queries = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)
    total_sessions = models.IntegerField(default=0)
    unique_users = models.IntegerField(default=0)
    
    # Performance
    avg_response_time_ms = models.IntegerField(default=0)
    success_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    error_count = models.IntegerField(default=0)
    
    # Timestamp
    date = models.DateField(db_index=True)
    hour = models.IntegerField(blank=True, null=True, help_text="Hour of day (0-23)")
    
    class Meta:
        db_table = 'ai_usage_metrics'
        verbose_name = 'AI Usage Metric'
        verbose_name_plural = 'AI Usage Metrics'
        ordering = ['-date', '-hour']
        indexes = [
            models.Index(fields=['-date', 'school']),
        ]
        unique_together = ['school', 'date', 'hour']
    
    def __str__(self):
        school_name = self.school.name if self.school else "Platform"
        return f"{school_name} - {self.date}"
