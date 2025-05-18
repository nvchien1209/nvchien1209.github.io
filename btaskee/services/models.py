from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import datetime
from django.utils import timezone

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
    payment_code = models.CharField(max_length=50, blank=True)  # Mã thanh toán (nếu có)
    date_paid = models.DateField(null=True, blank=True)  # Ngày thanh toán

    #Thông tin hệ thống
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Booking {self.id}'
    
    def get_assigned_staff(self):
        """Return list of assigned staff names"""
        return ", ".join([assignment.staff.full_name for assignment in self.staff_assignments.all()])
    get_assigned_staff.short_description = "Nhân viên đã phân công"



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
    
    

class Staff(models.Model):
    # Thông tin nhân viên
    full_name = models.CharField(_('Họ tên'), max_length=100)
    date_of_birth = models.DateField(_('Ngày sinh'))
    phone_number = models.CharField(_('Số điện thoại'), max_length=15)
    address = models.TextField(_('Địa chỉ'))
    
    # Giới tính
    GENDER_CHOICES = (
        ('Nam', 'Nam'),
        ('Nữ', 'Nữ'),
        ('Khác', 'Khác'),
    )
    gender = models.CharField(_('Giới tính'), max_length=10, choices=GENDER_CHOICES)
    
    # Trạng thái làm việc
    STATUS_CHOICES = (
        ('Đang rảnh', 'Đang rảnh'),
        ('Đang làm việc', 'Đang làm việc'),
        ('Nghỉ phép', 'Nghỉ phép'),
        ('Không hoạt động', 'Không hoạt động'),
    )
    status = models.CharField(_('Trạng thái'), max_length=20, choices=STATUS_CHOICES, default='Đang rảnh')

    skills = models.CharField(_('Kỹ năng'), max_length=255)
    
    # System fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.full_name} - {self.get_status_display()}"
    
    class Meta:
        verbose_name = _('Staff')
        verbose_name_plural = _('Staffs')
        ordering = ['full_name']

    def is_available(self, booking_date, booking_time, duration=3, exclude_booking_id=None):
        """Kiểm tra xem nhân viên có khả dụng cho một khung giờ booking với tùy chọn loại trừ booking hiện tại"""
        if self.status in ['Nghỉ phép', 'Không hoạt động']:
            return False
            
        # Chuyển đổi booking_time thành datetime để dễ so sánh
        if isinstance(booking_time, str):
            hours, minutes = map(int, booking_time.split(':'))
        else:
            hours, minutes = booking_time.hour, booking_time.minute
            
        booking_start = datetime.datetime.combine(booking_date, datetime.time(hours, minutes))
        booking_end = booking_start + datetime.timedelta(hours=duration)
        
        # Lấy tất cả các booking mà nhân viên này đã được phân công
        # Loại trừ booking hiện tại nếu đang kiểm tra trong trường hợp chỉnh sửa
        assigned_bookings = self.assigned_bookings.filter(booking__booking_date=booking_date)
        if exclude_booking_id:
            assigned_bookings = assigned_bookings.exclude(booking_id=exclude_booking_id)
        
        for assignment in assigned_bookings:
            booking = assignment.booking
            
            # Chuyển đổi thời gian booking sang datetime
            if isinstance(booking.booking_time, str):
                b_hours, b_minutes = map(int, booking.booking_time.split(':'))
            else:
                b_hours, b_minutes = booking.booking_time.hour, booking.booking_time.minute
                
            existing_start = datetime.datetime.combine(booking.booking_date, datetime.time(b_hours, b_minutes))
            existing_end = existing_start + datetime.timedelta(hours=duration)
            
            # Kiểm tra xem có sự trùng lặp không
            if (booking_start < existing_end and booking_end > existing_start):
                return False
                
        return True
    
    def update_status_on_booking_complete(self):
        """
        Update staff status to 'Đang rảnh' if all assigned bookings are completed.
        """
        # Get all active assignments (not completed or cancelled)
        active_assignments = self.assigned_bookings.exclude(
            booking__status__in=['Hoàn thành', 'Hủy bỏ']
        )
        # If no active assignments, set status to 'Đang rảnh'
        if not active_assignments.exists():
            self.status = 'Đang rảnh'
            self.save()


class StaffAssignment(models.Model):
    """Model to manage staff assignments to bookings"""
    booking = models.ForeignKey('ServiceBooking', on_delete=models.CASCADE, related_name='staff_assignments')
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='assigned_bookings')
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.staff.full_name} - {self.booking}"
    
    class Meta:
        verbose_name = _('Phân công nhân viên')
        verbose_name_plural = _('Phân công nhân viên')
        unique_together = ('booking', 'staff')
    
    def clean(self):
        # Kiểm tra trạng thái nhân viên
        if self.staff.status in ['Nghỉ phép', 'Không hoạt động']:
            raise ValidationError(_(f"Nhân viên {self.staff.full_name} đang {self.staff.get_status_display()}, không thể phân công."))
        
        # Kiểm tra xem nhân viên có khả dụng tại thời điểm booking không
        # Truyền ID booking hiện tại để loại trừ nó khỏi kiểm tra khả năng làm việc khi chỉnh sửa
        exclude_id = self.booking.id if self.pk else None
        if not self.staff.is_available(self.booking.booking_date, self.booking.booking_time, exclude_booking_id=exclude_id):
            raise ValidationError(_(f"Nhân viên {self.staff.full_name} đã có lịch làm việc trùng với thời gian này."))
        
        super().clean()
