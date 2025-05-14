// Form validation cho trang đăng nhập
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            let isValid = true;
            const username = document.getElementById('username');
            const password = document.getElementById('password');
            
            // Validate username
            if (username.value.trim() === '') {
                username.classList.add('is-invalid');
                username.classList.remove('is-valid');
                isValid = false;
            } else {
                username.classList.remove('is-invalid');
                username.classList.add('is-valid');
            }
            
            // Validate password
            if (password.value.trim() === '') {
                password.classList.add('is-invalid');
                password.classList.remove('is-valid');
                isValid = false;
            } else {
                password.classList.remove('is-invalid');
                password.classList.add('is-valid');
            }
            
            // Nếu form không hợp lệ, ngăn chặn submit
            if (!isValid) {
                event.preventDefault();
            }
            
            // Form hợp lệ sẽ được submit đến Django để xử lý
        });
    }
});