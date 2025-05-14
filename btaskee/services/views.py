from django.shortcuts import render, redirect, get_object_or_404
from .models import Category, Service, ServicePackage, AdditionalService, ServiceBooking, ServiceBookingDetail, Promotion
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction
from django.contrib import messages
from decimal import Decimal
from datetime import datetime, date
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt


def home_view(request):
    user_data = None
    if request.user.is_authenticated:
        user_data = {
            'name': request.user.username,
            'avatar': request.user.avatar.url if hasattr(request.user, 'avatar') and request.user.avatar else None,
            'isLoggedIn': True
        }
    print(user_data)
    # Truyền dữ liệu vào context
    context = {
        'user_data': user_data,
        # 'categories': categories,
    }
    
    return render(request, 'home.html', context)

def news_view(request):
    
    return render(request, 'news.html')

def job_view(request):
    
    return render(request, 'job.html')

def about_view(request):
    
    return render(request, 'about.html')

def service_detail(request, service_id):
    
    # Truy vấn dịch vụ theo ID
    service = Service.objects.get(id=service_id)

    

    #Kiểm tra xem dịch vụ tương ứng với temlate nào

    template_name = f'service_{service.id}_detail.html'
    packages = service.packages.all()
    if service.id == 1:
        additional_services = AdditionalService.objects.filter(id__in=[1, 2])
    context = {
        'service': service,
        'packages': packages,
        'additional_services': additional_services,
    }
    return render(request, template_name, context)
    

@csrf_exempt
def check_promotion_code(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            code = data.get('code', '').strip()
            total = Decimal(str(data.get('total', 0)))

            try:
                promo = Promotion.objects.get(promotion_code__iexact=code)
            except Promotion.DoesNotExist:
                return JsonResponse({
                    'valid': False,
                    'message': 'Mã giảm giá không tồn tại.'
                })

            if not promo.is_valid():
                return JsonResponse({
                    'valid': False,
                    'message': 'Mã giảm giá đã hết hạn hoặc không còn hiệu lực.'
                })

            # Tính số tiền giảm
            if promo.discount_type == 'Phần trăm':
                discount_amount = (promo.discount_value / Decimal(100)) * total
            else:
                discount_amount = promo.discount_value

            # Giới hạn số tiền giảm không vượt quá tổng tiền
            discount_amount = min(discount_amount, total)

            return JsonResponse({
                'valid': True,
                'message': 'Áp dụng mã giảm giá thành công!',
                'discountAmount': int(discount_amount)
            })

        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({
                'valid': False,
                'message': 'Đã xảy ra lỗi khi kiểm tra mã giảm giá.',
            }, status=400)

    return JsonResponse({'message': 'Phương thức không được hỗ trợ'}, status=405)


@login_required
@csrf_exempt
def create_booking(request):

    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Phương thức không được hỗ trợ'})
    
    try:
        # Lấy dữ liệu từ request
        data = json.loads(request.body)
        
        # Lấy thông tin từ dữ liệu gửi lên
        package_id = data.get('packageId')
        additional_services = data.get('additionalServices', [])
        date_str = data.get('date')
        time_str = data.get('time')
        address = data.get('address')
        coupon_code = data.get('coupon')
        total_amount = Decimal(str(data.get('total', 0)))
        
        # Kiểm tra các trường bắt buộc
        if not package_id or not date_str or not time_str or not address:
            return JsonResponse({'success': False, 'message': 'Thiếu thông tin cần thiết'})
        
        # Chuyển đổi chuỗi ngày và thời gian thành đối tượng datetime và time
        try:
            booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            booking_time = datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Định dạng ngày hoặc thời gian không hợp lệ'})
        
        # Lấy package từ ID
        try:
            package = ServicePackage.objects.get(id=package_id)
        except ServicePackage.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Gói dịch vụ không tồn tại'})
        

        if(coupon_code):
            promotion = Promotion.objects.filter(promotion_code__iexact=coupon_code).first() if coupon_code else None
            if promotion.discount_type == 'Phần trăm':
                discount_amount = (promotion.discount_value / Decimal(100)) * total_amount
            else:
                discount_amount = promotion.discount_value if promotion else 0
        else:
            promotion = None
            discount_amount = 0
            sub_total = total_amount
                

        # Tạo booking mới
        booking = ServiceBooking(
            customer=request.user,  
            category=package.service.category,
            service=package.service,
            booking_date=booking_date,  # chỉ lưu ngày, không lưu thời gian
            booking_time=booking_time,
            address=address,
            sub_total=total_amount + discount_amount,
            promotion=promotion,
            discount_amount=discount_amount,
            total_amount_after_discount=total_amount,
            status='Đang chờ',
            payment_status='Chưa thanh toán',
            payment_method='Tiền mặt'  # Mặc định là tiền mặt, có thể cập nhật sau
        )
        booking.save()
        
        # Tạo booking detail
        booking_detail = ServiceBookingDetail(
            booking=booking,
            package=package,
            total_price=total_amount + discount_amount
        )
        booking_detail.save()
        
        # Thêm dịch vụ bổ sung nếu có
        if additional_services:
            for service_id in additional_services:
                try:
                    additional_service = AdditionalService.objects.get(id=service_id)
                    booking_detail.additional_services.add(additional_service)
                except AdditionalService.DoesNotExist:
                    pass  # Bỏ qua nếu dịch vụ không tồn tại
        
        
        return JsonResponse({
            'success': True,
            'message': 'Đặt dịch vụ thành công',
            'booking_id': booking.id
        })
        
    except Exception as e:
        print("test")
        # Xử lý lỗi
        print(f"Lỗi khi tạo booking: {str(e)}")
        return JsonResponse({'success': False, 'message': f'Đã xảy ra lỗi: {str(e)}'})
    

def booking_history(request):
    bookings = ServiceBooking.objects.prefetch_related('ServiceBookingDetail', 'AdditionalService').filter(customer=request.user).order_by('-created_at')
    context = {
        'bookings': bookings
    }
    return render(request, 'history_booking.html', context)