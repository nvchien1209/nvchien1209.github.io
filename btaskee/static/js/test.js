/**
 * service-specific.js
 * File chứa các chức năng cụ thể cho dịch vụ giúp việc nhà
 */

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các thành phần gói dịch vụ
    initServicePackages();
    
    // Thiết lập sự kiện cho nút đặt dịch vụ
    setupBookingButton();
});

// Khởi tạo và xử lý các gói dịch vụ
function initServicePackages() {
    // Lấy tất cả các thẻ pricing card
    const pricingCards = document.querySelectorAll('.pricing-card');
    if (pricingCards.length === 0) return;

    // Lấy tất cả các thẻ dịch vụ thêm
    const additionalServices = document.querySelectorAll('.add-service-card');

    // Lấy các phần tử hiển thị giá
    const packagePriceEl = document.querySelector('.package-price');
    const additionalPriceEl = document.querySelector('.additional-price');
    const discountEl = document.querySelector('.discount-amount');
    const totalPriceEl = document.querySelector('.total-price');

    // Khai báo các biến để lưu trữ thông tin đặt dịch vụ
    let selectedPackage = null;
    let packagePrice = 0;
    let additionalPrice = 0;
    let discountAmount = 0;
    let totalPrice = 0;
    let selectedServices = [];
    let appliedCoupon = null;

    // Định nghĩa giá các gói dịch vụ (sử dụng giá trung bình)
    const packagePrices = {
        '2': 150000,
        '3': 187500,
        '4': 237500
    };

    // Định nghĩa giá các dịch vụ thêm
    const servicePrices = {
        'cooking': 90000,
        'laundry': 75000
    };

    // Thêm sự kiện click cho mỗi pricing card
    pricingCards.forEach(card => {
        card.addEventListener('click', function() {
            // Xóa class selected khỏi tất cả các card
            pricingCards.forEach(c => c.classList.remove('selected'));

            // Thêm class selected vào card được click
            this.classList.add('selected');

            // Cập nhật package đã chọn
            selectedPackage = this.dataset.package;

            // Cập nhật giá gói dịch vụ
            packagePrice = packagePrices[selectedPackage];

            // Cập nhật hiển thị giá
            updatePriceDisplay();

            console.log('Đã chọn gói ' + selectedPackage + ' giờ');
        });
    });

    // Thêm sự kiện cho các dịch vụ thêm
    additionalServices.forEach(service => {
        const checkbox = service.querySelector('.service-checkbox-input');
        if (!checkbox) return;

        service.addEventListener('click', function(e) {
            if (e.target === checkbox) return;
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        checkbox.addEventListener('change', function() {
            if (this.checked) {
                service.classList.add('selected');
            } else {
                service.classList.remove('selected');
            }
            updateSelectedServices();
            updatePriceDisplay();
        });
    });

    // Khởi tạo xử lý mã giảm giá
    const couponHandler = window.ServiceBooking && window.ServiceBooking.initCouponHandling ? 
        window.ServiceBooking.initCouponHandling({
            calculateTotalPrice: () => packagePrice + additionalPrice,
            onSuccess: (couponCode, discount, couponInfo) => {
                appliedCoupon = couponCode;
                discountAmount = discount;
                updatePriceDisplay();
            },
            onError: (errorType) => {
                // Xử lý lỗi nếu cần
                console.log('Coupon error:', errorType);
            }
        }) : null;

    function updateSelectedServices() {
        selectedServices = [];
        additionalPrice = 0;

        additionalServices.forEach(service => {
            const checkbox = service.querySelector('.service-checkbox-input');
            if (checkbox && checkbox.checked) {
                const serviceType = service.dataset.service;
                selectedServices.push(serviceType);
                additionalPrice += servicePrices[serviceType];
            }
        });
    }

    function updatePriceDisplay() {
        if (packagePriceEl) packagePriceEl.innerHTML = formatPrice(packagePrice);
        if (additionalPriceEl) additionalPriceEl.innerHTML = formatPrice(additionalPrice);
        if (discountEl) discountEl.innerHTML = formatPrice(discountAmount);
        
        // Tính tổng tiền sau khi trừ giảm giá
        totalPrice = packagePrice + additionalPrice - discountAmount;
        
        // Đảm bảo tổng tiền không âm
        if (totalPrice < 0) totalPrice = 0;
        
        if (totalPriceEl) totalPriceEl.innerHTML = formatPrice(totalPrice);
        
        // Cập nhật trạng thái của nút đặt dịch vụ
        updateBookingButtonState();
    }

    function formatPrice(price) {
        return price.toLocaleString('vi-VN') + '<sup>đ</sup>';
    }
    
    // Cập nhật trạng thái của nút đặt dịch vụ
    function updateBookingButtonState() {
        const proceedBookingBtn = document.getElementById('proceed-booking');
        if (!proceedBookingBtn) return;
        
        // Kiểm tra các điều kiện cần thiết
        if (selectedPackage && totalPrice > 0) {
            proceedBookingBtn.removeAttribute('disabled');
        } else {
            proceedBookingBtn.setAttribute('disabled', 'disabled');
        }
    }
    
    // Khởi động với giá trị mặc định
    updateBookingButtonState();
    
    // Xuất các hàm và biến cần thiết để sử dụng bên ngoài
    window.BookingData = {
        getSelectedPackage: () => selectedPackage,
        getPackagePrice: () => packagePrice,
        getAdditionalPrice: () => additionalPrice,
        getDiscountAmount: () => discountAmount,
        getTotalPrice: () => totalPrice,
        getSelectedServices: () => selectedServices,
        getAppliedCoupon: () => appliedCoupon,
        formatPrice: formatPrice
    };
}

// Thiết lập sự kiện cho nút đặt dịch vụ
function setupBookingButton() {
    const proceedBookingBtn = document.getElementById('proceed-booking');
    if (!proceedBookingBtn) return;
    
    proceedBookingBtn.addEventListener('click', function() {
        if (this.hasAttribute('disabled')) return;
        
        // Kiểm tra đăng nhập (có thể bỏ qua bước này để demo)
        const isLoggedIn = document.getElementById('userProfileSection') && 
                          !document.getElementById('userProfileSection').classList.contains('d-none');
        
        if (!isLoggedIn) {
            showNotification('Vui lòng đăng nhập để đặt dịch vụ', 'error');
            // Có thể chuyển hướng tới trang đăng nhập
            // window.location.href = 'login.html';
            return;
        }
        
        // Lấy thông tin đặt dịch vụ
        const bookingData = getBookingData();
        
        // Hiển thị modal xác nhận
        showBookingConfirmModal(bookingData);
    });
}

// Lấy thông tin đặt dịch vụ
function getBookingData() {
    // Lấy dữ liệu từ object BookingData nếu có
    const BookingData = window.BookingData || {};
    
    // Lấy gói dịch vụ đã chọn
    const selectedPackage = BookingData.getSelectedPackage ? BookingData.getSelectedPackage() : 
                           document.querySelector('.pricing-card.selected')?.dataset.package;
    
    // Lấy thời gian đã chọn
    const selectedDate = document.getElementById('service-date')?.value;
    const selectedTime = document.querySelector('.time-slot-input:checked')?.value;
    
    // Lấy địa chỉ chi tiết từ text area
    const detailedAddress = document.getElementById('detailed-address')?.value;
    
    // Lấy thông tin địa chỉ từ bản đồ (từ phần tử coordinates)
    const mapCoordinatesEl = document.getElementById('coordinates');
    let mapAddress = '';
    
    if (mapCoordinatesEl) {
        // Trích xuất địa điểm từ phần tử có ID 'coordinates'
        const coordText = mapCoordinatesEl.textContent || '';
        
        // Tìm kiếm địa điểm trong nội dung
        if (coordText.includes('Địa điểm:')) {
            mapAddress = coordText.split('Địa điểm:')[1].split('Kinh độ:')[0].trim();
        } else if (coordText.includes('Vị trí hiện tại:')) {
            mapAddress = coordText.split('Vị trí hiện tại:')[1].split('Kinh độ:')[0].trim();
        }
    }
    
    // Kết hợp địa chỉ từ bản đồ và địa chỉ chi tiết
    const fullAddress = combineAddresses(mapAddress, detailedAddress);
    
    // Lấy giá và dịch vụ thêm
    const packagePrice = BookingData.getPackagePrice ? BookingData.getPackagePrice() :
                        parseInt(document.querySelector('.package-price')?.textContent.replace(/[^\d]/g, '') || 0);
    
    const additionalPrice = BookingData.getAdditionalPrice ? BookingData.getAdditionalPrice() :
                          parseInt(document.querySelector('.additional-price')?.textContent.replace(/[^\d]/g, '') || 0);
    
    const discountAmount = BookingData.getDiscountAmount ? BookingData.getDiscountAmount() :
                         parseInt(document.querySelector('.discount-amount')?.textContent.replace(/[^\d]/g, '') || 0);
    
    const totalPrice = BookingData.getTotalPrice ? BookingData.getTotalPrice() :
                      parseInt(document.querySelector('.total-price')?.textContent.replace(/[^\d]/g, '') || 0);
    
    // Dịch vụ thêm đã chọn
    const selectedServices = BookingData.getSelectedServices ? BookingData.getSelectedServices() : 
                           Array.from(document.querySelectorAll('.add-service-card.selected')).map(card => card.dataset.service);
    
    return {
        selectedPackage,
        selectedDate,
        selectedTime,
        address: {
            detailed: detailedAddress,
            map: mapAddress,
            full: fullAddress
        },
        packagePrice,
        additionalPrice,
        discountAmount,
        totalPrice,
        selectedServices
    };
}

// Hàm kết hợp địa chỉ từ bản đồ và địa chỉ chi tiết
function combineAddresses(mapAddress, detailedAddress) {
    if (!mapAddress && !detailedAddress) {
        return 'Chưa cung cấp';
    }
    
    if (!mapAddress) {
        return detailedAddress;
    }
    
    if (!detailedAddress) {
        return mapAddress;
    }
    
    // Kết hợp cả hai địa chỉ
    return `${detailedAddress}, ${mapAddress}`;
}

// Hiển thị modal xác nhận đặt dịch vụ
function showBookingConfirmModal(bookingData) {
    // Kiểm tra modal đã tồn tại chưa
    const modal = document.getElementById('bookingConfirmModal');
    
    if (!modal) {
        console.error('Không tìm thấy modal xác nhận đặt dịch vụ');
        return;
    }
    
    // Cập nhật nội dung modal
    updateBookingConfirmModal(modal, bookingData);
    
    // Hiển thị modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Cập nhật nội dung modal xác nhận
function updateBookingConfirmModal(modal, bookingData) {
    // Lấy các phần tử cần cập nhật
    const packageEl = modal.querySelector('#summary-package');
    const additionalEl = modal.querySelector('#summary-additional');
    const timeEl = modal.querySelector('#summary-time');
    const addressEl = modal.querySelector('#summary-address');
    const priceEl = modal.querySelector('#summary-price');
    const discountEl = modal.querySelector('#summary-discount');
    const totalEl = modal.querySelector('#summary-total');
    
    // Định dạng cho hiển thị giá
    const formatPrice = window.BookingData?.formatPrice || 
                      ((price) => price.toLocaleString('vi-VN') + '<sup>đ</sup>');
    
    // Tên các gói dịch vụ
    const packageName = 'Gói ' + bookingData.selectedPackage + ' giờ';
    
    // Tên các dịch vụ thêm
    const serviceNames = {
        'cooking': 'Nấu ăn',
        'laundry': 'Giặt đồ'
    };
    
    let additionalServices = 'Không có';
    if (bookingData.selectedServices && bookingData.selectedServices.length > 0) {
        additionalServices = bookingData.selectedServices
            .map(service => serviceNames[service] || service)
            .join(', ');
    }
    
    // Hiển thị thời gian
    const formattedDate = bookingData.selectedDate ? new Date(bookingData.selectedDate).toLocaleDateString('vi-VN') : '';
    const timeString = formattedDate + (bookingData.selectedTime ? ' ' + bookingData.selectedTime : '');
    
    // Cập nhật nội dung
    if (packageEl) packageEl.textContent = packageName;
    if (additionalEl) additionalEl.textContent = additionalServices;
    if (timeEl) timeEl.textContent = timeString;
    
    // Hiển thị địa chỉ đầy đủ
    if (addressEl) {
        const address = bookingData.address?.full || 'Chưa cung cấp';
        addressEl.textContent = address;
    }
    
    if (priceEl) priceEl.innerHTML = formatPrice(bookingData.packagePrice + bookingData.additionalPrice);
    if (discountEl) discountEl.innerHTML = formatPrice(bookingData.discountAmount);
    if (totalEl) totalEl.innerHTML = formatPrice(bookingData.totalPrice);
    
    // Reset checkbox điều khoản
    const termsCheck = modal.querySelector('#terms-check');
    if (termsCheck) termsCheck.checked = false;
    
    // Vô hiệu hóa nút xác nhận
    const confirmBtn = modal.querySelector('#confirm-booking-btn');
    if (confirmBtn) confirmBtn.setAttribute('disabled', 'disabled');
    
    // Thiết lập sự kiện cho checkbox điều khoản
    if (termsCheck && confirmBtn) {
        // Xóa event listener cũ
        const newTermsCheck = termsCheck.cloneNode(true);
        termsCheck.parentNode.replaceChild(newTermsCheck, termsCheck);
        
        newTermsCheck.addEventListener('change', function() {
            if (this.checked) {
                confirmBtn.removeAttribute('disabled');
            } else {
                confirmBtn.setAttribute('disabled', 'disabled');
            }
        });
    }
    
    // Thiết lập sự kiện cho nút xác nhận
    if (confirmBtn) {
        // Xóa tất cả event listeners cũ
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', function() {
            // Đóng modal
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) bootstrapModal.hide();
            
            // Hiển thị thông báo thành công
            showNotification('Đặt dịch vụ thành công! Cảm ơn bạn đã sử dụng dịch vụ của bTaskee.', 'success');
            
            // Có thể chuyển hướng tới trang lịch sử đặt dịch vụ sau vài giây
            setTimeout(() => {
                // window.location.href = 'customerhistory.html';
                console.log('Chuyển hướng tới trang lịch sử đặt dịch vụ');
            }, 3000);
        });
    }
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Kiểm tra container thông báo đã tồn tại chưa
    let container = document.querySelector('.toast-container');
    
    // Nếu chưa có, tạo mới container
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }
    
    // Tạo toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'}`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Hiển thị toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    // Xóa toast sau khi ẩn
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}
