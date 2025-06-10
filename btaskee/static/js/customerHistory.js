document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tất cả các sự kiện khi trang được tải lần đầu
    initAllEvents();
    
    // ===== Hàm khởi tạo tất cả các sự kiện =====
    function initAllEvents() {
        initDetailModalEvents();
        initCancelBookingEvents();
        initRatingEvents();
        initFilterEvents();
        
    }
    
    // ===== Xử lý sử dụng bootstrap modal =====
    function initDetailModalEvents() {
        const detailButtons = document.querySelectorAll('.btn-detail');
        detailButtons.forEach(btn => {
            // Xóa event listener cũ bằng cách clone node
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                console.log('Đã nhấn nút xem chi tiết cho booking:', this.dataset.id);
                
                // Xóa dữ liệu modal trước khi hiển thị dữ liệu mới
                clearModalData();
                
                document.getElementById('modal-booking-id').innerText = this.dataset.id || '';
                document.getElementById('modal-booking-date').innerText = this.dataset.bookingDate || '';
                document.getElementById('modal-execute-date').innerText = this.dataset.executeDate || '';
                document.getElementById('modal-booking-time').innerText = this.dataset.bookingTime || '';
                document.getElementById('modal-service').innerText = this.dataset.service || '';
                document.getElementById('modal-status').innerText = this.dataset.status || '';
                document.getElementById('modal-address').innerText = this.dataset.address || '';
                
                console.log('Số tiền giảm giá:', this.dataset.discountAmount);
                console.log('Tổng tiền:', this.dataset.total);
                
                document.getElementById('modal-total-amount').innerHTML = `<strong>${this.dataset.total || ''} VNĐ</strong>`;
                document.getElementById('modal-discount-amount').innerHTML = `<strong>${this.dataset.discountAmount || ''} VNĐ</strong>`;
                
                // Xử lý trạng thái thanh toán
                if (this.dataset.paymentStatus === 'Chưa thanh toán') {
                    document.getElementById('modal-payment-status').innerText = 'Chưa thanh toán';
                    document.getElementById('modal-payment-method').innerText = '';
                    document.getElementById('modal-payment-date').innerText = '';
                    document.getElementById('modal-payment-code').innerText = '';
                } else {
                    document.getElementById('modal-payment-status').innerText = 'Đã thanh toán';
                    document.getElementById('modal-payment-method').innerText = this.dataset.paymentMethod || '';
                    document.getElementById('modal-payment-date').innerText = this.dataset.paymentDate || '';
                    document.getElementById('modal-payment-code').innerText = this.dataset.paymentCode || '';
                }
                
                // Xử lý thông tin nhân viên
                const staffName = this.dataset.staffNames ? this.dataset.staffNames.split(',') : [];
                const staffPhone = this.dataset.staffPhones ? this.dataset.staffPhones.split(',') : [];
                let staffNameHtml = '';
                for (let i = 0; i < staffName.length; i++) {
                    staffNameHtml += `<div>${staffName[i]} (${staffPhone[i] || ''})</div>`;
                }
                document.getElementById('modal-staff-name').innerHTML = staffNameHtml || 'Chưa phân công';
                
                // Xử lý bảng chi tiết dịch vụ
                updateServiceDetailsTable(this.dataset);
            });
        });
    }
    
    // ===== Hàm xóa dữ liệu modal =====
    function clearModalData() {
        const elementsToReset = [
            'modal-booking-id', 'modal-booking-date', 'modal-execute-date',
            'modal-booking-time', 'modal-service', 'modal-status',
            'modal-address', 'modal-payment-status', 'modal-payment-method',
            'modal-payment-date', 'modal-payment-code', 'modal-total-amount',
            'modal-staff-name', 'modal-discount-amount'
        ];
        
        elementsToReset.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '';
            }
        });
        
        // Xóa bảng chi tiết dịch vụ
        const tbody = document.querySelector('#modal-service-detail-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
        }
    }
    
    // ===== Hàm cập nhật bảng chi tiết dịch vụ =====
    function updateServiceDetailsTable(dataset) {
        const servicepackage = dataset.servicePackage;
        const serviceAdds = dataset.serviceAdds ? dataset.serviceAdds.split(',') : [];
        const serviceAddsPrice = dataset.serviceAddprice ? dataset.serviceAddprice.split(',') : [];
        const subtotal = parseFloat(dataset.subtotal) || 0;
        
        console.log('Gói dịch vụ:', servicepackage);
        console.log('Dịch vụ bổ sung:', serviceAdds);
        console.log('Giá dịch vụ bổ sung:', serviceAddsPrice);
        console.log('Tạm tính:', subtotal);
        
        const sumOfAddServicePrice = serviceAddsPrice
            .map(price => parseFloat(price) || 0)
            .reduce((acc, cur) => acc + cur, 0);
        
        console.log('Tổng giá dịch vụ bổ sung:', sumOfAddServicePrice);
        
        const tbody = document.querySelector('#modal-service-detail-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Định dạng số tiền
        function formatCurrency(amount) {
            return Number(amount).toLocaleString('en-US');
        }
        
        // Hiển thị gói dịch vụ (nếu có)
        if (servicepackage) {
            const packagePrice = subtotal - sumOfAddServicePrice;
            tbody.innerHTML += `
                <tr>
                    <td>${servicepackage}</td>
                    <td>${formatCurrency(packagePrice)} VNĐ</td>
                    <td>${formatCurrency(packagePrice)} VNĐ</td>
                </tr>
            `;
        }
        
        // Hiển thị từng dịch vụ bổ sung
        if (serviceAdds.length > 0 && serviceAdds[0] !== "") {
            serviceAdds.forEach((add, idx) => {
                const price = parseFloat(serviceAddsPrice[idx]) || 0;
                tbody.innerHTML += `
                    <tr>
                        <td>${add}</td>
                        <td>${formatCurrency(price)} VNĐ</td>
                        <td>${formatCurrency(price)} VNĐ</td>
                    </tr>
                `;
            });
        }
    }
    
    // ===== Xử lý sự kiện hủy đơn =====
    function initCancelBookingEvents() {
        const cancelButtons = document.querySelectorAll('.btn-outline-danger');
        cancelButtons.forEach(btn => {
            // Xóa event listener cũ bằng cách clone node
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (confirm('Bạn có muốn hủy đơn này không?')) {
                    console.log('Đang hủy booking:', this.dataset.id);
                    
                    fetch(`/booking/destroy-booking/${this.dataset.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Đã hủy đơn thành công!');
                            location.reload();
                        } else {
                            alert('Hủy đơn thất bại!');
                        }
                    })
                    .catch(error => {
                        alert('Có lỗi xảy ra khi hủy đơn!');
                        console.error(error);
                    });
                }
            });
        });
    }
    
    // ===== Xử lý đánh giá sao trong modal =====
    function initRatingEvents() {
        const stars = document.querySelectorAll('#modal-rating-stars .star-select');
        const scoreSpan = document.getElementById('modal-rating-score');
        let selectedRating = 0;

        function highlightStars(rating) {
            stars.forEach(star => {
                const value = parseInt(star.getAttribute('data-value'));
                if (value <= rating) {
                    star.classList.add('text-warning');
                } else {
                    star.classList.remove('text-warning');
                }
            });
            if (scoreSpan) {
                scoreSpan.textContent = rating > 0 ? `${rating}/5` : '';
            }
        }

        stars.forEach(star => {
            star.addEventListener('mouseenter', function () {
                const rating = parseInt(this.getAttribute('data-value'));
                highlightStars(rating);
            });
            star.addEventListener('mouseleave', function () {
                highlightStars(selectedRating);
            });
            star.addEventListener('click', function () {
                selectedRating = parseInt(this.getAttribute('data-value'));
                highlightStars(selectedRating);
            });
        });

        // Reset khi mở modal mới
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal) {
            detailsModal.addEventListener('show.bs.modal', function () {
                selectedRating = 0;
                highlightStars(0);
                const commentInput = document.getElementById('modal-rating-comment-input');
                if (commentInput) {
                    commentInput.value = '';
                }
            });
        }

        // Xử lý submit form đánh giá
        const ratingForm = document.getElementById('modal-rating-form');
        if (ratingForm) {
            // Không cần xóa event listener cũ vì chỉ có 1 form
            ratingForm.addEventListener('submit', function (e) {
                e.preventDefault();
                if (selectedRating === 0) {
                    alert('Vui lòng chọn số sao đánh giá!');
                    return;
                }
                
                const comment = document.getElementById('modal-rating-comment-input').value;
                const bookingId = document.getElementById('modal-booking-id').innerText;
                
                fetch('/booking/rate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        bookingId: bookingId,
                        rating: selectedRating,
                        comment: comment
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Đánh giá thành công!');
                        location.reload();
                    } else {
                        alert('Đánh giá thất bại!');
                    }
                })
                .catch(error => {
                    alert('Có lỗi xảy ra khi gửi đánh giá!');
                    console.error(error);
                });
            });
        }
    }
    
    // ===== Xử lý sự kiện lọc booking =====
    function initFilterEvents() {
        const filterButton = document.querySelector('button.btn-primary');
        const historyList = document.querySelector('.history-list');
        
        if (filterButton) {
            filterButton.addEventListener('click', function(e) {
                e.preventDefault();
                applyFilters();
            });
        }
        
        function applyFilters() {
            const dateRange = document.getElementById('dateRange').value;
            const status = document.getElementById('status').value;
            
            
            console.log('Đang áp dụng bộ lọc:', { dateRange, status });
            
            // Hiển thị loading
            showLoading();
            
            const params = new URLSearchParams({
                dateRange: dateRange,
                status: status,
                
            });

            fetch(`/booking/filter-booking?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.success) {
                    // Cập nhật danh sách booking
                    historyList.innerHTML = data.html;
                                        
                    console.log('Dữ liệu đã được lọc thành công. Tổng số:', data.total_count);
                } else {
                    console.log('Lọc thất bại:', data);
                    alert('Có lỗi xảy ra khi lọc dữ liệu: ' + (data.error || 'Lỗi không xác định'));
                }
            })
            .catch(error => {
                hideLoading();
                alert('Có lỗi xảy ra khi lọc dữ liệu!');
                console.error('Lỗi lọc:', error);
            });
        }
        
        function showLoading() {
            if (historyList) {
                historyList.innerHTML = `
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Đang tải...</span>
                        </div>
                        <p class="mt-2">Đang tải dữ liệu...</p>
                    </div>
                `;
            }
        }
        
        function hideLoading() {
            console.log('Đã ẩn loading');
        }
    }
});
