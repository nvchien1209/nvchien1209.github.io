from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'membership']
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Information', {'fields': ('phone', 'date_of_birth', 'avatar', 'role', 'total_bookings', 'sex', 'reward_points', 'membership')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)