# Generated manually - Refactor Class models

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('superadmin', '0004_add_class_subjects'),
        ('teachers', '0001_initial'),
    ]

    operations = [
        # Step 1: Rename old classes table to keep data
        migrations.RunSQL(
            sql="ALTER TABLE classes RENAME TO school_classes_old;",
            reverse_sql="ALTER TABLE school_classes_old RENAME TO classes;",
        ),
        
        # Step 2: Create new classes table (template)
        migrations.RunSQL(
            sql="""
            CREATE TABLE classes (
                id char(32) NOT NULL PRIMARY KEY,
                grade_number INTEGER NOT NULL UNIQUE,
                name varchar(50) NOT NULL,
                description TEXT,
                is_active bool NOT NULL DEFAULT 1,
                created_at datetime NOT NULL,
                updated_at datetime NOT NULL
            );
            """,
            reverse_sql="DROP TABLE IF EXISTS classes;",
        ),
        
        # Step 3: Create school_classes table (mapping)
        migrations.RunSQL(
            sql="""
            CREATE TABLE school_classes (
                id char(32) NOT NULL PRIMARY KEY,
                school_id char(32) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                class_obj_id char(32) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                section varchar(10),
                class_teacher_id char(32) REFERENCES teachers_teacherprofile(id) ON DELETE SET NULL,
                room_number varchar(20),
                max_students INTEGER NOT NULL DEFAULT 40,
                current_students INTEGER NOT NULL DEFAULT 0,
                academic_year varchar(20) NOT NULL DEFAULT '2024-2025',
                is_active bool NOT NULL DEFAULT 1,
                created_at datetime NOT NULL,
                updated_at datetime NOT NULL,
                UNIQUE(school_id, class_obj_id, section, academic_year)
            );
            """,
            reverse_sql="DROP TABLE IF EXISTS school_classes;",
        ),
        
        # Step 4: Create indexes for school_classes
        migrations.RunSQL(
            sql="""
            CREATE INDEX school_classes_school_id ON school_classes(school_id);
            CREATE INDEX school_classes_class_obj_id ON school_classes(class_obj_id);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS school_classes_school_id;
            DROP INDEX IF EXISTS school_classes_class_obj_id;
            """,
        ),
        
        # Step 5: Seed default classes (1-12)
        migrations.RunSQL(
            sql="""
            INSERT INTO classes (id, grade_number, name, description, is_active, created_at, updated_at) VALUES
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 1, 'Class 1', 'First Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 2, 'Class 2', 'Second Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 3, 'Class 3', 'Third Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 4, 'Class 4', 'Fourth Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 5, 'Class 5', 'Fifth Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 6, 'Class 6', 'Sixth Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 7, 'Class 7', 'Seventh Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 8, 'Class 8', 'Eighth Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 9, 'Class 9', 'Ninth Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 10, 'Class 10', 'Tenth Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 11, 'Class 11', 'Eleventh Grade', 1, DATETIME('now'), DATETIME('now')),
            (REPLACE(LOWER(HEX(RANDOMBLOB(16))), '-', ''), 12, 'Class 12', 'Twelfth Grade', 1, DATETIME('now'), DATETIME('now'));
            """,
            reverse_sql="DELETE FROM classes WHERE grade_number BETWEEN 1 AND 12;",
        ),
    ]

