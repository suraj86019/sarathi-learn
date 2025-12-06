"""
Django management command to create 30 test schools
Usage: python manage.py create_test_schools
"""

from django.core.management.base import BaseCommand
from superadmin.models import School
import random


class Command(BaseCommand):
    help = 'Create 30 test schools with realistic data'

    def handle(self, *args, **options):
        # Indian states
        states = [
            'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh',
            'West Bengal', 'Gujarat', 'Rajasthan', 'Kerala', 'Punjab',
            'Haryana', 'Bihar', 'Madhya Pradesh', 'Andhra Pradesh', 'Telangana'
        ]
        
        # School name templates
        school_names = [
            'Government High School', 'Kendriya Vidyalaya', 'Jawahar Navodaya Vidyalaya',
            'Government Senior Secondary School', 'Model School', 'Public School',
            'Government Girls High School', 'Government Boys High School',
            'Central School', 'State Board School'
        ]
        
        # Cities by state
        cities = {
            'Delhi': ['Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
            'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
            'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
            'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
            'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut'],
            'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
            'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
            'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
            'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
            'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
            'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
            'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
            'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
            'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
            'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam']
        }
        
        # Boards
        boards = ['CBSE', 'ICSE', 'State Board']
        
        # Plan types
        plans = ['BASIC', 'STANDARD', 'PREMIUM']
        
        created_count = 0
        skipped_count = 0

        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('Creating 30 Test Schools'))
        self.stdout.write('='*70 + '\n')

        for i in range(1, 31):
            # Generate UDISE code (11 digits)
            udise_code = f"{random.randint(10, 99)}{random.randint(10000000, 99999999):08d}"
            
            # Check if UDISE code already exists
            if School.objects.filter(udise_code=udise_code).exists():
                skipped_count += 1
                continue
            
            # Select state and city
            state = random.choice(states)
            city = random.choice(cities[state])
            
            # Generate school name
            school_name = f"{random.choice(school_names)} {city} {i}"
            
            # Create school
            school = School.objects.create(
                name=school_name,
                udise_code=udise_code,
                contact_email=f"school{i}@{city.lower().replace(' ', '')}.edu.in",
                contact_phone=f"+91{random.randint(7000000000, 9999999999)}",
                principal_name=f"Principal {random.choice(['Kumar', 'Singh', 'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer'])}",
                address=f"{random.randint(1, 999)} Main Road, {city}",
                city=city,
                district=city,
                state=state,
                pincode=f"{random.randint(100000, 999999)}",
                board=random.choice(boards),
                status=random.choice(['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING']),  # 75% active
                plan_type=random.choice(plans),
                ai_quota_limit=random.choice([50000, 100000, 200000, 500000]),
                ai_quota_used=random.randint(0, 50000),
                total_students=random.randint(100, 1000),
                total_teachers=random.randint(10, 100),
                total_admins=random.randint(1, 5)
            )
            
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ {created_count}. {school.name} ({school.udise_code}) - {school.state}'
                )
            )

        # Summary
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('Summary:'))
        self.stdout.write('='*70)
        self.stdout.write(f'  Created: {created_count}')
        self.stdout.write(f'  Skipped: {skipped_count}')
        self.stdout.write(f'  Total Schools in DB: {School.objects.count()}')
        self.stdout.write('='*70 + '\n')
        
        self.stdout.write(self.style.SUCCESS('✓ Test schools creation complete!\n'))

