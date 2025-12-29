"""
Management command to seed sample news items
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from superadmin.models import News
from users.models import User


class Command(BaseCommand):
    help = 'Create 10 sample news items for the platform'

    def handle(self, *args, **options):
        # Get a superadmin user if exists, else first admin, else None
        created_by = User.objects.filter(
            user_role__role_type='SUPER_ADMIN', is_active=True
        ).first()
        
        if not created_by:
            created_by = User.objects.filter(
                user_role__role_type='ADMIN', is_active=True
            ).first()
        
        news_items = [
            {
                'title': 'Welcome to Sarathi Learn Platform',
                'summary': 'A comprehensive education management system for schools.',
                'content': '''We are excited to welcome you to the Sarathi Learn platform! 

This platform is designed to streamline educational management for government schools across the nation. 

Key features include:
- Student attendance tracking
- Academic progress monitoring  
- Teacher and class management
- Real-time notifications and announcements

We are committed to improving education through technology.''',
                'priority': 'HIGH',
            },
            {
                'title': 'New Academic Year 2025-26 Guidelines Released',
                'summary': 'Important guidelines for the upcoming academic session.',
                'content': '''The Ministry of Education has released new guidelines for the academic year 2025-26.

Key points:
1. Schools to follow the new NEP 2020 curriculum framework
2. Digital attendance is now mandatory
3. Regular parent-teacher meetings to be conducted monthly
4. Focus on skill-based learning and assessments

Please ensure all staff members are familiar with these guidelines.''',
                'priority': 'URGENT',
            },
            {
                'title': 'Teacher Training Workshop - January 2025',
                'summary': 'Upcoming professional development opportunity for teachers.',
                'content': '''A comprehensive teacher training workshop will be conducted in January 2025.

Topics covered:
- Modern teaching methodologies
- Effective use of digital tools in classroom
- Student engagement techniques
- Assessment and evaluation best practices

Registration will open soon. Stay tuned for more details.''',
                'priority': 'NORMAL',
            },
            {
                'title': 'Annual Sports Day Celebration',
                'summary': 'Celebrating physical fitness and sportsmanship.',
                'content': '''Schools are encouraged to organize Annual Sports Day celebrations this month.

Activities to include:
- Track and field events
- Team sports competitions
- Cultural performances
- Prize distribution ceremony

Promote healthy competition and teamwork among students!''',
                'priority': 'NORMAL',
            },
            {
                'title': 'Mid-Term Examination Schedule',
                'summary': 'Important dates for upcoming mid-term exams.',
                'content': '''Mid-term examinations will be conducted as per the following schedule:

- Classes 1-5: First week of February
- Classes 6-8: Second week of February
- Classes 9-10: Third week of February
- Classes 11-12: Fourth week of February

Ensure proper preparation and coordination with examination cell.''',
                'priority': 'HIGH',
            },
            {
                'title': 'Republic Day Celebration Guidelines',
                'summary': 'Instructions for conducting Republic Day programs.',
                'content': '''All schools must observe Republic Day with appropriate ceremonies.

Program structure:
1. Flag hoisting at 8:00 AM
2. National anthem
3. Patriotic songs and speeches
4. Cultural performances by students
5. Distribution of sweets

Ensure participation of all students and staff members.''',
                'priority': 'NORMAL',
            },
            {
                'title': 'New Library Books Available',
                'summary': 'Fresh collection of educational books added to school libraries.',
                'content': '''A new collection of books has been distributed to all schools.

Categories include:
- Science and Technology
- Mathematics puzzles and problems
- Hindi and English literature
- General Knowledge and Current Affairs
- Skill development and career guidance

Encourage students to make use of library resources.''',
                'priority': 'LOW',
            },
            {
                'title': 'Health and Hygiene Awareness Campaign',
                'summary': 'Promoting health consciousness among students.',
                'content': '''A month-long health awareness campaign is being launched.

Key initiatives:
- Daily hand washing drills
- Cleanliness drives
- Health check-up camps
- Nutritious mid-day meal awareness
- Mental health sessions

Let's work together for a healthier future!''',
                'priority': 'NORMAL',
            },
            {
                'title': 'Parent-Teacher Meeting Schedule',
                'summary': 'Monthly PTM dates announced for all schools.',
                'content': '''Parent-Teacher Meetings will be held on the last Saturday of every month.

Agenda:
- Academic progress discussion
- Attendance review
- Behavioral observations
- Homework and assignment follow-up
- Parent feedback collection

All parents are requested to attend without fail.''',
                'priority': 'NORMAL',
            },
            {
                'title': 'Digital India: Smart Classroom Initiative',
                'summary': 'Technology upgrades coming to classrooms.',
                'content': '''Under the Digital India initiative, schools will receive smart classroom equipment.

Upcoming installations:
- Interactive whiteboards
- Projectors and screens
- Computer systems
- High-speed internet connectivity
- Educational software packages

Training sessions for teachers will be conducted soon. Embrace digital learning!''',
                'priority': 'HIGH',
            },
        ]

        created_count = 0
        for i, news_data in enumerate(news_items, 1):
            # Check if news with this title already exists
            if News.objects.filter(title=news_data['title']).exists():
                self.stdout.write(f"News '{news_data['title'][:40]}...' already exists, skipping.")
                continue
            
            news = News.objects.create(
                title=news_data['title'],
                summary=news_data['summary'],
                content=news_data['content'],
                priority=news_data['priority'],
                status='PUBLISHED',
                published_at=timezone.now(),
                created_by=created_by,
                is_active=True,
            )
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f"Created news: {news.title[:50]}..."))

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {created_count} news items!'))


