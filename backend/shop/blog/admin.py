from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Category, Post, Comment

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = []
    list_filter = []

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'published', 'created_at', 'view_count']
    search_fields = ['title', 'content', 'author__username']
    list_filter = ['published', 'category', 'created_at']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'view_count']
    autocomplete_fields = ['author', 'category']
    fields = ['title', 'slug', 'author', 'category', 'content', 'published', 'view_count', 'likes']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['post', 'author', 'approved', 'created_at']
    search_fields = ['body', 'author__username']
    list_filter = ['approved', 'created_at']
    readonly_fields = ['created_at']
    autocomplete_fields = ['author', 'post']