from django.contrib import admin

from .models import Checkin, OrganizerProfile, ParticipantProfile, Team, TeamMember, Track, User

admin.site.register(User)
admin.site.register(ParticipantProfile)
admin.site.register(OrganizerProfile)
admin.site.register(Track)
admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(Checkin)
