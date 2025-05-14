from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Tên danh mục
    description = models.TextField()

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"


class Service(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Tên dịch vụ
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='services')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    

class ServicePackage(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=255, unique=True) #tên gói dịch vụ
    description = models.TextField(blank=True) #mô tả gói dịch vụ
    price_min = models.DecimalField(max_digits=10, decimal_places=0)  # Giá tối thiểu
    price_max = models.DecimalField(max_digits=10, decimal_places=0) 
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.service.name}"


class AdditionalService(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Ví dụ: "Nấu ăn", "Giặt đồ"
    description = models.TextField(blank=True)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
class Promotion(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('Phần trăm', 'Phần trăm'),
        ('Số tiền', 'Số tiền'),
    )
    promotion_code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='Phần trăm')
    discount_value = models.DecimalField(max_digits=10, decimal_places=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    usage_limit = models.IntegerField(default=1)  # Số lần sử dụng tối đa
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_valid(self):
        now = timezone.now()
        return (self.is_active and
                self.start_date <= now <= self.end_date and
                self.usage_limit > 0)

    def __str__(self):
        return self.promotion_code

    class Meta:
        verbose_name = "Promotion"
        verbose_name_plural = "Promotions"
        ordering = ['-start_date']


class ServiceBooking(models.Model):
    
    # Thông tin tổng thể của booking
    customer = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='bookings')  
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')

    #Thời gian và địa điểm
    booking_date = models.DateField()
    booking_time = models.TimeField()
    address = models.TextField()

    #Tổng tiền và thanh toán
    sub_total = models.DecimalField(max_digits=10, decimal_places=0)
    promotion = models.ForeignKey(Promotion, on_delete=models.SET_NULL, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    total_amount_after_discount = models.DecimalField(max_digits=10, decimal_places=0)

    #Trạng thái booking
    STATUS_CHOICES = (
        ('Đang chờ', 'Đang chờ'),
        ('Đã xác nhận', 'Đã xác nhận'),
        ('Đang thực hiện', 'Đang thực hiện'),
        ('Hoàn thành', 'Hoàn thành'),
        ('Hủy bỏ', 'Hủy bỏ'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('Chưa thanh toán', 'Chưa thanh toán'),
        ('Đã thanh toán', 'Đã thanh toán'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('Tiền mặt', 'Tiền mặt'),
        ('Chuyển khoản', 'Chuyển khoản'),
        ('Ví điện tử', 'Ví điện tử'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Đang chờ')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Chưa thanh toán')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='Tiền mặt')

    #Thông tin hệ thống
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class ServiceBookingDetail(models.Model):
    booking = models.ForeignKey(ServiceBooking, on_delete=models.CASCADE, related_name='details')
    package = models.ForeignKey(ServicePackage, on_delete=models.CASCADE, related_name='booking_details')
    additional_services = models.ManyToManyField(AdditionalService, blank=True, related_name='booking_details')
    total_price = models.DecimalField(max_digits=10, decimal_places=0)
    note = models.TextField(blank=True)
    
    def __str__(self):
        return f'ServiceBookingDetail for {self.booking.id}'
    

class Feedback(models.Model):
    # Thông tin phản hồi
    customer = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='feedbacks')
    booking = models.ForeignKey(ServiceBooking, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.IntegerField(default=0)  # Đánh giá từ 1 đến 5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Feedback for {self.booking.id}'
    
    

    