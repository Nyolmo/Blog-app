# blog/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from .views import PostViewSet, CommentViewSet, CategoryViewSet

# Create router for automatic URL registration of API viewsets
router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"categories", CategoryViewSet, basename="category")

# =========================
# Swagger & ReDoc Docs Setup
# =========================
schema_view = get_schema_view(
    openapi.Info(
        title="Blog API",
        default_version="v1",
        description="This is the interactive documentation for your Blog API endpoints. "
                    "You can test each route directly here without using Postman.",
        contact=openapi.Contact(email="support@blogapi.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),  # Anyone can view API docs
)

# =========================
# URL Patterns
# =========================
urlpatterns = [
    # All REST API endpoints (posts, comments, etc.)
    path("", include(router.urls)),

    # Swagger UI (modern interactive documentation)
    path("docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),

    # ReDoc UI (clean documentation alternative)
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
