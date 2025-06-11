from django.contrib import admin
from .models import Category, Service, ServicePackage, AdditionalService, Promotion, ServiceBooking, ServiceBookingDetail, Feedback, StaffAssignment, Staff
from django.utils.html import format_html
from django.core.exceptions import ValidationError
from import_export import resources
from import_export.admin import ExportMixin
from django.core.mail import send_mail
from django.contrib import messages

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
    get_services_count.short_description = 'Number of Services'

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'get_packages_count', 'is_active', 'created_at', 'updated_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ServicePackageInline]
    
    def get_packages_count(self, obj):
        return obj.packages.count()
    get_packages_count.short_description = 'Number of Packages'

@admin.register(ServicePackage)
class ServicePackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'service', 'price_min', 'price_max', 'is_active', 'created_at', 'duration')
    list_filter = ('service', 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_active',)
    fieldsets = (
        (None, {
            'fields': ('service', 'name', 'description', 'duration')
        }),
        ('Pricing', {
            'fields': ('price_min', 'price_max')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Time Information', {
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
        ('Pricing', {
            'fields': ('price_per_unit',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Time Information', {
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
        ('General Information', {
            'fields': ('promotion_code', 'description', 'is_active')
        }),
        ('Discount Settings', {
            'fields': ('discount_type', 'discount_value')
        }),
        ('Time Period', {
            'fields': ('start_date', 'end_date')
        }),
        ('Usage Limit', {
            'fields': ('usage_limit',)
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    def is_valid_display(self, obj):
        if obj.is_valid():
            return format_html('<span style="color: green;">✓ Hợp lệ</span>')
        return format_html('<span style="color: red;">✗ Không hợp lệ</span>')
    is_valid_display.short_description = 'Valid status'


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
    list_filter = ('status', 'gender', 'skills', )
    search_fields = ('full_name', 'phone_number', 'address')
    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'date_of_birth', 'gender', 'phone_number', 'address')
        }),
        ('Job Information', {
            'fields': ('status', 'skills')
        }),
    )

    def mark_as_available(self, request, queryset):
        updated = queryset.update(status='Đang rảnh')
        self.message_user(request, f'{updated} nhân viên đã được đánh dấu là Đang rảnh.')
    mark_as_available.short_description = 'Đánh dấu là Đang rảnh'
    def mark_as_on_leave(self, request, queryset):
        updated = queryset.update(status='Nghỉ phép')
        self.message_user(request, f'{updated} nhân viên đã được đánh dấu là Nghỉ phép.')
    mark_as_on_leave.short_description = 'Đánh dấu là Nghỉ phép'
    def mark_as_inactive(self, request, queryset):
        updated = queryset.update(status='Không hoạt động')
        self.message_user(request, f'{updated} nhân viên đã được đánh dấu là Không hoạt động.')
    mark_as_inactive.short_description = 'Đánh dấu là Không hoạt động'
    def mark_as_working(self, request, queryset):
        updated = queryset.update(status='Đang làm việc')
        self.message_user(request, f'{updated} nhân viên đã được đánh dấu là Đang làm việc.')
    mark_as_working.short_description = 'Đánh dấu là Đang làm việc'
    actions = [mark_as_available, mark_as_on_leave, mark_as_inactive, mark_as_working]

class StaffAssignmentInline(admin.TabularInline):
    model = StaffAssignment
    extra = 1
    can_delete = True
    fields = ('staff', 'assigned_at')
    readonly_fields = ('assigned_at',)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "staff":
            kwargs["queryset"] = Staff.objects.filter(status__in=['Đang rảnh', 'Đang làm việc'])
            kwargs["required"] = True
            # Chỉ định widget là Select thay vì AutocompleteSelect
            from django.forms.widgets import Select
            kwargs["widget"] = Select(attrs={'style': 'width: 100%'})
        return super().formfield_for_foreignkey(db_field, request, **kwargs)



@admin.register(ServiceBooking)
class ServiceBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'customer', 'category', 'service', 'booking_date', 
                    'booking_time', 'status', 'payment_status', 'total_amount_after_discount', 'get_assigned_staff')
    list_filter = ('customer','status', 'payment_status', 'payment_method', 'category', 'service', 'booking_date')
    search_fields = ('customer__username', 'customer__email', 'customer__full_name', 
                     'address', 'promotion__promotion_code')
    readonly_fields = ('sub_total', 'discount_amount', 'total_amount_after_discount', 
                       'created_at', 'updated_at')
    date_hierarchy = 'booking_date'
    
    fieldsets = (
        ('Customer', {
            'fields': ('customer',)
        }),
        ('Service Information', {
            'fields': ('category', 'service')
        }),
        ('Time and Location', {
            'fields': ('booking_date', 'booking_time', 'address')
        }),
        ('Payment Information', {
            'fields': ('sub_total', 'promotion', 'discount_amount', 
                       'total_amount_after_discount', 'payment_status', 'payment_method', 'date_paid', 'payment_code')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        
    )
    

    inlines = [ServiceBookingDetailInline, FeedbackInline, StaffAssignmentInline]

    actions = ['mark_as_confirmed', 'mark_as_completed', 'mark_as_cancelled', 'mark_as_in_progress', 'send_confirmed_booking_email']
    

    def send_confirmed_booking_email(self, request, queryset):
        count = 0
        for booking in queryset:
            if booking.status == 'Đã xác nhận' and booking.customer.email:
                staff_names = ", ".join([assignment.staff.full_name for assignment in booking.staff_assignments.all()])
                message = (
                    f"Chào {booking.customer.username},\n"
                    f"Booking của bạn với mã #{booking.id} đã được xác nhận.\n"
                    f"Thông tin chi tiết:\n"
                    f"Dịch vụ: {booking.service.name}\n"
                    f"Ngày đặt: {booking.booking_date}\n"
                    f"Thời gian: {booking.booking_time}\n"
                    f"Nhân viên phụ trách: {staff_names}\n"
                    f"Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!"
                )
                send_mail(
                    subject='Xác nhận đơn dịch vụ',
                    message=message,
                    from_email='noreply@mydomain.com',
                    recipient_list=[booking.customer.email],
                    fail_silently=False,
                )
                count += 1
        if count:
            self.message_user(request, f"Đã gửi email xác nhận cho {count} khách hàng.", level=messages.SUCCESS)
        else:
            self.message_user(request, "Không có đơn nào ở trạng thái 'Đã xác nhận' hoặc không có email.", level=messages.WARNING)
    send_confirmed_booking_email.short_description = "Gửi email xác nhận cho khách hàng (chỉ đơn đã xác nhận)"

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
    
    def mark_as_in_progress(self, request, queryset):
        updated = queryset.update(status='Đang thực hiện')
        self.message_user(request, f'{updated} booking(s) đã được đánh dấu là Đang thực hiện.')
    mark_as_in_progress.short_description = 'Đánh dấu là Đang thực hiện'

    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='Hủy bỏ')
        self.message_user(request, f'{updated} booking(s) đã bị hủy.')
    mark_as_cancelled.short_description = 'Đánh dấu là Hủy bỏ'

    def save_formset(self, request, form, formset, change):
        if formset.model == StaffAssignment:
            # Lưu formset trước để có thể truy cập deleted_objects
            instances = formset.save(commit=False)
            for obj in formset.deleted_objects:
                if isinstance(obj, StaffAssignment):
                    # Cập nhật trạng thái nhân viên khi bị xóa khỏi booking
                    if obj.staff:
                        obj.staff.update_status_on_booking_complete()
                    obj.delete()

            """Xác thực phân công nhân viên trước khi lưu và xử lý ngoại lệ đúng cách"""
            instances = formset.save(commit=False)
            errors = []
            

            # Xác thực tất cả các phân công
            for instance in instances:
                if isinstance(instance, StaffAssignment):
                    try:
                        # Đảm bảo instance có đủ thông tin trước khi clean
                        if not hasattr(instance, 'staff') or not instance.staff:
                            errors.append("Nhân viên không được để trống.")
                            continue
                        if not hasattr(instance, 'booking') or not instance.booking:
                            errors.append("Booking không được để trống.")
                            continue
                        
                        # Xác thực phân công
                        instance.clean()
                    except ValidationError as e:
                        if hasattr(instance, 'staff') and instance.staff:
                            errors.append(f"Lỗi với nhân viên {instance.staff.full_name}: {e}")
                        else:
                            errors.append(f"Lỗi phân công: {e}")
            
            # Nếu có lỗi, hiển thị tất cả cùng một lúc
            if errors:
                error_message = "\n".join(errors)
                raise ValidationError(error_message)
            
            # Lưu tất cả các instance đã được xác thực
            for instance in instances:
                if isinstance(instance, StaffAssignment):
                    # Cập nhật trạng thái nhân viên nếu cần
                    if instance.staff and instance.staff.status == 'Đang rảnh':
                        instance.staff.status = 'Đang làm việc'
                        instance.staff.save()
                
                instance.save()
            
            # Lưu các quan hệ many-to-many
            formset.save_m2m()
        else:
            # Xử lý các formset khác bình thường
            super().save_formset(request, form, formset, change)

    class Media:
        js = ('admin/js/staff_assignment.js',)

@admin.register(ServiceBookingDetail)
class ServiceBookingDetailAdmin(admin.ModelAdmin):
    list_display = ('booking', 'package', 'get_additional_services', 'total_price')
    list_filter = ('package', 'additional_services')
    search_fields = ('booking__id', 'package__name', 'additional_services__name')
    filter_horizontal = ('additional_services',)
    readonly_fields = ('total_price',)
    
    def get_additional_services(self, obj):
        return ", ".join([service.name for service in obj.additional_services.all()])
    get_additional_services.short_description = 'Additional Services'


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'booking', 'rating_stars', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('customer__username', 'customer__email', 'customer__full_name', 
                     'booking__id', 'comment')
    readonly_fields = ('customer', 'booking', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('General Information', {
            'fields': ('customer', 'booking')
        }),
        ('Feedback Content', {
            'fields': ('rating', 'comment')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    def rating_stars(self, obj):
        return format_html('⭐' * obj.rating)
    rating_stars.short_description = 'Feedback'


class StaffAssignmentResource(resources.ModelResource):
    class Meta:
        model = StaffAssignment
        fields = ('id', 'staff__full_name', 'booking__id', 'booking__booking_date', 'assigned_at')


@admin.register(StaffAssignment)
class StaffAssignmentAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = StaffAssignmentResource
    list_display = ('id', 'booking', 'staff', 'assigned_at')
    list_filter = ('staff', 'booking__status')
    search_fields = ('staff__full_name', 'booking__id')
    autocomplete_fields = ['staff', 'booking']
    readonly_fields = ('assigned_at',)

