from django.urls import path
from . import views
urlpatterns = [
    path('register/', views.register_view, name='register'),  
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),  # Trang cá nhân
    path('profile/change-password/', views.change_password, name='change_password'),  # đổi mật khẩu
    path('profile/update-avatar/', views.update_avatar, name='update_avatar'),  # cập nhật avatar
]
