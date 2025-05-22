document.addEventListener('DOMContentLoaded', function() {
    const detailButtons = document.querySelectorAll('.btn-detail');
    detailButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('modal-booking-id').innerText = this.dataset.id || '';
            document.getElementById('modal-booking-date').innerText = this.dataset.bookingDate || '';
            document.getElementById('modal-execute-date').innerText = this.dataset.executeDate || '';
            document.getElementById('modal-booking-time').innerText = this.dataset.bookingTime || '';
            document.getElementById('modal-service').innerText = this.dataset.service || '';
            document.getElementById('modal-status').innerText = this.dataset.status || '';
            document.getElementById('modal-address').innerText = this.dataset.address || '';
            console.log(this.dataset.discountAmount)
            console.log(this.dataset.total)
            
            document.getElementById('modal-total-amount').innerHTML = `<strong>${this.dataset.total || ''} VNĐ</strong>`;
            document.getElementById('modal-discount-amount').innerHTML = `<strong>${this.dataset.discountAmount || ''} VNĐ</strong>`;
            
            
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
            

            // if(this.dataset.status === 'Hoàn thành' || this.dataset.status === 'Đã xác nhận') {
            //     document.getElementById('modal-staff-name').innerText = this.dataset.staffName || '';
            // }
            const staffName = this.dataset.staffNames ? this.dataset.staffNames.split(',') : [];
            const staffPhone = this.dataset.staffPhones ? this.dataset.staffPhones.split(',') : [];
            let staffNameHtml = '';
            //let staffPhoneHtml = '';
            for (let i = 0; i < staffName.length; i++) {
                staffNameHtml += `<div>${staffName[i]} (${staffPhone[i] || ''})</div>`;
                //staffPhoneHtml += `<div>${staffPhone[i] || ''}</div>`;
            }
            document.getElementById('modal-staff-name').innerHTML = staffNameHtml;
            //document.getElementById('modal-staff-phone').innerHTML = staffPhoneHtml;
            // Hiển thị thông tin gói dịch vụ và dịch vụ bổ sung nếu có
            const servicepackage = this.dataset.servicePackage
            const serviceAdds = this.dataset.serviceAdds ? this.dataset.serviceAdds.split(',') : [];
            const serviceAddsPrice = this.dataset.serviceAddprice ? this.dataset.serviceAddprice.split(',') : [];
            console.log(servicepackage)
            console.log(serviceAdds)
            console.log(serviceAddsPrice)
            const subtotal = this.dataset.subtotal
            console.log(subtotal)
            const sumOfAddServicePrice = serviceAddsPrice
                .map(price => parseFloat(price) || 0)
                .reduce((acc, cur) => acc + cur, 0);
            console.log(sumOfAddServicePrice)
            const tbody = document.querySelector('#modal-service-detail-table tbody');
            tbody.innerHTML = '';
            // Hiển thị gói dịch vụ (nếu có)
            if (servicepackage) {
                const packagePrice = subtotal - sumOfAddServicePrice;
                // Định dạng số tiền theo dạng có dấu phẩy phân cách hàng nghìn
                function formatCurrency(amount) {
                    return amount.toLocaleString('en-US');
                }
                tbody.innerHTML += `
                    <tr>
                        <td>${servicepackage}</td>
                        <td>${formatCurrency(packagePrice)} VNĐ</td>
                        <td>${formatCurrency(packagePrice)} VNĐ</td>
                    </tr>
                `;
            }
            // Hiển thị từng dịch vụ bổ sung là một dòng riêng biệt
            if (serviceAdds.length > 0 && serviceAdds[0] !== "") {
                serviceAdds.forEach((add, idx) => {
                    // Định dạng số tiền theo dạng có dấu phẩy phân cách hàng nghìn
                    function formatCurrency(amount) {
                        return Number(amount).toLocaleString('en-US');
                    }
                    tbody.innerHTML += `
                        <tr>
                            <td>${add}</td>
                            <td>${serviceAddsPrice[idx] ? formatCurrency(serviceAddsPrice[idx]) + ' VNĐ' : ''}</td>
                            <td>${serviceAddsPrice[idx] ? formatCurrency(serviceAddsPrice[idx]) + ' VNĐ' : ''}</td>
                        </tr>
                    `;
                });
            }

        });
    });
    
    // Xử lý hiển thị custom date range
    const dateRangeSelect = document.getElementById('dateRange');
    const customDateRange = document.getElementById('customDateRange');
    
    if (dateRangeSelect && customDateRange) {
        dateRangeSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDateRange.classList.remove('d-none');
            } else {
                customDateRange.classList.add('d-none');
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.btn-outline-danger').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Bạn có muốn hủy đơn này không?')) {
                // Gửi yêu cầu hủy đơn tại đây
                console.log(this.dataset.id)
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
                console.log("Gửi yêu cầu hủy đơn...");
            }
        });
    });
});

// Đánh giá sao trong modal
document.addEventListener('DOMContentLoaded', function () {
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
        scoreSpan.textContent = rating > 0 ? `${rating}/5` : '';
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

    // Reset khi mở modal mới (nếu cần)
    document.getElementById('detailsModal').addEventListener('show.bs.modal', function () {
        selectedRating = 0;
        highlightStars(0);
        document.getElementById('modal-rating-comment-input').value = '';
    });

    // Xử lý submit form đánh giá
    document.getElementById('modal-rating-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (selectedRating === 0) {
            alert('Vui lòng chọn số sao đánh giá!');
            return;
        }
        // Lấy comment
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
        alert(`Bạn đã đánh giá ${selectedRating} sao với bình luận: "${comment}"`);
        
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Sử dụng selector cụ thể hơn để tìm đúng nút lọc
    const filterButton = document.querySelector('button.btn-primary');
    
    if (filterButton) {
        filterButton.addEventListener('click', function (e) {
            const dateRange = document.getElementById('dateRange').value;
            const status = document.getElementById('status').value;
            console.log('Date range:', dateRange);
            console.log('Status:', status);
            const params = new URLSearchParams({
                dateRange: dateRange,
                status: status
            });
            // Gửi yêu cầu AJAX đến server với các tham số lọc
            fetch(`/booking/filter-booking?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Dữ liệu đã được lọc thành công:', data.filteredBookings);
                } else if (data.error) {
                    alert('Có lỗi xảy ra khi lọc dữ liệu: 1' + data.error);
                } else {
                    alert('Có lỗi xảy ra khi lọc dữ liệu!2');
                }
            })
            .catch(error => {
                alert('Có lỗi xảy ra khi lọc dữ liệu3!');
                console.error(error);
            });
        });
    } else {
        console.error('Filter button not found!');
    }
});
