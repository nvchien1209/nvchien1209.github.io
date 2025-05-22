document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tất cả events khi trang load lần đầu
    initAllEvents();
    
    // ===== Hàm khởi tạo tất cả events =====
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
            // Xóa event listener cũ bằng cách clone
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                console.log('Detail button clicked for booking:', this.dataset.id);
                
                // Clear modal trước khi populate dữ liệu mới
                clearModalData();
                
                document.getElementById('modal-booking-id').innerText = this.dataset.id || '';
                document.getElementById('modal-booking-date').innerText = this.dataset.bookingDate || '';
                document.getElementById('modal-execute-date').innerText = this.dataset.executeDate || '';
                document.getElementById('modal-booking-time').innerText = this.dataset.bookingTime || '';
                document.getElementById('modal-service').innerText = this.dataset.service || '';
                document.getElementById('modal-status').innerText = this.dataset.status || '';
                document.getElementById('modal-address').innerText = this.dataset.address || '';
                
                console.log('Discount Amount:', this.dataset.discountAmount);
                console.log('Total:', this.dataset.total);
                
                document.getElementById('modal-total-amount').innerHTML = `<strong>${this.dataset.total || ''} VNĐ</strong>`;
                document.getElementById('modal-discount-amount').innerHTML = `<strong>${this.dataset.discountAmount || ''} VNĐ</strong>`;
                
                // Xử lý payment status
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
                
                // Xử lý staff information
                const staffName = this.dataset.staffNames ? this.dataset.staffNames.split(',') : [];
                const staffPhone = this.dataset.staffPhones ? this.dataset.staffPhones.split(',') : [];
                let staffNameHtml = '';
                for (let i = 0; i < staffName.length; i++) {
                    staffNameHtml += `<div>${staffName[i]} (${staffPhone[i] || ''})</div>`;
                }
                document.getElementById('modal-staff-name').innerHTML = staffNameHtml || 'Chưa phân công';
                
                // Xử lý service details table
                updateServiceDetailsTable(this.dataset);
            });
        });
    }
    
    // ===== Hàm clear modal data =====
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
        
        // Clear service details table
        const tbody = document.querySelector('#modal-service-detail-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
        }
    }
    
    // ===== Hàm update service details table =====
    function updateServiceDetailsTable(dataset) {
        const servicepackage = dataset.servicePackage;
        const serviceAdds = dataset.serviceAdds ? dataset.serviceAdds.split(',') : [];
        const serviceAddsPrice = dataset.serviceAddprice ? dataset.serviceAddprice.split(',') : [];
        const subtotal = parseFloat(dataset.subtotal) || 0;
        
        console.log('Service Package:', servicepackage);
        console.log('Service Adds:', serviceAdds);
        console.log('Service Adds Price:', serviceAddsPrice);
        console.log('Subtotal:', subtotal);
        
        const sumOfAddServicePrice = serviceAddsPrice
            .map(price => parseFloat(price) || 0)
            .reduce((acc, cur) => acc + cur, 0);
        
        console.log('Sum of Additional Services:', sumOfAddServicePrice);
        
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
            // Xóa event listener cũ
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (confirm('Bạn có muốn hủy đơn này không?')) {
                    console.log('Cancelling booking:', this.dataset.id);
                    
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
    
    // ===== Đánh giá sao trong modal =====
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
            // Xóa event listener cũ
            // const newForm = ratingForm.cloneNode(true);
            // ratingForm.parentNode.replaceChild(newForm, ratingForm);
            
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
            
            
            console.log('Applying filters:', { dateRange, status });
            
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
                    
                    // Cập nhật pagination 
                    // const paginationContainer = document.querySelector('.pagination-container');
                    // if (paginationContainer && data.pagination_html) {
                    //     paginationContainer.innerHTML = data.pagination_html;
                    // }

                    
                    
                    console.log('Dữ liệu đã được lọc thành công. Tổng số:', data.total_count);
                } else {
                    console.log('Filter failed:', data);
                    alert('Có lỗi xảy ra khi lọc dữ liệu: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                hideLoading();
                alert('Có lỗi xảy ra khi lọc dữ liệu!');
                console.error('Filter error:', error);
            });
        }
        
        function showLoading() {
            if (historyList) {
                historyList.innerHTML = `
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Đang tải dữ liệu...</p>
                    </div>
                `;
            }
        }
        
        function hideLoading() {
            console.log('Loading hidden');
        }
    }
});

// ===== Xử lý sự kiện phân trang =====
// function initPaginationEvents() {
//     const paginationLinks = document.querySelectorAll('.pagination .page-link');
    
//     paginationLinks.forEach(link => {
        
//         const newLink = link.cloneNode(true);
//         link.parentNode.replaceChild(newLink, link);
        
//         newLink.addEventListener('click', function(e) {
//             e.preventDefault();
            
//             if (this.classList.contains('disabled') || this.parentNode.classList.contains('active')) {
//                 return;
//             }
            
//             const page = this.getAttribute('data-page');
//             if (page) {
//                 loadPage(page);
//             }
//         });
//     });
// }

// function loadPage(page) {
//     const dateRange = document.getElementById('dateRange').value;
//     const status = document.getElementById('status').value;
//     const historyList = document.querySelector('.history-list');
    
//     showLoading();
    
//     const params = new URLSearchParams({
//         dateRange: dateRange,
//         status: status,
//         page: page
//     });
    
//     fetch(`/booking/filter-booking?${params.toString()}`, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             'X-Requested-With': 'XMLHttpRequest'
//         }
//     })
//     .then(response => response.json())
//     .then(data => {
//         hideLoading();
        
//         if (data.success) {
//             historyList.innerHTML = data.html;
            
//             const paginationContainer = document.querySelector('.pagination-container');
//             if (paginationContainer && data.pagination_html) {
//                 paginationContainer.innerHTML = data.pagination_html;
//             }
            
//             initAllEvents();
//             initPaginationEvents();
//         }
//     })
//     .catch(error => {
//         hideLoading();
//         console.error('Pagination error:', error);
//     });
// }