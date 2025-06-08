document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');

    form.addEventListener('submit', function (e) {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            console.log('Invalid email format');
            emailInput.classList.add('is-invalid');
            e.preventDefault();
        } else {
            console.log('Valid email format');
            emailInput.classList.remove('is-invalid');
        }
    });
    const alertBox = document.querySelector('.alert');
    if (alertBox) {
        setTimeout(function() {
            alertBox.style.display = 'none';
        }, 3000);
    } 
});
