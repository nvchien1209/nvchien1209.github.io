from django.shortcuts import render, redirect, get_object_or_404
from .models import Category, Service, ServicePackage, AdditionalService, ServiceBooking, ServiceBookingDetail, Promotion, Feedback, Staff, StaffAssignment
from django.http import JsonResponse
from django.utils import timezone
from django.contrib import messages
from decimal import Decimal
from datetime import datetime, date
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.template.loader import render_to_string
from django.core.paginator import Paginator
from .vnpay import VNPay


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

def news1_detail(request):
    return render(request, 'news1_detail.html')

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

    user = request.user

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
        sub_total = Decimal(str(data.get('sub_total', 0)))
        print(sub_total)

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
                discount_amount = (promotion.discount_value / Decimal(100)) * sub_total
            else:
                discount_amount = promotion.discount_value if promotion else 0
        else:
            promotion = None
            discount_amount = 0
            sub_total = sub_total
                

        # Tạo booking mới
        booking = ServiceBooking(
            customer=request.user,  
            category=package.service.category,
            service=package.service,
            booking_date=booking_date,  # chỉ lưu ngày, không lưu thời gian
            booking_time=booking_time,
            address=address,
            sub_total=sub_total,
            promotion=promotion,
            discount_amount=discount_amount,
            total_amount_after_discount=sub_total - discount_amount,
            status='Đang chờ',
            payment_status='Chưa thanh toán',
            payment_method='Tiền mặt'  # Mặc định là tiền mặt, có thể cập nhật sau
        )
        booking.save()
        
        # Tạo booking detail
        booking_detail = ServiceBookingDetail(
            booking=booking,
            package=package,
            total_price=sub_total + discount_amount
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
    bookings = ServiceBooking.objects.prefetch_related('details', 'feedbacks', 'staff_assignments').filter(customer=request.user).order_by('-created_at')
    AdditionalServices = AdditionalService.objects.all()
    paginator = Paginator(bookings, 5)  
    page = request.GET.get('page', 1)
    bookings_page = paginator.get_page(page)
    context = {
        'bookings': bookings_page,
        'AdditionalServices': AdditionalServices,
        'page_obj': bookings_page,
    }
    return render(request, 'history_booking.html', context)

@require_POST
@login_required
@csrf_exempt
def destroy_booking(request, booking_id):
    try:
        booking = get_object_or_404(ServiceBooking, id=booking_id, customer=request.user)
        if booking.status != 'Hủy bỏ':
            booking.status = 'Hủy bỏ'
            booking.save()
            return JsonResponse({'success': True, 'message': 'Đã hủy đơn thành công!'})
        else:
            return JsonResponse({'success': False, 'message': 'Đơn đã được hủy trước đó!'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Có lỗi xảy ra: {str(e)}'})
    
@require_POST
@login_required
@csrf_exempt
def rate_booking(request):
    try:
        data = json.loads(request.body)
        booking_id = data.get('bookingId')
        rating = data.get('rating')
        comment = data.get('comment', '')
        print("hi1")
        if not booking_id or not rating:
            return JsonResponse({'success': False, 'message': 'Thiếu thông tin đánh giá.'})

        booking = get_object_or_404(ServiceBooking, id=booking_id, customer=request.user)
        print("hi2")
        # Kiểm tra xem đã đánh giá chưa
        feedback_obj = Feedback.objects.filter(booking=booking, customer=request.user).first()
        if feedback_obj:
            # Nếu đã đánh giá, cập nhật lại theo đánh giá mới nhất
            feedback_obj.rating = rating
            feedback_obj.comment = comment
            feedback_obj.created_at = timezone.now()
            feedback_obj.save()
            return JsonResponse({'success': True, 'message': 'Cập nhật đánh giá thành công!'})
        print("hi3")
        feedback = Feedback.objects.create(
            booking=booking,
            customer=request.user,
            rating=rating,
            comment=comment,
            created_at=timezone.now()
        )

        return JsonResponse({'success': True, 'message': 'Đánh giá thành công!'})

    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Có lỗi xảy ra: {str(e)}'})


@require_GET
def filter_history(request):
    now = timezone.now()
    if request.headers.get('x-requested-with') != 'XMLHttpRequest':
        return JsonResponse({'success': False, 'message': 'Yêu cầu không hợp lệ.'}, status=400)
    try:
        # Lấy dữ liệu từ query params (GET)
        date_range = request.GET.get('dateRange', '')
        status = request.GET.get('status', '')
        print(date_range)
        print(status)
        # Khởi tạo queryset ban đầu
        bookings = ServiceBooking.objects.filter(customer=request.user)
    
        # Lọc theo date_range
        if date_range:
            if date_range == 'current-month':
                # Lấy ra tháng và năm hiện tại bằng timezone
                this_month = now.month
                this_year = now.year
                bookings = bookings.filter(
                    booking_date__year=this_year,
                    booking_date__month=this_month
                )
                
            elif date_range == 'last-month':
                last_month = now.month - 1 if now.month > 1 else 12
                last_year = now.year if last_month != 12 else now.year - 1
                bookings = bookings.filter(
                    booking_date__year=last_year,
                    booking_date__month=last_month
                )
            elif date_range == 'last-3-months':  # Thêm điều kiện cho 'last-3-months'
                # Lấy ra 3 tháng trước
                three_months_ago = now - timezone.timedelta(days=90)
                bookings = bookings.filter(
                    booking_date__gte=three_months_ago
                )
        if status and status != 'all':
            status_map = {
                'pending': 'Đang chờ',
                'completed': 'Hoàn thành',
                'cancelled': 'Hủy bỏ',
                'confirmed': 'Đã xác nhận',
                'in-progress': 'Đang thực hiện'
            }
            if status in status_map:
                bookings = bookings.filter(status=status_map[status])
        print(bookings)
        
        # Render HTML template với dữ liệu đã lọc
        html = render_to_string('partials/booking_list.html', {
            'bookings': bookings,
        }, request=request)
        
        return JsonResponse({
            'success': True,
            'html': html,
            
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    


@login_required
def initiate_payment(request, booking_id):
    print(booking_id)
    """
    Khởi tạo thanh toán VNPay
    """
    booking = get_object_or_404(ServiceBooking, id=booking_id, customer=request.user)
    print(type(booking))
    # Kiểm tra trạng thái booking
    if booking.payment_status == 'Đã thanh toán':
        messages.error(request, 'Đơn hàng này đã được thanh toán.')
        return redirect('booking_history')
    
    if booking.status == 'Hủy bỏ':
        messages.error(request, 'Không thể thanh toán cho đơn hàng đã hủy.')
        return redirect('booking_history')

    # Tạo VNPay instance
    vnpay = VNPay()
    print("check2")
    # Thông tin đơn hàng
    order_info = f"Thanh toan don hang #{booking.id}"
    amount = booking.total_amount_after_discount
    order_id = f"{booking.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
    
    # Lấy IP address của client
    ipaddr = get_client_ip(request)
    print(order_id, order_info, amount, ipaddr)
    # Tạo URL thanh toán
    vnpay.get_payment_url(order_info, amount, order_id, ipaddr)
    payment_url = vnpay.get_payment_url(order_info, amount, order_id, ipaddr)
    
    # print(payment_url)
    return redirect(payment_url)

@csrf_exempt
def vnpay_return(request):
    """
    Xử lý kết quả trả về từ VNPay
    """
    if request.method == 'GET':
        input_data = request.GET.dict()
    
        print("Dữ liệu nhận từ VNPay:", input_data)
        # Xác thực response
        vnpay = VNPay()
        is_valid = vnpay.validate_response(request.GET)
        vnp_params = vnpay.response_data
        if is_valid:
            # Lấy thông tin từ response
            vnp_response_code = vnp_params.get('vnp_ResponseCode')
            vnp_txn_ref = vnp_params.get('vnp_TxnRef')
            vnp_amount = int(vnp_params.get('vnp_Amount', 0)) / 100
            vnp_transaction_no = vnp_params.get('vnp_TransactionNo')
            vnp_pay_date = vnp_params.get('vnp_PayDate')
            
            # Lấy booking ID từ vnp_TxnRef
            try:
                booking_id = int(vnp_txn_ref.split('_')[0])
                booking = ServiceBooking.objects.get(id=booking_id)
            except (ValueError, ServiceBooking.DoesNotExist):
                messages.error(request, 'Không tìm thấy đơn hàng.')
                return redirect('booking_history')
            
            # Kiểm tra kết quả thanh toán
            if vnp_response_code == '00':
                # Thanh toán thành công
                booking.payment_status = 'Đã thanh toán'
                booking.payment_method = 'Ví điện tử'
                booking.payment_code = vnp_transaction_no
                booking.date_paid = timezone.now().date()
                booking.save()
                
                messages.success(request, 'Thanh toán thành công!')
                
                # Render trang thành công
                context = {
                    'booking': booking,
                    'vnp_amount': vnp_amount,
                    'vnp_transaction_no': vnp_transaction_no,
                    'vnp_pay_date': vnp_pay_date,
                    'success': True
                }
                return render(request, 'payment_result.html', context)
            else:
                # Thanh toán thất bại
                error_messages = {
                    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
                    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
                    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
                    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
                    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
                    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
                    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
                    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
                    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
                    '75': 'Ngân hàng thanh toán đang bảo trì.',
                    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
                }
                
                error_message = error_messages.get(vnp_response_code, 'Giao dịch thất bại.')
                messages.error(request, f'Thanh toán thất bại: {error_message}')
                
                context = {
                    'booking': booking,
                    'error_message': error_message,
                    'success': False
                }
                return render(request, 'payment_result.html', context)
        else:
            messages.error(request, 'Dữ liệu trả về không hợp lệ.')
            return redirect('booking_history')
    
    return redirect('booking_history')

def get_client_ip(request):
    """
    Lấy IP address của client
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip