# views.py
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import CustomUser as User  
import re
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from services.models import ServiceBooking
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.conf import settings
from django.utils import timezone


def login_view(request):
    # Lấy dữ liệu từ request
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        print(f"Username: {username}, Password: {password}")  # Debugging line
        user = authenticate(request, username=username, password=password)
        print(user)  # Debugging line
        if user is not None:
            print(f"Authenticated user: {user}")  # Debugging line
            login(request, user)
            if user.is_superuser:
                return redirect('admin:index')
            else:
                return redirect('home')  # Điều hướng đến trang chủ sau khi đăng nhập
        else:
            print("Authentication failed")
            messages.error(request, 'Tên đăng nhập hoặc mật khẩu không đúng!')
            return render(request, 'login.html', {'username': username})
    
    return render(request, 'login.html')


def register_view(request):
    if request.method == 'POST':
        # Lấy dữ liệu từ request
        username = request.POST.get('username')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        password = request.POST.get('password')

        # Validate các trường bắt buộc
        errors = {}
        if not all([username, email, phone, password]):
            errors['required'] = 'Vui lòng điền đầy đủ thông tin'
        
        # Validate username (tối thiểu 5 ký tự)
        if len(username) < 5:
            errors['username'] = 'Tên đăng nhập phải có ít nhất 5 ký tự'

        # Validate password
        password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$'
        if not re.match(password_regex, password):
            errors['password'] = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'

        # Validate số điện thoại (định dạng Việt Nam)
        phone_regex = r'^(0|\+84)(\d{9,10})$'
        if not re.match(phone_regex, phone):
            errors['phone'] = 'Số điện thoại không hợp lệ'

        # Validate email
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, email):
            errors['email'] = 'Địa chỉ email không hợp lệ'

        # Kiểm tra trùng lặp
        if User.objects.filter(username=username).exists():
            errors['username'] = 'Tên đăng nhập đã tồn tại'
        
        if User.objects.filter(email=email).exists():
            errors['email'] = 'Email đã được đăng ký'

        # Xử lý khi có lỗi
        if errors:
            for error in errors.values():
                messages.error(request, error)
            return render(request, 'register.html', {
                'username': username,
                'email': email,
                'phone': phone
            })

        # Tạo user mới
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                phone=phone,
                password=password
            )
            messages.success(request, 'Đăng ký thành công!')
            return redirect('login') 
        except Exception as e:
            messages.error(request, f'Lỗi hệ thống: {str(e)}')
            return render(request, 'register.html', {
                'username': username,
                'email': email,
                'phone': phone
            })

    # Hiển thị trang đăng ký với GET request
    return render(request, 'register.html')


def logout_view(request):
    logout(request)
    print("User logged out")  # Debugging line    
    return redirect('login')

@login_required
def profile_view(request):
    user = request.user
    update_point(request)
    print(user.reward_points)
    update_total_booking(request)
    print(user.total_bookings)
    context = {
        'user': user,
    }
    
    if request.method == 'POST':
        # Lấy ra thông tin từ request.POST
        first_name = request.POST.get('lastName')
        last_name = request.POST.get('firstName')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        date_of_birth = request.POST.get('birthdate')
        sex = request.POST.get('gender')
        
        # Validate các trường bắt buộc
        errors = {}
        if not all([first_name, last_name, email, phone]):
            errors['required'] = 'Vui lòng điền đầy đủ thông tin bắt buộc.'

        # Validate email
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, email):
            errors['email'] = 'Địa chỉ email không hợp lệ.'
        elif User.objects.filter(email=email).exclude(id=user.id).exists():
            errors['email'] = 'Email đã được sử dụng bởi người dùng khác.'

        # Validate số điện thoại (định dạng Việt Nam)
        phone_regex = r'^(0|\+84)(\d{9}|\d{10})$'
        if not re.match(phone_regex, phone) or len(phone) > 10:
            errors['phone'] = 'Số điện thoại không hợp lệ.'

        # Xử lý khi có lỗi
        if errors:
            for error in errors.values():
                messages.error(request, error)
            context.update({
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone,
                'date_of_birth': date_of_birth,
                'sex': sex,
            })
            return render(request, 'profile.html', context)

        # Cập nhật thông tin người dùng
        try:
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.phone = phone
            user.date_of_birth = date_of_birth
            user.sex = sex
            user.save()
            messages.success(request, 'Cập nhật thông tin thành công!')
            return redirect('profile')
        except Exception as e:
            messages.error(request, 'Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng kiểm tra lại.')

    return render(request, 'profile.html', context)


@login_required
def change_password(request):
    user = request.user
    
    if request.method == 'POST':
        print("Đã nhận request POST để thay đổi mật khẩu")
        current_password = request.POST.get('currentPassword')
        new_password = request.POST.get('newPassword')
        confirm_password = request.POST.get('confirmPassword')
        
        print(f"Dữ liệu nhận được: {bool(current_password)}, {bool(new_password)}, {bool(confirm_password)}")


        # Kiểm tra xem người dùng đã nhập đủ thông tin chưa
        if not all([current_password, new_password, confirm_password]):
            print("đã đến đây 0")
            messages.error(request, 'Vui lòng điền đầy đủ thông tin.')
            # return redirect('profile')
        # Validate mật khẩu
        elif not user.check_password(current_password):
            print("đã đến đây 1")
            messages.error(request, 'Mật khẩu hiện tại không đúng.')
            # return redirect('profile')
        
        elif new_password != confirm_password:
            print("đã đen đây 2")
            messages.error(request, 'Mật khẩu mới và xác nhận mật khẩu không khớp.')
            # return redirect('profile')
        
        # Kiểm tra độ mạnh của mật khẩu
        elif len(new_password) < 8:
            print("đã đen đây 3")
            messages.error(request, 'Mật khẩu phải có ít nhất 8 ký tự.')
            # return redirect('profile')
            
        # Cập nhật mật khẩu
        else:
            try:
                user.set_password(new_password)
                print("Đang lưu mật khẩu mới...")
                user.save()
                # Cập nhật session để người dùng không bị đăng xuất
                update_session_auth_hash(request, user)
                messages.success(request, 'Cập nhật mật khẩu thành công!')
                print(f"Mật khẩu đã được cập nhật cho user: {user.username}")
                return redirect('profile')
            except Exception as e:
                print(f"Lỗi khi cập nhật mật khẩu: {str(e)}")
                messages.error(request, f'Lỗi hệ thống: {str(e)}')
    else:
        print("Nhận request không phải POST cho change_password")
    
    return redirect('profile')

def update_avatar(request):
    if request.method == 'POST':
        user = request.user
        avatar = request.FILES.get('avatar')
        print("đã nhận avatar")
        if avatar:
            user.avatar = avatar
            user.save()
            messages.success(request, 'Cập nhật avatar thành công!')
            print(f"Avatar đã được cập nhật cho user: {user.username}")
        
        print("Đã nhận request để cập nhật avatar")
    return redirect('profile')

def update_point(request):
    user = request.user
    num_booking_completed = ServiceBooking.objects.filter(customer=request.user, status='Hoàn thành').count()
    user.reward_points = num_booking_completed * 10
    user.save()
    print(f"Điểm thưởng đã được cập nhật cho user: {user.username}")
    return user.reward_points

def update_total_booking(request):
    user = request.user
    num_booking_completed = ServiceBooking.objects.filter(customer=request.user, status='Hoàn thành').count()
    user.total_bookings = num_booking_completed
    user.save()
    print(f"Tổng số booking đã được cập nhật cho user: {user.username}")
    return user.total_bookings

def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
            # Tạo mã xác nhận ngẫu nhiên
            verification_code = get_random_string(length=6, allowed_chars='0123456789')
            request.session['verification_code'] = verification_code  # Lưu mã xác nhận vào session
            request.session['email'] = email  # Lưu email vào session
            # Gửi email chứa mã xác nhận
            try:
                send_mail(
                    'Mã xác nhận quên mật khẩu BTaskee',
                    f'Mã xác nhận của bạn là: {verification_code}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return redirect('verify_password')
            except Exception as e:
                messages.error(request, f'Lỗi khi gửi email: {str(e)}')
                return render(request, 'forgotpw.html')
        except User.DoesNotExist:
            messages.error(request, 'Email không tồn tại trong hệ thống.')
            return render(request, 'forgotpw.html')            
    return render(request, 'forgotpw.html')

def verify_password(request):
    if request.method == 'POST':
        verification_code = request.POST.get('verification_code')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        email = request.session.get('email')  # Lấy email từ session
        stored_code = request.session.get('verification_code')  # Lấy mã xác nhận từ session
        print(f"Stored code: {stored_code}, Entered code: {verification_code}")
        print(f"New password: {new_password}, Confirm password: {confirm_password}")
        print(f"Email: {email}")
        if not all([verification_code, new_password, confirm_password]):
            messages.error(request, 'Vui lòng điền đầy đủ thông tin.')
            return render(request, 'verifypw.html')
        if verification_code != stored_code:
            messages.error(request, 'Mã xác nhận không đúng.')
            return render(request, 'verifypw.html')
        if new_password != confirm_password:
            messages.error(request, 'Mật khẩu mới và xác nhận mật khẩu không khớp.')
            return render(request, 'verifypw.html')
        if len(new_password) < 8:
            messages.error(request, 'Mật khẩu phải có ít nhất 8 ký tự.')
            return render(request, 'verifypw.html')
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            messages.success(request, 'Mật khẩu đã được cập nhật thành công!')
            # Xóa mã xác nhận và email khỏi session
            del request.session['verification_code']
            del request.session['email']
            return redirect('login')
        except Exception as e:
            messages.error(request, f'Lỗi hệ thống: {str(e)}')
            return render(request, 'verifypw.html')
    return render(request, 'verifypw.html')