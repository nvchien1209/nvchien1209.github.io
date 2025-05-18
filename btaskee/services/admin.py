from django.contrib import admin
from .models import Category, Service, ServicePackage, AdditionalService, Promotion, ServiceBooking, ServiceBookingDetail, Feedback, StaffAssignment, Staff
from django.utils.html import format_html

class ServiceInline(admin.TabularInline):
    model = Service
    extra = 1
    fields = ('name', 'is_active')
    show_change_link = True

class ServicePackageInline(admin.TabularInline):
    model = ServicePackage
    extra = 1
    fields = ('name', 'price_min', 'price_max', 'is_active')
    show_change_link = True

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_services_count', 'description')
    search_fields = ('name',)
    inlines = [ServiceInline]
    
    def get_services_count(self, obj):
        return obj.services.count()
    get_services_count.short_description = 'Số dịch vụ'

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'get_packages_count', 'is_active', 'created_at', 'updated_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ServicePackageInline]
    
    def get_packages_count(self, obj):
        return obj.packages.count()
    get_packages_count.short_description = 'Số gói dịch vụ'

@admin.register(ServicePackage)
class ServicePackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'service', 'price_min', 'price_max', 'is_active', 'created_at')
    list_filter = ('service', 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_active',)
    fieldsets = (
        (None, {
            'fields': ('service', 'name', 'description')
        }),
        ('Thông tin giá', {
            'fields': ('price_min', 'price_max')
        }),
        ('Trạng thái', {
            'fields': ('is_active',)
        }),
        ('Thông tin thời gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(AdditionalService)
class AdditionalServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price_per_unit', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('price_per_unit', 'is_active')
    fieldsets = (
        (None, {
            'fields': ('name', 'description')
        }),
        ('Thông tin giá', {
            'fields': ('price_per_unit',)
        }),
        ('Trạng thái', {
            'fields': ('is_active',)
        }),
        ('Thông tin thời gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('promotion_code', 'description', 'discount_type', 'discount_value', 
                    'start_date', 'end_date', 'usage_limit', 'is_active', 'is_valid_display')
    list_filter = ('discount_type', 'is_active', 'start_date', 'end_date')
    search_fields = ('promotion_code', 'description')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('promotion_code', 'description', 'is_active')
        }),
        ('Cài đặt giảm giá', {
            'fields': ('discount_type', 'discount_value')
        }),
        ('Thời gian áp dụng', {
            'fields': ('start_date', 'end_date')
        }),
        ('Giới hạn sử dụng', {
            'fields': ('usage_limit',)
        }),
        ('Thông tin hệ thống', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    def is_valid_display(self, obj):
        if obj.is_valid():
            return format_html('<span style="color: green;">✓ Hợp lệ</span>')
        return format_html('<span style="color: red;">✗ Không hợp lệ</span>')
    is_valid_display.short_description = 'Trạng thái hợp lệ'


class ServiceBookingDetailInline(admin.TabularInline):
    model = ServiceBookingDetail
    extra = 0
    fields = ('package', 'additional_services', 'total_price', 'note')
    filter_horizontal = ('additional_services',)
    readonly_fields = ('total_price',)

class FeedbackInline(admin.TabularInline):
    model = Feedback
    extra = 1

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in instances:
            if not obj.customer:
                obj.customer = obj.booking.customer
            obj.save()
        formset.save_m2m()


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone_number', 'status', 'gender', 'skills')
    list_filter = ('status', 'gender', 'skills')
    search_fields = ('full_name', 'phone_number', 'address')
    fieldsets = (
        ('Thông tin cá nhân', {
            'fields': ('full_name', 'date_of_birth', 'gender', 'phone_number', 'address')
        }),
        ('Thông tin công việc', {
            'fields': ('status', 'skills')
        }),
    )

class StaffAssignmentInline(admin.TabularInline):
    model = StaffAssignment
    extra = 1
    autocomplete_fields = ['staff']    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "staff":
            # Only show staff that are available (not on leave or inactive)
            kwargs["queryset"] = Staff.objects.exclude(status__in=['Nghỉ phép', 'Không hoạt động' , 'Đang làm việc'])
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(ServiceBooking)
class ServiceBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'customer', 'category', 'service', 'booking_date', 
                    'booking_time', 'status', 'payment_status', 'total_amount_after_discount', 'get_assigned_staff')
    list_filter = ('status', 'payment_status', 'payment_method', 'category', 'service', 'booking_date')
    search_fields = ('customer__username', 'customer__email', 'customer__full_name', 
                     'address', 'promotion__promotion_code')
    readonly_fields = ('sub_total', 'discount_amount', 'total_amount_after_discount', 
                       'created_at', 'updated_at')
    date_hierarchy = 'booking_date'
    
    fieldsets = (
        ('Thông tin khách hàng', {
            'fields': ('customer',)
        }),
        ('Thông tin dịch vụ', {
            'fields': ('category', 'service')
        }),
        ('Thời gian và địa điểm', {
            'fields': ('booking_date', 'booking_time', 'address')
        }),
        ('Thông tin thanh toán', {
            'fields': ('sub_total', 'promotion', 'discount_amount', 
                       'total_amount_after_discount', 'payment_status', 'payment_method', 'date_paid', 'payment_code')
        }),
        ('Trạng thái', {
            'fields': ('status',)
        }),
        ('Thông tin hệ thống', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    

    inlines = [ServiceBookingDetailInline, FeedbackInline, StaffAssignmentInline]

    actions = ['mark_as_confirmed', 'mark_as_completed', 'mark_as_cancelled']
    
    def mark_as_confirmed(self, request, queryset):
        updated = queryset.update(status='Đã xác nhận')
        self.message_user(request, f'{updated} booking(s) đã được xác nhận.')
    mark_as_confirmed.short_description = 'Đánh dấu là Đã xác nhận'
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status='Hoàn thành')
        self.message_user(request, f'{updated} booking(s) đã được hoàn thành.')
        # Cập nhật trạng thái nhân viên
        for booking in queryset:
            for assignment in booking.staff_assignments.all():
                assignment.staff.update_status_on_booking_complete()
    mark_as_completed.short_description = 'Đánh dấu là Hoàn thành'
    mark_as_completed.short_description = 'Đánh dấu là Hoàn thành'
    
    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='Hủy bỏ')
        self.message_user(request, f'{updated} booking(s) đã bị hủy.')
    mark_as_cancelled.short_description = 'Đánh dấu là Hủy bỏ'

    def save_formset(self, request, form, formset, change):
        """Xác thực phân công nhân viên trước khi lưu và xử lý ngoại lệ đúng cách"""
        # Xác thực tất cả các phân công trước khi lưu
        instances = formset.save(commit=False)
        
        # Thu thập lỗi xác thực
        errors = []
        
        # Bước 1 - xác thực tất cả các phân công
        for instance in instances:
            if isinstance(instance, StaffAssignment):
                try:
                    # Xác thực phân công
                    instance.clean()
                except ValidationError as e:
                    errors.append(f"Lỗi với nhân viên {instance.staff.full_name}: {e}")
        
        # Nếu có lỗi, hiển thị tất cả cùng một lúc
        if errors:
            error_message = "\n".join(errors)
            raise ValidationError(error_message)
            
        # Bước 2 - lưu tất cả các instance đã được xác thực
        for instance in instances:
            if isinstance(instance, StaffAssignment):
                # Cập nhật trạng thái nhân viên nếu cần
                if instance.staff.status == 'Đang rảnh':
                    instance.staff.status = 'Đang làm việc'
                    instance.staff.save()
            
            instance.save()
        
        # Lưu các quan hệ many-to-many
        formset.save_m2m()

@admin.register(ServiceBookingDetail)
class ServiceBookingDetailAdmin(admin.ModelAdmin):
    list_display = ('booking', 'package', 'get_additional_services', 'total_price')
    list_filter = ('package', 'additional_services')
    search_fields = ('booking__id', 'package__name', 'additional_services__name')
    filter_horizontal = ('additional_services',)
    readonly_fields = ('total_price',)
    
    def get_additional_services(self, obj):
        return ", ".join([service.name for service in obj.additional_services.all()])
    get_additional_services.short_description = 'Dịch vụ bổ sung'


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'booking', 'rating_stars', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('customer__username', 'customer__email', 'customer__full_name', 
                     'booking__id', 'comment')
    readonly_fields = ('customer', 'booking', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('customer', 'booking')
        }),
        ('Nội dung đánh giá', {
            'fields': ('rating', 'comment')
        }),
        ('Thông tin hệ thống', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    def rating_stars(self, obj):
        return format_html('⭐' * obj.rating)
    rating_stars.short_description = 'Đánh giá'


