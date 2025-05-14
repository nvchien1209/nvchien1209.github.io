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
                document.getElementById('modal-total-amount').innerHTML = `<strong>${this.dataset.total || ''} VNĐ</strong>`;
                document.getElementById('modal-payment-method').innerText = this.dataset.paymentMethod || '';
                document.getElementById('modal-payment-status').innerText = this.dataset.paymentStatus || '';
                document.getElementById('modal-payment-date').innerText = this.dataset.paymentDate || '';
                document.getElementById('modal-payment-code').innerText = this.dataset.paymentCode || '';
                document.getElementById('modal-rating-score').innerText = this.dataset.rating ? `${this.dataset.rating}/5` : '';
                document.getElementById('modal-rating-date').innerText = this.dataset.ratingDate ? `Đánh giá vào ${this.dataset.ratingDate}` : '';
                document.getElementById('modal-rating-comment').innerText = this.dataset.ratingComment || '';

                // Render rating stars
                const ratingStars = document.getElementById('modal-rating-stars');
                let rating = parseFloat(this.dataset.rating || 0);
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (rating >= i) {
                        starsHtml += '<i class="fas fa-star"></i>';
                    } else if (rating >= i - 0.5) {
                        starsHtml += '<i class="fas fa-star-half-alt"></i>';
                    } else {
                        starsHtml += '<i class="far fa-star"></i>';
                    }
                }
                ratingStars.innerHTML = starsHtml;

                
            });
        });
    });