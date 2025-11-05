# 📁 project/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view

# 🧩 Optional: browsable API schema (useful for testing endpoints)
schema_view = get_schema_view(title="Blog API")

urlpatterns = [
    # 🛠 Admin Panel
    path("admin/", admin.site.urls),

    # 📰 Main Blog API routes (from blog/urls.py)
    path("api/", include("blog.urls")),

    # 🔐 JWT Authentication endpoints
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # 📄 Optional: DRF API schema & documentation (for debugging or frontend devs)
    path("api/schema/", schema_view, name="api-schema"),
]

# 🖼️ Serve uploaded media files during development
# (e.g., post images uploaded via PostSerializer)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
