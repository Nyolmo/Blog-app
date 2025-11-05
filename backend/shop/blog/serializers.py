from rest_framework import serializers
from .models import Post, Category, Comment
from django.contrib.auth import get_user_model

User = get_user_model()


# -------------------------
# 🗂️ CATEGORY SERIALIZER
# -------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


# -------------------------
# 💬 COMMENT SERIALIZER
# -------------------------
class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)  # shows username instead of ID

    class Meta:
        model = Comment
        fields = ['id', 'author', 'body', 'created_at', 'approved']
        read_only_fields = ['id', 'created_at', 'author', 'approved']


# -------------------------
# 📰 POST SERIALIZER (Main)
# -------------------------
class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        write_only=True,
        source='category'
    )

    comments = CommentSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()

    # ✅ Image fields
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'author',
            'category', 'category_id', 'published',
            'created_at', 'updated_at',
            'comments', 'is_liked', 'likes_count',
            'image', 'image_url',  # ✅ added image support
        ]
        read_only_fields = [
            'id', 'slug', 'author', 'created_at',
            'updated_at', 'comments', 'is_liked', 'likes_count', 'image_url'
        ]

    # ✅ Return whether the current user has liked the post
    def get_is_liked(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and obj.likes.filter(id=user.id).exists()

    # ✅ Return total number of likes
    def get_likes_count(self, obj):
        return obj.likes.count()

    # ✅ Return full image URL
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    # ✅ Ensure post author is always the logged-in user
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

    # ✅ Prevent author from being changed accidentally
    def update(self, instance, validated_data):
        validated_data.pop('author', None)
        return super().update(instance, validated_data)
