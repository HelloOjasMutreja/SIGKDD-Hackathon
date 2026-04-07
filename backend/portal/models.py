from django.db import models


class User(models.Model):
    ROLE_CHOICES = [
        ("PARTICIPANT", "Participant"),
        ("ORGANIZER", "Organizer"),
        ("ADMIN", "Admin"),
    ]

    email = models.EmailField(unique=True)
    fullName = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, null=True, blank=True)
    passwordHash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="PARTICIPANT")
    createdAt = models.DateTimeField(auto_now_add=True)


class ParticipantProfile(models.Model):
    user = models.OneToOneField(User, related_name="participant", on_delete=models.CASCADE)
    registerNumber = models.CharField(max_length=15, unique=True)
    graduationYear = models.IntegerField()
    college = models.CharField(max_length=255)
    department = models.CharField(max_length=255)


class OrganizerProfile(models.Model):
    REQUESTED_ROLE_CHOICES = [
        ("CORE_ORGANIZER", "Core Organizer"),
        ("TECHNICAL_LEAD", "Technical Lead"),
        ("LOGISTICS", "Logistics"),
        ("VOLUNTEER", "Volunteer"),
        ("PR_MARKETING", "PR & Marketing"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    user = models.OneToOneField(User, related_name="organizerProfile", on_delete=models.CASCADE)
    requestedRole = models.CharField(max_length=32, choices=REQUESTED_ROLE_CHOICES)
    approvedRole = models.CharField(max_length=32, choices=REQUESTED_ROLE_CHOICES, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    rejectionReason = models.TextField(null=True, blank=True)
    reasonForJoining = models.TextField()
    approvedBy = models.ForeignKey(User, related_name="approvedOrganizers", on_delete=models.SET_NULL, null=True, blank=True)
    approvedAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)


class Track(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    isActive = models.BooleanField(default=True)
    createdBy = models.ForeignKey(User, related_name="createdTracks", on_delete=models.PROTECT)
    createdAt = models.DateTimeField(auto_now_add=True)


class Team(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("SUBMITTED", "Submitted"),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=6, unique=True)
    leader = models.ForeignKey(User, related_name="leadTeams", on_delete=models.PROTECT)
    track = models.ForeignKey(Track, related_name="teams", on_delete=models.SET_NULL, null=True, blank=True)
    projectName = models.CharField(max_length=255, null=True, blank=True)
    projectDescription = models.TextField(null=True, blank=True)
    techStack = models.TextField(null=True, blank=True)
    githubLink = models.URLField(null=True, blank=True)
    demoLink = models.URLField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    qrToken = models.CharField(max_length=255, unique=True, null=True, blank=True)
    qrCodeUrl = models.TextField(null=True, blank=True)
    submittedAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)


class TeamMember(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    team = models.ForeignKey(Team, related_name="members", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="memberships", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    requestedAt = models.DateTimeField(auto_now_add=True)
    respondedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("team", "user")


class Checkin(models.Model):
    team = models.ForeignKey(Team, related_name="checkins", on_delete=models.CASCADE)
    checkedInBy = models.ForeignKey(User, related_name="checkinsDone", on_delete=models.PROTECT)
    checkedInAt = models.DateTimeField(auto_now_add=True)
