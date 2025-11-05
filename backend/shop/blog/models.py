from django.db import models
from django.conf import settings
from django.utils.text import slugify

# -------------------------
# 🗂️ CATEGORY MODEL
# -------------------------
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    def save(self, *args, **kwargs):
        # Automatically generate slug from name if not provided
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"


# -------------------------
# 📰 POST MODEL
# -------------------------
class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name='posts', on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    category = models.ForeignKey(
        Category, related_name='posts', on_delete=models.SET_NULL, null=True, blank=True
    )
    content = models.TextField()
    image = models.ImageField(
        upload_to='post_images/', null=True, blank=True
    )  # 🖼️ NEW: allows optional image uploads

    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    view_count = models.PositiveIntegerField(default=0)
    likes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True
    )

    def save(self, *args, **kwargs):
        # Automatically generate unique slug from title
        if not self.slug:
            base = slugify(self.title)[:200]
            slug = base
            i = 1
            while Post.objects.filter(slug=slug).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_image_url(self):
        """✅ Return full image URL if available"""
        if self.image:
            return self.image.url
        return None

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


# -------------------------
# 💬 COMMENT MODEL
# -------------------------
class Comment(models.Model):
    post = models.ForeignKey(
        Post, related_name='comments', on_delete=models.CASCADE
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='comments',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.author} on {self.post}"
