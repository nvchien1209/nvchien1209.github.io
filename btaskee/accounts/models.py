from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


# Create your models here.
class CustomUser(AbstractUser):
    # Giữ lại username, password, email từ AbstractUser
    # Điều chỉnh email để bắt buộc và duy nhất
    email = models.EmailField(_('email address'), unique=True)
    # Thêm số điện thoại
    phone = models.CharField(_('phone number'), max_length=15, blank=True)
     # Thêm trường avatar (ảnh đại diện)
    avatar = models.ImageField(upload_to='profiles/', null=True, blank=True)
    # Trường created_at (thời gian tạo tài khoản)
    created_at = models.DateTimeField(default=timezone.now)

    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)

    SEX_CHOICES = (
        ('Nam', 'Nam'),
        ('Nữ', 'Nữ'),
        ('Khác', 'Khác'),
    )
    sex = models.CharField(_('sex'), max_length=10, choices=SEX_CHOICES, default='Khác', blank=True)

    # Vai trò người dùng (admin, customer)
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('customer', 'Customer'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')

    # Thông tin cho customer dashboard
    total_bookings = models.IntegerField(default=0)
    reward_points = models.IntegerField(default=0)

    # Cấp độ thành viên
    MEMBERSHIP_CHOICES = (
        ('Đồng', 'Đồng'),
        ('Bạc', 'Bạc'),
        ('Vàng', 'Vàng'),
        ('Kim cương', 'Kim cương'),
    )
    membership = models.CharField(max_length=10, choices=MEMBERSHIP_CHOICES, default='Đồng')

    # Tùy chỉnh các trường hiển thị
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.username
    
    def save(self, *args, **kwargs):
        if self.reward_points   >= 250:
            self.membership = 'Kim cương'
        elif self.reward_points >= 100:
            self.membership = 'Vàng'
        elif self.reward_points >= 50:
            self.membership = 'Bạc'
        else:
            self.membership = 'Đồng'
        super().save(*args, **kwargs)