from django.contrib import admin
from django.urls import path

from portal.views import health, query

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health),
    path("api/query", query),
]
