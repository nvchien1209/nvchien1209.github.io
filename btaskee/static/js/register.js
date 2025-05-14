
        // Client-side Validation
        document.getElementById('registerForm').addEventListener('submit', function(event) {
            let isValid = true;
            const username = document.getElementById('username');
            const password = document.getElementById('password');
            const phone = document.getElementById('phone');
            const email = document.getElementById('email');

            // Reset validation states
            [username, password, phone, email].forEach(field => {
                field.classList.remove('is-invalid', 'is-valid');
            });

            // Validate username
            if (username.value.trim().length < 5) {
                username.classList.add('is-invalid');
                isValid = false;
            }

            // Validate password
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password.value)) {
                password.classList.add('is-invalid');
                isValid = false;
            }

            // Validate phone
            const phoneRegex = /^(0|\+84)(\d{9,10})$/;
            if (!phoneRegex.test(phone.value)) {
                phone.classList.add('is-invalid');
                isValid = false;
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                email.classList.add('is-invalid');
                isValid = false;
            }

            if (!isValid) {
                event.preventDefault();
            }
        });
    