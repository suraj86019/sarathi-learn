"""
Management command to create the initial super admin user.
Only creates if the user doesn't already exist.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create the initial super admin user if it does not exist'

    def handle(self, *args, **options):
        email = 'surajshukla.gda@gmail.com'
        password = 'Suraj@123'
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'Super admin user {email} already exists. Skipping.')
            )
            return
        
        # Create super admin user
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name='Suraj',
            last_name='Shukla',
            role='SUPERADMIN',
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created super admin user: {email}')
        )
