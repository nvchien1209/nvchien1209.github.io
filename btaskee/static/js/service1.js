
document.addEventListener('DOMContentLoaded', function () {
    // --- Biến lưu trạng thái ---
    let selectedPackage = null;
    let selectedAdditional = [];
    let packagePrices = {}; // {id: {min, max, avg}}
    let additionalPrices = {};
    let discountAmount = 0;

    // --- Lấy giá từ HTML ---
    document.querySelectorAll('.pricing-card').forEach(card => {
        const id = card.id.replace('package-', '');
        const priceText = card.querySelector('.price').innerText.replace(/[^0-9\-đ]/g, '');
        let [min, max] = priceText.split('-').map(s => parseInt(s.trim()));
        let avg = Math.round((min + max) / 2);
        packagePrices[id] = { min: min || 0, max: max || 0, avg: avg || 0 };
    });
    document.querySelectorAll('.add-service-card').forEach(card => {
        const id = card.getAttribute('data-service').replace(' add-service-', '');
        const priceText = card.querySelector('.service-price').innerText.replace(/[^0-9]/g, '');
        additionalPrices[id] = parseInt(priceText) || 0;
    });

    // --- Chọn gói dịch vụ ---
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.addEventListener('click', function () {
            document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPackage = card.id.replace('package-', '');
            updatePrice();
            checkBookingEnable();
        });
    });

    // --- Chọn dịch vụ thêm ---
    document.querySelectorAll('.add-service-card .service-checkbox-input').forEach(cb => {
        cb.addEventListener('change', function () {
            const id = cb.id.replace(' add-service-', '');
            if (cb.checked) {
                if (!selectedAdditional.includes(id)) selectedAdditional.push(id);
            } else {
                selectedAdditional = selectedAdditional.filter(i => i !== id);
            }
            updatePrice();
        });
    });

    // --- Áp dụng mã giảm giá từ server ---
    document.getElementById('apply-coupon').addEventListener('click', function () {
        const code = document.getElementById('coupon-code').value.trim();
        fetch('/api/check-promotion/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, total: getTotalPrice() })
        })
        .then(res => res.json())
        .then(data => {
            if (data.valid) {
                discountAmount = data.discountAmount || 0;
                document.getElementById('coupon-message').innerText = data.message || 'Áp dụng mã giảm giá thành công!';
            } else {
                discountAmount = 0;
                document.getElementById('coupon-message').innerText = data.message || 'Mã giảm giá không hợp lệ.';
            }
            updatePrice();
        })
        .catch(() => {
            discountAmount = 0;
            document.getElementById('coupon-message').innerText = 'Có lỗi khi kiểm tra mã giảm giá.';
            updatePrice();
        });
    });

    // --- Hàm xác định loại ngày và giờ ---
    function getDayTypeAndTime() {
        const dateStr = document.getElementById('service-date').value;
        const timeRadio = document.querySelector('input[name="timeSlot"]:checked');
        if (!dateStr || !timeRadio) return { type: 'min' };

        const date = new Date(dateStr);
        const day = date.getDay(); // 0: Chủ nhật, 6: Thứ 7
        const time = timeRadio.value;
        const hour = parseInt(time.split(':')[0]);

        // Danh sách ngày lễ 
        const holidays = [
            // Định dạng: 'MM-DD'
            '01-01', // Tết dương lịch
            '04-30', // 30/4
            '05-01', // 1/5
            '09-02', // 2/9
        ];
        const mmdd = ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        if (holidays.includes(mmdd)) return { type: 'max' };

        // Cuối tuần
        if (day === 0 || day === 6) return { type: 'avg' };

        // Giờ cao điểm: trước 8h hoặc sau 17h
        if (hour < 8 || hour > 17) return { type: 'avg' };

        // Ngày thường, giờ thường
        return { type: 'min' };
    }

    // --- Tính tổng giá ---
    function getTotalPrice() {
        let pkg = getCurrentPackagePrice();
        let add = selectedAdditional.reduce((sum, id) => sum + (additionalPrices[id] || 0), 0);
        return pkg + add;
    }
    function getCurrentPackagePrice() {
        if (!selectedPackage) return 0;
        const priceObj = packagePrices[selectedPackage];
        const { type } = getDayTypeAndTime();
        if (type === 'max') return priceObj.max;
        if (type === 'avg') return priceObj.avg;
        return priceObj.min;
    }
    function updatePrice() {
        let pkg = getCurrentPackagePrice();
        let add = selectedAdditional.reduce((sum, id) => sum + (additionalPrices[id] || 0), 0);
        let total = pkg + add - discountAmount;
        if (total < 0) total = 0;
        document.querySelector('.package-price').innerHTML = numberWithCommas(pkg) + '<sup>đ</sup>';
        document.querySelector('.additional-price').innerHTML = numberWithCommas(add) + '<sup>đ</sup>';
        document.querySelector('.discount-amount').innerHTML = '-' + numberWithCommas(discountAmount) + '<sup>đ</sup>';
        document.querySelector('.total-price').innerHTML = numberWithCommas(total) + '<sup>đ</sup>';
    }
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // --- Kiểm tra điều kiện đặt dịch vụ ---
    function checkBookingEnable() {
        const date = document.getElementById('service-date').value;
        const time = document.querySelector('input[name="timeSlot"]:checked');
        const address = document.getElementById('detailed-address').value.trim();
        const enable = selectedPackage && date && time && address;
        document.getElementById('proceed-booking').disabled = !enable;
        updatePrice();
    }
    document.getElementById('service-date').addEventListener('change', checkBookingEnable);
    document.querySelectorAll('input[name="timeSlot"]').forEach(radio => {
        radio.addEventListener('change', checkBookingEnable);
    });
    document.getElementById('detailed-address').addEventListener('input', checkBookingEnable);

    // --- Đặt dịch vụ: Hiện modal xác nhận ---
document.getElementById('proceed-booking').addEventListener('click', function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        alert('Vui lòng đăng nhập để đặt dịch vụ.');
        return;
    }
    
    // Tạo modal nếu chưa có
    let modal = document.getElementById('bookingConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bookingConfirmModal';
        modal.className = 'modal fade';
        document.body.appendChild(modal);
    }

    // Lấy thông tin tóm tắt
    const packageName = document.querySelector('.pricing-card.selected h3')?.innerText || '';
    const additionalNames = selectedAdditional.map(id => {
        const el = document.querySelector(`.add-service-card[data-service=" add-service-${id}"] .service-details h3`);
        return el ? el.innerText : '';
    }).filter(Boolean).join(', ') || 'Không có';
    const date = document.getElementById('service-date').value;
    const time = document.querySelector('input[name="timeSlot"]:checked')?.value || '';
    const strongTag = document.querySelector('#coordinates strong');
    // Lấy nội dung địa chỉ từ thẻ bản đồ
    const text = strongTag.textContent;
    // Tách chuỗi sau dấu hai chấm
    const valueAfterColon = text.split(':')[1].trim();
    const address = document.getElementById('detailed-address').value.trim();
    // Nối hai địa chỉ lại
    const fullAddress = address + ', ' + valueAfterColon;
    const price = numberWithCommas(getCurrentPackagePrice()) + 'đ';
    const addPrice = numberWithCommas(selectedAdditional.reduce((sum, id) => sum + (additionalPrices[id] || 0), 0)) + 'đ';
    const discount = discountAmount > 0 ? '-' + numberWithCommas(discountAmount) + 'đ' : '0đ';
    const total = numberWithCommas(getTotalPrice() - discountAmount) + 'đ';
    
    // Nội dung modal
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="bookingConfirmModalLabel">Xác nhận đặt dịch vụ</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="booking-summary p-3 mb-3 bg-light rounded">
                        <h6 class="fw-bold mb-3">Thông tin đặt dịch vụ</h6>
                        <div class="row mb-2">
                            <div class="col-5">Gói dịch vụ:</div>
                            <div class="col-7 fw-bold" id="summary-package">${packageName}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-5">Dịch vụ thêm:</div>
                            <div class="col-7" id="summary-additional">${additionalNames}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-5">Thời gian:</div>
                            <div class="col-7" id="summary-time">${date} ${time}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-5">Địa chỉ:</div>
                            <div class="col-7" id="summary-address">${fullAddress}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-5">Giá dịch vụ:</div>
                            <div class="col-7" id="summary-price">${price} + ${addPrice}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-5">Giảm giá:</div>
                            <div class="col-7 text-success" id="summary-discount">${discount}</div>
                        </div>
                        <div class="row mt-3 pt-2 border-top">
                            <div class="col-5 fw-bold">Tổng cộng:</div>
                            <div class="col-7 fw-bold fs-5 text-primary" id="summary-total">${total}</div>
                        </div>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="terms-check">
                        <label class="form-check-label" for="terms-check">
                            Tôi đồng ý với <a href="#" class="text-decoration-none">điều khoản dịch vụ</a> của bTaskee
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="button" class="btn btn-primary" id="confirm-booking-btn" disabled>Xác nhận đặt dịch vụ</button>
                </div>
            </div>
        </div>
    `;

    // Hiện modal (Bootstrap 5)
    let bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Enable nút xác nhận khi tick đồng ý điều khoản
    modal.querySelector('#terms-check').addEventListener('change', function () {
        modal.querySelector('#confirm-booking-btn').disabled = !this.checked;
    });

    // Xử lý xác nhận đặt dịch vụ
    modal.querySelector('#confirm-booking-btn').addEventListener('click', function () {
        // Gửi dữ liệu đặt dịch vụ lên server
        const bookingData = {
            packageId: selectedPackage,
            additionalServices: selectedAdditional,
            date: document.getElementById('service-date').value,
            time: document.querySelector('input[name="timeSlot"]:checked')?.value || '',
            address: fullAddress,
            coupon: document.getElementById('coupon-code').value.trim(),
            sub_total: getTotalPrice(),
            
        };
        

        fetch('/api/create-booking/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.');
            } else {
                alert(data.message || 'Có lỗi xảy ra khi đặt dịch vụ.');
            }
        })
        .catch(() => {
            alert('Không thể kết nối tới máy chủ.');
        });
        console.log(bookingData['sub_total'])
        bsModal.hide();
        
    });

});


    // --- Mapbox: lấy vị trí khi click bản đồ ---
    if (window.mapboxgl) {
        mapboxgl.accessToken = 'pk.eyJ1IjoibnZjaGllbjEyMDkiLCJhIjoiY205Mmtxd3RvMDcxbjJqcjB5dXlhNGx1YSJ9.mMJ6doC8SILJcae6RU44Gw';
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [106.660172, 10.762622], // Tọa độ mặc định (TP.HCM)
            zoom: 12
        });
        let marker = null;
        map.on('click', function (e) {
            const lng = e.lngLat.lng.toFixed(6);
            const lat = e.lngLat.lat.toFixed(6);
            document.getElementById('coordinates').innerText = `Vị trí: ${lat}, ${lng}`;
            if (marker) marker.remove();
            marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
        });
    }
});

