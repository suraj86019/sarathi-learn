"""
Django management command to initialize default subjects
Usage: python manage.py init_subjects
"""

from django.core.management.base import BaseCommand
from superadmin.models import Subject


class Command(BaseCommand):
    help = 'Initialize default subjects in the database'

    def handle(self, *args, **options):
        # Define default subjects
        subjects_data = [
            # Core Subjects
            {'name': 'Mathematics', 'code': 'MATH', 'category': 'CORE', 'description': 'Mathematics and numerical skills'},
            {'name': 'Science', 'code': 'SCI', 'category': 'CORE', 'description': 'General Science'},
            {'name': 'Physics', 'code': 'PHY', 'category': 'CORE', 'description': 'Physics'},
            {'name': 'Chemistry', 'code': 'CHEM', 'category': 'CORE', 'description': 'Chemistry'},
            {'name': 'Biology', 'code': 'BIO', 'category': 'CORE', 'description': 'Biology and Life Sciences'},
            {'name': 'English', 'code': 'ENG', 'category': 'CORE', 'description': 'English Language and Literature'},
            {'name': 'Hindi', 'code': 'HIN', 'category': 'CORE', 'description': 'Hindi Language and Literature'},
            {'name': 'Social Studies', 'code': 'SST', 'category': 'CORE', 'description': 'Social Studies'},
            {'name': 'History', 'code': 'HIST', 'category': 'CORE', 'description': 'History'},
            {'name': 'Geography', 'code': 'GEO', 'category': 'CORE', 'description': 'Geography'},
            {'name': 'Civics', 'code': 'CIV', 'category': 'CORE', 'description': 'Civics and Political Science'},
            {'name': 'Economics', 'code': 'ECO', 'category': 'CORE', 'description': 'Economics'},
            
            # Languages
            {'name': 'Sanskrit', 'code': 'SAN', 'category': 'ELECTIVE', 'description': 'Sanskrit Language'},
            {'name': 'French', 'code': 'FRE', 'category': 'ELECTIVE', 'description': 'French Language'},
            {'name': 'German', 'code': 'GER', 'category': 'ELECTIVE', 'description': 'German Language'},
            {'name': 'Regional Language', 'code': 'REG', 'category': 'ELECTIVE', 'description': 'Regional/State Language'},
            
            # Electives
            {'name': 'Computer Science', 'code': 'CS', 'category': 'ELECTIVE', 'description': 'Computer Science and Programming'},
            {'name': 'Information Technology', 'code': 'IT', 'category': 'ELECTIVE', 'description': 'Information Technology'},
            {'name': 'Commerce', 'code': 'COM', 'category': 'ELECTIVE', 'description': 'Commerce and Business Studies'},
            {'name': 'Accountancy', 'code': 'ACC', 'category': 'ELECTIVE', 'description': 'Accountancy'},
            {'name': 'Business Studies', 'code': 'BS', 'category': 'ELECTIVE', 'description': 'Business Studies'},
            {'name': 'Psychology', 'code': 'PSY', 'category': 'ELECTIVE', 'description': 'Psychology'},
            {'name': 'Sociology', 'code': 'SOC', 'category': 'ELECTIVE', 'description': 'Sociology'},
            {'name': 'Philosophy', 'code': 'PHI', 'category': 'ELECTIVE', 'description': 'Philosophy'},
            
            # Vocational
            {'name': 'Arts & Crafts', 'code': 'ART', 'category': 'VOCATIONAL', 'description': 'Arts and Crafts'},
            {'name': 'Home Science', 'code': 'HS', 'category': 'VOCATIONAL', 'description': 'Home Science'},
            {'name': 'Agriculture', 'code': 'AGR', 'category': 'VOCATIONAL', 'description': 'Agriculture'},
            {'name': 'Entrepreneurship', 'code': 'ENT', 'category': 'VOCATIONAL', 'description': 'Entrepreneurship'},
            
            # Extra-Curricular
            {'name': 'Physical Education', 'code': 'PE', 'category': 'EXTRA_CURRICULAR', 'description': 'Physical Education and Sports'},
            {'name': 'Music', 'code': 'MUS', 'category': 'EXTRA_CURRICULAR', 'description': 'Music'},
            {'name': 'Dance', 'code': 'DAN', 'category': 'EXTRA_CURRICULAR', 'description': 'Dance'},
            {'name': 'Drama', 'code': 'DRA', 'category': 'EXTRA_CURRICULAR', 'description': 'Drama and Theatre'},
            {'name': 'Yoga', 'code': 'YOG', 'category': 'EXTRA_CURRICULAR', 'description': 'Yoga and Meditation'},
        ]

        created_count = 0
        updated_count = 0
        skipped_count = 0

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('Initializing Subjects'))
        self.stdout.write('='*60 + '\n')

        for subject_data in subjects_data:
            try:
                subject, created = Subject.objects.get_or_create(
                    code=subject_data['code'],
                    defaults=subject_data
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created: {subject.name} ({subject.code}) - {subject.category}')
                    )
                else:
                    # Update existing subject
                    updated = False
                    for key, value in subject_data.items():
                        if getattr(subject, key) != value:
                            setattr(subject, key, value)
                            updated = True
                    
                    if updated:
                        subject.save()
                        updated_count += 1
                        self.stdout.write(
                            self.style.WARNING(f'↻ Updated: {subject.name} ({subject.code})')
                        )
                    else:
                        skipped_count += 1
                        self.stdout.write(
                            f'  Exists: {subject.name} ({subject.code})'
                        )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error creating {subject_data["name"]}: {str(e)}')
                )

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('Summary:'))
        self.stdout.write('='*60)
        self.stdout.write(f'  Created: {created_count}')
        self.stdout.write(f'  Updated: {updated_count}')
        self.stdout.write(f'  Skipped: {skipped_count}')
        self.stdout.write(f'  Total: {created_count + updated_count + skipped_count}')
        self.stdout.write('='*60 + '\n')
        
        self.stdout.write(self.style.SUCCESS('✓ Subject initialization complete!\n'))



