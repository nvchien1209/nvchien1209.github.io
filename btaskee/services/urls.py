from django.urls import path
from . import views
urlpatterns = [
    path('', views.home_view, name='home'),  # Trang chủ
    path('news/', views.news_view, name='news'),  # Trang tin tức
    path('news/news01/', views.news1_detail, name='news1_detail'),  # Chi tiết tin tức 1
    path('job/', views.job_view, name='job'),  # Trang việc làm
    path('about/', views.about_view, name='about'),  # Trang giới thiệu
    path('service/<int:service_id>/', views.service_detail, name='service_detail'),  # Trang dịch vụ 
    path('api/check-promotion/', views.check_promotion_code, name='check_promotion'), # Kiểm tra mã giảm giá
    path('api/create-booking/', views.create_booking, name='create_booking'), # Tạo booking
    path('history/', views.booking_history, name='booking_history'),  # Lịch sử đặt dịch vụ
    path('booking/destroy-booking/<int:booking_id>', views.destroy_booking, name="destroy_booking"), 
    path('booking/rate', views.rate_booking, name="rate_booking"),
    path('booking/filter-booking', views.filter_history, name="filter_history"),
    path('initiate/<int:booking_id>/', views.initiate_payment, name='initiate_payment'),
    path('payment_return/', views.vnpay_return, name='vnpay_return'),
    # path('history/', views.payment_history, name='payment_history'),
    ]