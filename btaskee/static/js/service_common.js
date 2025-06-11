
// Khởi tạo các thành phần chung khi trang tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo ngày mặc định (ngày mai)
    initDatePicker();
    
    // Khởi tạo Mapbox nếu có các yếu tố bản đồ
    if (document.getElementById('map')) {
        initMapbox();
    }
    
    // Xử lý khi chọn time slot
    setupTimeSlots();
    
    // Cập nhật button đặt dịch vụ
    updateBookingButton();
});

// ===== DATE PICKER =====

// Hàm khởi tạo date picker
function initDatePicker() {
    // Tìm kiếm tất cả các input date cần xử lý
    const dateInputs = [
        document.getElementById('booking-date'),
        document.getElementById('service-date')
    ].filter(input => input !== null);
    
    if (dateInputs.length === 0) return;
    
    // Lấy ngày mai
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format ngày theo định dạng yyyy-mm-dd
    const formattedDate = tomorrow.toISOString().split('T')[0];
    
    // Áp dụng cho tất cả các input date
    dateInputs.forEach(dateInput => {
        // Cài đặt giá trị mặc định và giá trị tối thiểu
        dateInput.value = formattedDate;
        dateInput.min = formattedDate;
        
        // Thêm sự kiện change
        dateInput.addEventListener('change', function() {
            // Cập nhật trạng thái của button đặt dịch vụ
            updateBookingButton();
            
            // Kiểm tra khả dụng của khung giờ dựa trên ngày đã chọn
            checkTimeSlotAvailability(this.value);
        });
    });
}

// ===== TIME SLOTS =====

// Hàm kiểm tra khả dụng của time slot dựa trên ngày đã chọn
function checkTimeSlotAvailability(selectedDate) {
    // Gọi API để kiểm tra khả dụng của khung giờ
    // Nếu là cuối tuần, một số khung giờ có thể không khả dụng
    
    const date = new Date(selectedDate);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    const timeSlots = document.querySelectorAll('.time-slot-item');
    if (timeSlots.length === 0) return;
    
    timeSlots.forEach(slot => {
        if (!slot) return;
        
        const time = slot.dataset.time;
        const input = slot.querySelector('input');
        const label = slot.querySelector('label');
        
        if (!input || !label) return;
        
        // Vào cuối tuần, khung giờ sớm (8h, 9h) không khả dụng
        if (isWeekend && (time === '08:00' || time === '09:00')) {
            input.disabled = true;
            label.classList.add('disabled');
            if (input.checked) {
                input.checked = false;
            }
        } else {
            input.disabled = false;
            label.classList.remove('disabled');
        }
    });
}

// Hàm thiết lập time slots
function setupTimeSlots() {
    const timeSlots = document.querySelectorAll('.time-slot-input');
    if (timeSlots.length === 0) return;
    
    timeSlots.forEach(slot => {
        if (!slot) return;
        
        slot.addEventListener('change', function() {
            // Cập nhật trạng thái của button đặt dịch vụ
            updateBookingButton();
        });
    });
}

// ===== BOOKING BUTTON =====

// Hàm cập nhật trạng thái của button đặt dịch vụ
function updateBookingButton() {
    const proceedBookingBtn = document.getElementById('proceed-booking');
    if (!proceedBookingBtn) return;
    
    // Lấy trạng thái của các trường bắt buộc
    const selectedPackage = document.querySelector('.pricing-card.selected');
    
    // Kiểm tra input date (có thể là booking-date hoặc service-date)
    const dateInput = document.getElementById('service-date') || document.getElementById('booking-date');
    const selectedDate = dateInput && dateInput.value;
    
    const selectedTime = document.querySelector('.time-slot-input:checked');
    const detailedAddress = document.getElementById('detailed-address') && 
                           document.getElementById('detailed-address').value.trim();
    
    // Kiểm tra tất cả các trường bắt buộc
    // Nếu đang ở trang có bản đồ, thì có thể không cần nhập địa chỉ chi tiết
    const hasMap = document.getElementById('map');
    const addressRequired = !hasMap && detailedAddress;
    
    if (selectedPackage && selectedDate && (selectedTime || !document.querySelector('.time-slot-input')) && 
        (addressRequired || hasMap || !document.getElementById('detailed-address'))) {
        proceedBookingBtn.removeAttribute('disabled');
    } else {
        proceedBookingBtn.setAttribute('disabled', 'true');
    }
}

// Xử lý sự kiện khi nhập địa chỉ chi tiết
const detailedAddressInput = document.getElementById('detailed-address');
if (detailedAddressInput) {
    detailedAddressInput.addEventListener('input', updateBookingButton);
}

// ===== MAPBOX =====

// Hàm khởi tạo Mapbox
function initMapbox() {
    // Kiểm tra các yếu tố cần thiết cho Mapbox
    if (typeof mapboxgl === 'undefined' || !document.getElementById('map')) {
        console.error('Mapbox không khả dụng hoặc không tìm thấy phần tử bản đồ');
        return;
    }
    
    // 🔐 Token Mapbox
    mapboxgl.accessToken = 'pk.eyJ1IjoibnZjaGllbjEyMDkiLCJhIjoiY205Mmtxd3RvMDcxbjJqcjB5dXlhNGx1YSJ9.mMJ6doC8SILJcae6RU44Gw';

    // Khởi tạo bản đồ
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [105.8544441, 21.028511], // Hà Nội
        zoom: 12
    });

    // Biến toàn cục cho markers
    let marker;
    let currentLocationMarker;

    // Thêm control tìm kiếm MapboxGeocoder có sẵn
    if (typeof MapboxGeocoder !== 'undefined') {
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false,
            placeholder: 'Tìm kiếm địa chỉ...',
            language: 'vi',
            countries: 'vn'
        });
        map.addControl(geocoder, 'top-left');
        
        // Xử lý sự kiện tìm kiếm
        geocoder.on('result', e => handleSearchResult(e.result));
    }

    // Thêm nút định vị
    const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
        showAccuracyCircle: false
    });
    map.addControl(geolocateControl, 'top-left');

    // Xử lý sự kiện click trên bản đồ
    map.on('click', e => handleMapClick(e.lngLat));
    
    // Xử lý sự kiện định vị
    geolocateControl.on('geolocate', e => {
        const lng = e.coords.longitude;
        const lat = e.coords.latitude;
        handleGeolocate({lng, lat});
    });

    /**
     * Xử lý kết quả tìm kiếm
     * @param {Object} result - Kết quả tìm kiếm
     */
    function handleSearchResult(result) {
        updateMarker(result.center, result.place_name, 'red');
        updateBookingButton();
    }

    /**
     * Xử lý khi người dùng click vào bản đồ
     * @param {Object} lngLat - Đối tượng kinh độ vĩ độ
     */
    function handleMapClick(lngLat) {
        if (marker) {
            marker.setLngLat(lngLat);
        } else {
            marker = new mapboxgl.Marker().setLngLat(lngLat).addTo(map);
        }

        getPlaceInfo([lngLat.lng, lngLat.lat], 'click');
        updateBookingButton();
    }

    /**
     * Xử lý khi người dùng sử dụng tính năng định vị
     * @param {Object} lngLat - Đối tượng kinh độ vĩ độ
     */
    function handleGeolocate(lngLat) {
        const coordinates = [lngLat.lng, lngLat.lat];
        if (currentLocationMarker) currentLocationMarker.remove();
        currentLocationMarker = new mapboxgl.Marker({ color: '#00FF00' }).setLngLat(coordinates).addTo(map);
        getPlaceInfo(coordinates, 'current');
        updateBookingButton();
    }

    /**
     * Lấy thông tin địa điểm từ tọa độ
     * @param {Array} lngLat - Mảng [kinh độ, vĩ độ]
     * @param {string} type - Loại vị trí (click, current, search)
     */
    function getPlaceInfo(lngLat, type) {
        const reverseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat[0]},${lngLat[1]}.json?access_token=${mapboxgl.accessToken}&language=vi`;

        fetch(reverseUrl)
            .then(res => res.json())
            .then(data => {
                const features = data.features;
                let placeName = "Không xác định";

                // Ưu tiên lấy tên địa điểm đặc biệt (POI)
                const poi = features.find(f => f.place_type.includes("poi"));
                if (poi) {
                    placeName = poi.place_name;
                } else if (features.length > 0) {
                    placeName = features[0].place_name;
                }

                updateInfo(placeName, lngLat, type);
            })
            .catch(err => {
                console.error('Lỗi khi gọi reverse geocoding:', err);
                document.getElementById('coordinates').innerHTML = "Không thể lấy thông tin địa điểm.";
            });
    }

    /**
     * Cập nhật thông tin vị trí trên giao diện
     * @param {string} placeName - Tên địa điểm
     * @param {Array} lngLat - Mảng [kinh độ, vĩ độ]
     * @param {string} type - Loại vị trí (click, current, search)
     */
    function updateInfo(placeName, lngLat, type) {
        const coordinatesElement = document.getElementById('coordinates');
        if (!coordinatesElement) return;
        
        const prefix = type === 'current' ? 'Vị trí hiện tại: ' : 'Địa điểm: ';
        coordinatesElement.innerHTML = `
            <strong>${prefix}${placeName}</strong><br>
            <strong>Kinh độ:</strong> ${lngLat[0].toFixed(6)}<br>
            <strong>Vĩ độ:</strong> ${lngLat[1].toFixed(6)}
        `;
        
        // Cập nhật input ẩn nếu có
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.value = placeName;
        }
        
        map.flyTo({ center: lngLat, zoom: 15 });
    }

    /**
     * Cập nhật marker từ kết quả tìm kiếm
     * @param {Array} lngLat - Mảng [kinh độ, vĩ độ]
     * @param {string} placeName - Tên địa điểm
     * @param {string} color - Màu của marker
     */
    function updateMarker(lngLat, placeName, color) {
        if (marker) marker.remove();
        marker = new mapboxgl.Marker({ color: color || '#FF0000' }).setLngLat(lngLat).addTo(map);
        updateInfo(placeName, lngLat, 'search');
    }
}

// ===== COUPON HANDLING =====

// Danh sách mã giảm giá chung
const validCoupons = {
    'WELCOME10': { type: 'percentage', value: 10, maxDiscount: 30000 },
    'TASKER20': { type: 'percentage', value: 20, maxDiscount: 50000 },
    'NEWYEAR': { type: 'fixed', value: 25000 },
    'FIRSTORDER': { type: 'percentage', value: 15, maxDiscount: 40000 }
};

/**
 * Khởi tạo xử lý mã giảm giá
 * @param {Object} options - Các tùy chọn
 * @param {Function} options.onSuccess - Callback khi áp dụng mã thành công
 * @param {Function} options.onError - Callback khi áp dụng mã thất bại
 * @param {Function} options.calculateTotalPrice - Hàm tính tổng tiền
 */
function initCouponHandling(options = {}) {
    const couponInput = document.getElementById('coupon-code');
    const applyCouponBtn = document.getElementById('apply-coupon');
    const couponMessageEl = document.getElementById('coupon-message');
    
    if (!couponInput || !applyCouponBtn) return;
    
    let appliedCoupon = null;
    
    // Hàm áp dụng mã giảm giá
    function applyCoupon() {
        if (!couponInput || !couponMessageEl) return;
        
        const couponCode = couponInput.value.trim().toUpperCase();
        
        // Xóa thông báo trước đó
        couponMessageEl.textContent = '';
        couponMessageEl.className = 'coupon-message mt-1';
        
        // Kiểm tra mã trống
        if (!couponCode) {
            displayCouponMessage('Vui lòng nhập mã giảm giá', 'error');
            if (options.onError) options.onError('empty_coupon');
            return;
        }
        
        // Kiểm tra mã đã được áp dụng
        if (appliedCoupon === couponCode) {
            displayCouponMessage('Mã giảm giá đã được áp dụng', 'error');
            if (options.onError) options.onError('already_applied');
            return;
        }
        
        // Kiểm tra mã có hợp lệ không
        if (!validCoupons[couponCode]) {
            displayCouponMessage('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
            if (options.onError) options.onError('invalid_coupon');
            return;
        }
        
        // Tính toán số tiền giảm giá
        const couponInfo = validCoupons[couponCode];
        let totalPrice = 0;
        
        // Sử dụng callback để lấy tổng tiền nếu có
        if (options.calculateTotalPrice) {
            totalPrice = options.calculateTotalPrice();
        }
        
        let calculatedDiscount = 0;
        
        if (couponInfo.type === 'percentage') {
            calculatedDiscount = totalPrice * couponInfo.value / 100;
            
            // Kiểm tra nếu vượt quá giá trị giảm tối đa
            if (couponInfo.maxDiscount && calculatedDiscount > couponInfo.maxDiscount) {
                calculatedDiscount = couponInfo.maxDiscount;
            }
        } else if (couponInfo.type === 'fixed') {
            calculatedDiscount = couponInfo.value;
            
            // Nếu giảm giá lớn hơn tổng tiền, chỉ giảm tối đa bằng tổng tiền
            if (calculatedDiscount > totalPrice) {
                calculatedDiscount = totalPrice;
            }
        }
        
        // Cập nhật mã đã áp dụng
        appliedCoupon = couponCode;
        
        // Hiển thị thông báo thành công
        displayCouponMessage('Áp dụng mã giảm giá thành công!', 'success');
        
        // Gọi callback nếu được cung cấp
        if (options.onSuccess) {
            options.onSuccess(couponCode, calculatedDiscount, couponInfo);
        }
    }
    
    // Hàm hiển thị thông báo mã giảm giá
    function displayCouponMessage(message, type) {
        if (!couponMessageEl) return;
        
        couponMessageEl.textContent = message;
        couponMessageEl.className = `coupon-message mt-1 ${type}`;
    }
    
    // Thêm sự kiện cho nút áp dụng mã giảm giá
    applyCouponBtn.addEventListener('click', applyCoupon);
    
    // Cho phép người dùng nhấn Enter để áp dụng mã
    couponInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            applyCoupon();
        }
    });
    
    // Trả về các hàm để tương tác từ bên ngoài
    return {
        applyCoupon,
        displayCouponMessage,
        getAppliedCoupon: () => appliedCoupon,
        resetCoupon: () => {
            appliedCoupon = null;
            couponInput.value = '';
            couponMessageEl.textContent = '';
            couponMessageEl.className = 'coupon-message mt-1';
        }
    };
}

// Xuất các hàm để sử dụng từ các file khác
window.ServiceBooking = {
    initDatePicker,
    setupTimeSlots,
    checkTimeSlotAvailability,
    updateBookingButton,
    initMapbox,
    initCouponHandling,
    validCoupons
};