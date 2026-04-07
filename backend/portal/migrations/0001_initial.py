from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("fullName", models.CharField(max_length=255)),
                ("phone", models.CharField(blank=True, max_length=32, null=True)),
                ("passwordHash", models.CharField(max_length=255)),
                ("role", models.CharField(choices=[("PARTICIPANT", "Participant"), ("ORGANIZER", "Organizer"), ("ADMIN", "Admin")], default="PARTICIPANT", max_length=20)),
                ("createdAt", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Track",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField()),
                ("isActive", models.BooleanField(default=True)),
                ("createdAt", models.DateTimeField(auto_now_add=True)),
                ("createdBy", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="createdTracks", to="portal.user")),
            ],
        ),
        migrations.CreateModel(
            name="ParticipantProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("registerNumber", models.CharField(max_length=15, unique=True)),
                ("graduationYear", models.IntegerField()),
                ("college", models.CharField(max_length=255)),
                ("department", models.CharField(max_length=255)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="participant", to="portal.user")),
            ],
        ),
        migrations.CreateModel(
            name="OrganizerProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("requestedRole", models.CharField(choices=[("CORE_ORGANIZER", "Core Organizer"), ("TECHNICAL_LEAD", "Technical Lead"), ("LOGISTICS", "Logistics"), ("VOLUNTEER", "Volunteer"), ("PR_MARKETING", "PR & Marketing")], max_length=32)),
                ("approvedRole", models.CharField(blank=True, choices=[("CORE_ORGANIZER", "Core Organizer"), ("TECHNICAL_LEAD", "Technical Lead"), ("LOGISTICS", "Logistics"), ("VOLUNTEER", "Volunteer"), ("PR_MARKETING", "PR & Marketing")], max_length=32, null=True)),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], default="PENDING", max_length=20)),
                ("rejectionReason", models.TextField(blank=True, null=True)),
                ("reasonForJoining", models.TextField()),
                ("approvedAt", models.DateTimeField(blank=True, null=True)),
                ("createdAt", models.DateTimeField(auto_now_add=True)),
                ("approvedBy", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="approvedOrganizers", to="portal.user")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="organizerProfile", to="portal.user")),
            ],
        ),
        migrations.CreateModel(
            name="Team",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("code", models.CharField(max_length=6, unique=True)),
                ("projectName", models.CharField(blank=True, max_length=255, null=True)),
                ("projectDescription", models.TextField(blank=True, null=True)),
                ("techStack", models.TextField(blank=True, null=True)),
                ("githubLink", models.URLField(blank=True, null=True)),
                ("demoLink", models.URLField(blank=True, null=True)),
                ("status", models.CharField(choices=[("DRAFT", "Draft"), ("SUBMITTED", "Submitted")], default="DRAFT", max_length=20)),
                ("qrToken", models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ("qrCodeUrl", models.TextField(blank=True, null=True)),
                ("submittedAt", models.DateTimeField(blank=True, null=True)),
                ("createdAt", models.DateTimeField(auto_now_add=True)),
                ("leader", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="leadTeams", to="portal.user")),
                ("track", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="teams", to="portal.track")),
            ],
        ),
        migrations.CreateModel(
            name="TeamMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], default="PENDING", max_length=20)),
                ("requestedAt", models.DateTimeField(auto_now_add=True)),
                ("respondedAt", models.DateTimeField(blank=True, null=True)),
                ("team", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="members", to="portal.team")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="portal.user")),
            ],
            options={"unique_together": {("team", "user")}},
        ),
        migrations.CreateModel(
            name="Checkin",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("checkedInAt", models.DateTimeField(auto_now_add=True)),
                ("checkedInBy", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="checkinsDone", to="portal.user")),
                ("team", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="checkins", to="portal.team")),
            ],
        ),
    ]
