document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo ngày mặc định (ngày mai)
    initDatePicker();
    
    // Khởi tạo Mapbox nếu có các yếu tố bản đồ
    if (document.getElementById('map')) {
        initMapbox();
    }
    
    // Xử lý khi chọn time slot
    setupTimeSlots();
    
    // Khởi tạo các thành phần gói dịch vụ
    initServicePackages();
    
    // Cập nhật button đặt dịch vụ
    updateBookingButton();
});

// Khởi tạo và xử lý các gói dịch vụ
function initServicePackages() {
    // Lấy tất cả các thẻ pricing card
    const pricingCards = document.querySelectorAll('.pricing-card');
    if (pricingCards.length === 0) return;

    // Lấy input ẩn để lưu gói đã chọn
    const selectedPackageInput = document.getElementById('selected-package');

    // Lấy tất cả các thẻ dịch vụ thêm
    const additionalServices = document.querySelectorAll('.add-service-card');

    // Lấy các phần tử hiển thị giá
    const packagePriceEl = document.querySelector('.package-price');
    const additionalPriceEl = document.querySelector('.additional-price');
    const totalPriceEl = document.querySelector('.total-price');

    // Lấy nút đặt dịch vụ
    const proceedBookingBtn = document.getElementById('proceed-booking');

    // Lấy các phần tử trong modal xác nhận
    const summaryPackageEl = document.getElementById('summary-package');
    const summaryAdditionalEl = document.getElementById('summary-additional');
    const summaryTimeEl = document.getElementById('summary-time');
    const summaryTotalEl = document.getElementById('summary-total');

    // Khai báo các biến để lưu trữ thông tin đặt dịch vụ
    let selectedPackage = null;
    let packagePrice = 0;
    let additionalPrice = 0;
    let totalPrice = 0;
    let selectedServices = [];

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

            // Cập nhật giá trị cho input ẩn nếu có
            if (selectedPackageInput) {
                selectedPackageInput.value = selectedPackage;
            }

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
        totalPrice = packagePrice + additionalPrice;
        if (totalPriceEl) totalPriceEl.innerHTML = formatPrice(totalPrice);
        checkBookingButton();
    }

    function formatPrice(price) {
        return price.toLocaleString('vi-VN') + '<sup>đ</sup>';
    }

    function checkBookingButton() {
        if (!proceedBookingBtn) return;
        
        if (selectedPackage && totalPrice > 0) {
            proceedBookingBtn.removeAttribute('disabled');
        } else {
            proceedBookingBtn.setAttribute('disabled', 'true');
        }
    }

    if (proceedBookingBtn) {
        proceedBookingBtn.addEventListener('click', function() {
            const isLoggedIn = document.getElementById('userProfileSection') &&
                             !document.getElementById('userProfileSection').classList.contains('d-none');

            if (!isLoggedIn) {
                alert('Vui lòng đăng nhập để đặt dịch vụ');
                window.location.href = 'login.html';
                return;
            }

            const packageName = 'Gói ' + selectedPackage + ' giờ';
            let additionalNames = 'Không có';

            if (selectedServices.length > 0) {
                const serviceNames = {
                    'cooking': 'Nấu ăn',
                    'laundry': 'Giặt đồ'
                };
                additionalNames = selectedServices.map(service => serviceNames[service]).join(', ');
            }

            let totalTime = parseInt(selectedPackage);

            if (summaryPackageEl) summaryPackageEl.textContent = packageName;
            if (summaryAdditionalEl) summaryAdditionalEl.textContent = additionalNames;
            if (summaryTimeEl) summaryTimeEl.textContent = totalTime + ' giờ';
            if (summaryTotalEl) summaryTotalEl.textContent = formatPrice(totalPrice).replace('<sup>đ</sup>', 'đ');

            const bookingModal = new bootstrap.Modal(document.getElementById('bookingConfirmModal'));
            bookingModal.show();
        });
    }

    const confirmBookingBtn = document.getElementById('confirm-booking-btn');
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', function() {
            const bookingForm = document.getElementById('booking-form');
            if (bookingForm && bookingForm.checkValidity()) {
                alert('Đặt dịch vụ thành công! Cảm ơn bạn đã sử dụng dịch vụ của bTaskee.');
                const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingConfirmModal'));
                if (bookingModal) bookingModal.hide();
                setTimeout(() => {
                    window.location.href = 'customerhistory.html';
                }, 1000);
            } else if (bookingForm) {
                bookingForm.reportValidity();
            }
        });
    }
}

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
            
            // Có thể thêm logic kiểm tra khả dụng của khung giờ dựa trên ngày đã chọn
            checkTimeSlotAvailability(this.value);
        });
    });
}

// Hàm kiểm tra khả dụng của time slot dựa trên ngày đã chọn
function checkTimeSlotAvailability(selectedDate) {
    // Đây là nơi bạn có thể gọi API để kiểm tra khả dụng của khung giờ
    // Ví dụ: Nếu là cuối tuần, một số khung giờ có thể không khả dụng
    
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
        
        // Ví dụ: Vào cuối tuần, khung giờ sớm (8h, 9h) không khả dụng
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

    // Thêm control tìm kiếm nếu MapboxGeocoder có sẵn
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