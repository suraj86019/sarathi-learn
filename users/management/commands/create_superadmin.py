"""
Django management command to create Super Admin user
Usage: python manage.py create_superadmin
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from users.models import User, UserRole
from superadmin.models import SuperAdminProfile
import getpass


class Command(BaseCommand):
    help = 'Create a Super Admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address for the super admin',
        )
        parser.add_argument(
            '--phone',
            type=str,
            help='Phone number for the super admin',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            help='First name',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            help='Last name',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password (if not provided, will prompt)',
        )
        parser.add_argument(
            '--region',
            type=str,
            help='Region/zone to manage',
        )
        parser.add_argument(
            '--level',
            type=str,
            choices=['NATIONAL', 'STATE', 'REGIONAL'],
            default='REGIONAL',
            help='Admin level (NATIONAL, STATE, or REGIONAL)',
        )
        parser.add_argument(
            '--non-interactive',
            action='store_true',
            help='Run in non-interactive mode',
        )

    def handle(self, *args, **options):
        try:
            # Get user input
            email = options.get('email')
            phone = options.get('phone')
            first_name = options.get('first_name')
            last_name = options.get('last_name')
            password = options.get('password')
            region = options.get('region')
            level = options.get('level')
            non_interactive = options.get('non_interactive')

            # If non-interactive, all fields must be provided
            if non_interactive:
                if not all([email, first_name, last_name, password]):
                    raise CommandError(
                        'In non-interactive mode, you must provide: '
                        '--email, --first-name, --last-name, and --password'
                    )
            else:
                # Interactive mode - prompt for missing fields
                self.stdout.write(self.style.SUCCESS('Creating Super Admin User\n'))
                
                if not email:
                    email = input('Email address: ')
                
                if not first_name:
                    first_name = input('First name: ')
                
                if not last_name:
                    last_name = input('Last name: ')
                
                if not phone:
                    phone = input('Phone number (optional): ') or None
                
                if not region:
                    region = input('Region/zone to manage (optional): ') or None
                
                if not level:
                    level_input = input('Admin level (NATIONAL/STATE/REGIONAL) [REGIONAL]: ') or 'REGIONAL'
                    level = level_input.upper()
                
                if not password:
                    password = getpass.getpass('Password: ')
                    password_confirm = getpass.getpass('Password (again): ')
                    
                    if password != password_confirm:
                        raise CommandError('Passwords do not match')

            # Validate required fields
            if not email or not first_name or not last_name or not password:
                raise CommandError('Email, first name, last name, and password are required')

            # Check if user already exists
            if User.objects.filter(email=email).exists():
                raise CommandError(f'User with email {email} already exists')
            
            if phone and User.objects.filter(phone=phone).exists():
                raise CommandError(f'User with phone {phone} already exists')

            # Create user and super admin profile
            with transaction.atomic():
                # Create user
                user = User.objects.create(
                    email=email,
                    phone=phone,
                    first_name=first_name,
                    last_name=last_name,
                    status='ACTIVE',
                    is_active=True,
                    is_staff=True,
                    is_superuser=True,
                )
                user.set_password(password)
                user.save()

                # Create user role
                UserRole.objects.create(
                    user=user,
                    role_type='SUPER_ADMIN'
                )

                # Create super admin profile
                SuperAdminProfile.objects.create(
                    user=user,
                    admin_level=level,
                    region=region,
                )

            # Success message
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Super Admin created successfully!\n')
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Name: {first_name} {last_name}')
            self.stdout.write(f'Level: {level}')
            if region:
                self.stdout.write(f'Region: {region}')
            self.stdout.write(f'\nUser can now login at: http://localhost:3000/login\n')

        except KeyboardInterrupt:
            self.stdout.write('\n')
            raise CommandError('Operation cancelled by user')
        except Exception as e:
            raise CommandError(f'Error creating super admin: {str(e)}')

