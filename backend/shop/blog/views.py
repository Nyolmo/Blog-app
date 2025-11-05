from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, ScopedRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.text import slugify

from .models import Post, Category, Comment
from .serializers import PostSerializer, CategorySerializer, CommentSerializer
from .permissions import IsAuthorOrReadOnly

# ✅ Optional: you can define custom pagination globally in settings.py,
# or per-view using PageNumberPagination if you want per-page control.


# ---------------------------
# CATEGORY VIEWSET
# ---------------------------
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for listing and retrieving post categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = []  # Public access (categories are visible to everyone)


# ---------------------------
# POST VIEWSET
# ---------------------------
class PostViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for blog posts + custom actions:
    - Add comment
    - Toggle like
    - Get post comments
    """
    queryset = Post.objects.select_related('author', 'category').prefetch_related('comments').all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # ✅ Filtering & ordering configuration
    search_fields = ['title', 'content', 'author__username', 'category__name']
    ordering_fields = ['created_at', 'updated_at', 'likes_count']
    ordering = ['-created_at']
    lookup_field = 'slug'  # Use slug instead of numeric ID for clean URLs

    # ✅ Enhancement 1: Auto-generate unique slugs on create
    def perform_create(self, serializer):
        base_slug = slugify(serializer.validated_data['title'])
        slug = base_slug
        counter = 1
        while Post.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        serializer.save(author=self.request.user, slug=slug)

    # ✅ Enhancement 2: Cached or optimized list queries could be added here later

    # ✅ Enhancement 3: Add a comment to a post (authenticated or guest)
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly],
            throttle_classes=[ScopedRateThrottle])
    def add_comment(self, request, pk=None):
        """
        Adds a new comment to the given post.
        - Authenticated users → author is saved.
        - Anonymous users → author=None (optional).
        """
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(
                post=post,
                author=request.user if request.user.is_authenticated else None
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Enhancement 4: Toggle Like on a post
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated],
            throttle_classes=[UserRateThrottle])
    def toggle_like(self, request, pk=None):
        """
        Toggles the like state for the logged-in user on a post.
        Returns updated like count and status.
        """
        post = self.get_object()
        user = request.user

        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True

        # ✅ Enhancement: return updated like count
        return Response({
            'liked': liked,
            'likes_count': post.likes.count()
        }, status=status.HTTP_200_OK)

    # ✅ Enhancement 5: Get approved comments for a post (paginated)
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        Retrieve all approved comments for a specific post.
        """
        post = self.get_object()
        comments = post.comments.filter(approved=True).select_related('author')

        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = CommentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


# ---------------------------
# COMMENT VIEWSET
# ---------------------------
class CommentViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for comments.
    Includes search, filter, and soft delete in the future.
    """
    queryset = Comment.objects.select_related('post', 'author').all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['post', 'approved']
    search_fields = ['body', 'author__username']

    # ✅ Enhancement 6: Soft delete option
    def perform_destroy(self, instance):
        """
        Instead of permanently deleting a comment,
        you could mark it as deleted for moderation purposes.
        """
        # Uncomment below to enable soft delete:
        # instance.deleted = True
        # instance.save()
        # return Response({'status': 'comment marked as deleted'})
        instance.delete()  # Currently performs hard delete
