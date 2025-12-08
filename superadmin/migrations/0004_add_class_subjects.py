from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('superadmin', '0003_add_announcement_target'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClassSubject',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('is_core', models.BooleanField(default=True)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('class_obj', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='class_subjects', to='superadmin.class')),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='class_subjects', to='superadmin.subject')),
            ],
            options={
                'db_table': 'class_subjects',
                'verbose_name': 'Class Subject',
                'verbose_name_plural': 'Class Subjects',
                'ordering': ['class_obj', 'display_order', 'subject'],
                'unique_together': {('class_obj', 'subject')},
            },
        ),
        migrations.AddField(
            model_name='class',
            name='subjects',
            field=models.ManyToManyField(blank=True, help_text='Subjects offered in this class', related_name='classes', through='superadmin.ClassSubject', to='superadmin.subject'),
        ),
        migrations.AddIndex(
            model_name='classsubject',
            index=models.Index(fields=['class_obj', 'subject'], name='class_subject_class_subj_6fb28d_idx'),
        ),
        migrations.AddIndex(
            model_name='classsubject',
            index=models.Index(fields=['subject'], name='class_subject_subject__caa0b0_idx'),
        ),
    ]

