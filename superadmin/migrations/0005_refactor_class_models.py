# Generated manually - Placeholder migration for class model refactoring
# The actual refactoring is done in migration 0006
# This migration is kept as a no-op to maintain migration history

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('superadmin', '0004_add_class_subjects'),
        ('teachers', '0001_initial'),
    ]

    operations = [
        # No operations - the Class model already exists from 0001_initial
        # The refactoring (adding SchoolClass, modifying Class) is done in 0006
    ]
