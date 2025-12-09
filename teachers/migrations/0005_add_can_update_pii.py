# Generated migration for adding can_update_pii field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teachers', '0004_add_attendance_class'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacherprofile',
            name='can_update_pii',
            field=models.BooleanField(default=False, help_text='Can update student Personally Identifiable Information'),
        ),
    ]

