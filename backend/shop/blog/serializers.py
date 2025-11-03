from rest_framework import serializers
from .models import Post, Category, Comment
from django.contrib.auth import get_user_model

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only = True)
   
    class Meta:
        model = Comment
        fields = ['id', 'author', 'body', 'created_at', 'approved']
        read_only_fields = ['id', 'created_at', 'author', 'approved']


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

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'author',
            'category', 'category_id', 'published',
            'created_at', 'updated_at', 'comments',
            'is_liked', 'likes_count'
        ]
        read_only_fields = [
            'id', 'slug', 'author', 'created_at',
            'updated_at', 'comments', 'is_liked', 'likes_count'
        ]

    def get_is_liked(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and obj.likes.filter(id=user.id).exists()

    def get_likes_count(self, obj):
        return obj.likes.count()

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('author', None)  
        return super().update(instance, validated_data)
