// verify_code.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('verifyCodeForm');
    const codeInput = document.getElementById('verification_code');
    const passwordInput = document.getElementById('new_password');
    const confirmPasswordInput = document.getElementById('confirm_password');

    // Chỉ cho phép nhập số cho mã xác nhận
    codeInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        
        if (e.target.value.length === 6) {
            e.target.classList.remove('is-invalid');
            e.target.classList.add('is-valid');
        } else {
            e.target.classList.remove('is-valid');
        }
    });
    // Kiểm tra mã xác nhận hợp lệ khi nhập
    // Kiểm tra hợp lệ khi submit form
    form.addEventListener('submit', function(e) {
        let isValid = true;

        // Đặt lại trạng thái kiểm tra hợp lệ cho các trường
        [codeInput, passwordInput, confirmPasswordInput].forEach(input => {
            input.classList.remove('is-invalid');
        });

        // Kiểm tra mã xác nhận
        if (!codeInput.value.trim() || codeInput.value.length !== 8) {
            codeInput.classList.add('is-invalid');
            isValid = false;
        }

        // Kiểm tra mật khẩu mới
        if (!passwordInput.value.trim() || passwordInput.value.length < 8) {
            passwordInput.classList.add('is-invalid');
            passwordInput.nextElementSibling.textContent = 'Mật khẩu phải có ít nhất 8 ký tự.';
            isValid = false;
        }

        // Kiểm tra xác nhận mật khẩu
        if (!confirmPasswordInput.value.trim()) {
            confirmPasswordInput.classList.add('is-invalid');
            isValid = false;
        } else if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.classList.add('is-invalid');
            confirmPasswordInput.nextElementSibling.textContent = 'Mật khẩu xác nhận không khớp.';
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
        }
    });

    // Kiểm tra khớp mật khẩu theo thời gian thực
    confirmPasswordInput.addEventListener('input', function() {
        if (this.value === passwordInput.value && this.value.length >= 6) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
        }
    });

    // Kiểm tra hợp lệ mật khẩu mới theo thời gian thực
    passwordInput.addEventListener('input', function() {
        if (this.value.length >= 6) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            
            // Kiểm tra lại xác nhận mật khẩu
            if (confirmPasswordInput.value && confirmPasswordInput.value === this.value) {
                confirmPasswordInput.classList.remove('is-invalid');
                confirmPasswordInput.classList.add('is-valid');
            }
        } else {
            this.classList.remove('is-valid');
        }
    });
});