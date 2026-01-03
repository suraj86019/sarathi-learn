# Generated migration for adding StudentTask model

from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('teachers', '0005_add_can_update_pii'),
        ('students', '0001_initial'),
        ('superadmin', '0005_refactor_class_models'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentTask',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('task_type', models.CharField(choices=[('TASK', 'Task'), ('NOTE', 'Note'), ('REMINDER', 'Reminder'), ('HOMEWORK', 'Homework'), ('FOLLOWUP', 'Follow-up')], default='TASK', max_length=20)),
                ('priority', models.CharField(choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('URGENT', 'Urgent')], default='MEDIUM', max_length=10)),
                ('status', models.CharField(choices=[('OPEN', 'Open'), ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed'), ('CLOSED', 'Closed')], default='OPEN', max_length=20)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_student_tasks', to='teachers.teacherprofile')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_tasks', to='superadmin.school')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_tasks', to='students.studentprofile')),
            ],
            options={
                'verbose_name': 'Student Task',
                'verbose_name_plural': 'Student Tasks',
                'db_table': 'student_tasks',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='studenttask',
            index=models.Index(fields=['student', 'status'], name='student_tas_student_9e8e99_idx'),
        ),
        migrations.AddIndex(
            model_name='studenttask',
            index=models.Index(fields=['created_by', '-created_at'], name='student_tas_created_1d4c95_idx'),
        ),
        migrations.AddIndex(
            model_name='studenttask',
            index=models.Index(fields=['school', 'status'], name='student_tas_school__f9a8f5_idx'),
        ),
    ]





