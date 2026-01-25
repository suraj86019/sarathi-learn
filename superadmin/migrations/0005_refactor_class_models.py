# Generated manually - Refactor Class models (PostgreSQL compatible)

from django.db import migrations, models, connection
import django.db.models.deletion
import uuid
from django.utils import timezone


def create_default_classes(apps, schema_editor):
    """Create default classes 1-12 using ORM (database agnostic)"""
    Class = apps.get_model('superadmin', 'Class')
    
    default_classes = [
        {'grade_number': 1, 'name': 'Class 1', 'description': 'First Grade'},
        {'grade_number': 2, 'name': 'Class 2', 'description': 'Second Grade'},
        {'grade_number': 3, 'name': 'Class 3', 'description': 'Third Grade'},
        {'grade_number': 4, 'name': 'Class 4', 'description': 'Fourth Grade'},
        {'grade_number': 5, 'name': 'Class 5', 'description': 'Fifth Grade'},
        {'grade_number': 6, 'name': 'Class 6', 'description': 'Sixth Grade'},
        {'grade_number': 7, 'name': 'Class 7', 'description': 'Seventh Grade'},
        {'grade_number': 8, 'name': 'Class 8', 'description': 'Eighth Grade'},
        {'grade_number': 9, 'name': 'Class 9', 'description': 'Ninth Grade'},
        {'grade_number': 10, 'name': 'Class 10', 'description': 'Tenth Grade'},
        {'grade_number': 11, 'name': 'Class 11', 'description': 'Eleventh Grade'},
        {'grade_number': 12, 'name': 'Class 12', 'description': 'Twelfth Grade'},
    ]
    
    for cls_data in default_classes:
        Class.objects.get_or_create(
            grade_number=cls_data['grade_number'],
            defaults={
                'id': uuid.uuid4().hex,
                'name': cls_data['name'],
                'description': cls_data['description'],
                'is_active': True,
            }
        )


def reverse_create_default_classes(apps, schema_editor):
    """Remove default classes"""
    Class = apps.get_model('superadmin', 'Class')
    Class.objects.filter(grade_number__gte=1, grade_number__lte=12).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('superadmin', '0004_add_class_subjects'),
        ('teachers', '0001_initial'),
    ]

    operations = [
        # Create the Class model (template for grades)
        migrations.CreateModel(
            name='Class',
            fields=[
                ('id', models.CharField(default=uuid.uuid4, max_length=32, primary_key=True, serialize=False)),
                ('grade_number', models.IntegerField(unique=True)),
                ('name', models.CharField(max_length=50)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'classes',
                'ordering': ['grade_number'],
            },
        ),
        
        # Create the SchoolClass model (school-specific class instances)
        migrations.CreateModel(
            name='SchoolClass',
            fields=[
                ('id', models.CharField(default=uuid.uuid4, max_length=32, primary_key=True, serialize=False)),
                ('section', models.CharField(blank=True, max_length=10, null=True)),
                ('room_number', models.CharField(blank=True, max_length=20, null=True)),
                ('max_students', models.IntegerField(default=40)),
                ('current_students', models.IntegerField(default=0)),
                ('academic_year', models.CharField(default='2024-2025', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('class_obj', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='school_classes', to='superadmin.class')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='school_classes', to='superadmin.school')),
                ('class_teacher', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_classes', to='teachers.teacherprofile')),
            ],
            options={
                'db_table': 'school_classes',
                'ordering': ['school', 'class_obj__grade_number', 'section'],
                'unique_together': {('school', 'class_obj', 'section', 'academic_year')},
            },
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name='schoolclass',
            index=models.Index(fields=['school'], name='school_classes_school_idx'),
        ),
        migrations.AddIndex(
            model_name='schoolclass',
            index=models.Index(fields=['class_obj'], name='school_classes_class_idx'),
        ),
        
        # Seed default classes
        migrations.RunPython(create_default_classes, reverse_create_default_classes),
    ]
