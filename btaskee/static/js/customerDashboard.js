document.addEventListener('DOMContentLoaded', function() {
    // Format date in input field for better display
    const formatDateInput = () => {
        const birthdateInput = document.getElementById('birthdate');
        if (birthdateInput && birthdateInput.value) {
            const date = new Date(birthdateInput.value);
            const formattedDate = date.toISOString().split('T')[0];
            birthdateInput.value = formattedDate;
        }
    };
    
    formatDateInput();
    
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        document.querySelector('.save-btn').addEventListener('click', function(e) {
            e.preventDefault(); // Ngăn hành vi mặc định của button
            // Nếu là button save avatar thì bỏ qua
            if (e.target.id === 'save-avatar') {
                return;
            }
            if (confirm('Bạn có chắc chắn muốn lưu thay đổi?')) {
                profileForm.submit(); // Submit form để gửi dữ liệu
            }
        });
    }
    
    // Password form submission
document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Ngăn form submit mặc định
           
            const currentPass = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;
           
            let errors = [];
           
            // Kiểm tra mật khẩu hiện tại
            if (!currentPass) {
                errors.push('Vui lòng nhập mật khẩu hiện tại');
            }
           
            // Kiểm tra mật khẩu mới có được nhập hay không
            if (!newPass) {
                errors.push('Vui lòng nhập mật khẩu mới');
            }
           
            // Kiểm tra xác nhận mật khẩu có được nhập hay không
            if (!confirmPass) {
                errors.push('Vui lòng xác nhận mật khẩu mới');
            }
           
            // Kiểm tra độ dài mật khẩu mới (chỉ khi đã nhập)
            if (newPass && newPass.length < 8) {
                errors.push('Mật khẩu mới phải có ít nhất 8 ký tự');
            }
           
            // Kiểm tra mật khẩu khớp nhau (chỉ khi cả hai đã được nhập)
            if (newPass && confirmPass && newPass !== confirmPass) {
                errors.push('Mật khẩu mới và xác nhận mật khẩu không khớp');
            }
           
            // Nếu có lỗi, hiển thị lỗi đầu tiên
            if (errors.length > 0) {
                alert(errors[0]);
                return;
            }
           
            // Nếu không có lỗi, xác nhận submit form
            if (confirm('Bạn có chắc chắn muốn cập nhật mật khẩu?')) {
                console.log('Đang gửi form đến server...');
                passwordForm.submit();
            }
            
        });
    } else {
        console.error('Không tìm thấy form mật khẩu');
    }
});
    
    // Avatar change functionality
    const avatarModal = document.getElementById('avatar-modal');
    const editAvatarBtn = document.getElementById('edit-avatar-btn');
    const closeAvatarModal = document.getElementById('close-avatar-modal');
    const cancelAvatar = document.getElementById('cancel-avatar');
    const saveAvatar = document.querySelector('#avatar-modal .save-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarUploadForm = document.getElementById('avatar-upload-form');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    const currentAvatar = document.getElementById('current-avatar');
    
    // Open avatar modal
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', function() {
            if (avatarModal) {
                avatarModal.style.display = 'flex';
                // Thêm dòng này để hiển thị ảnh hiện tại trong preview
                if (avatarPreviewImg && currentAvatar) {
                    avatarPreviewImg.src = currentAvatar.src || '';
                }
            }
        });
    }
    
    // Close avatar modal
    const closeModal = () => {
        if (avatarModal) {
            avatarModal.style.display = 'none';
            if (avatarUpload) {
                avatarUpload.value = '';
            }
            if (avatarPreviewImg && currentAvatar) {
                avatarPreviewImg.src = currentAvatar.src || '';
            }
        }
    };
    
    if (closeAvatarModal) {
        closeAvatarModal.addEventListener('click', closeModal);
    }
    
    if (cancelAvatar) {
        cancelAvatar.addEventListener('click', closeModal);
    }
    
    // Handle image preview when a file is selected
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.match('image.*')) {
                    alert('Vui lòng chọn tệp hình ảnh');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (avatarPreviewImg) {
                        avatarPreviewImg.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Save avatar
    if (saveAvatar) {
        saveAvatar.addEventListener('click', function() {
            if (!avatarUpload || !avatarUpload.files.length) {
                alert('Vui lòng chọn một hình ảnh');
                return;
            }

            if (confirm('Bạn có chắc chắn muốn lưu ảnh đại diện mới?')) {
                avatarUploadForm.submit();  // ✅ Gửi form tới server
            }
    });
}

    
    // Close modal when clicking outside
    if (avatarModal) {
        window.addEventListener('click', function(event) {
            if (event.target === avatarModal) {
                closeModal();
            }
        });
    }

    // Hiển thị thông báo lỗi nếu có
    const showErrors = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        if (error) {
            alert(decodeURIComponent(error));
        }
    };
    
    showErrors();
});

// Tự động tắt message sau 5 giây với hiệu ứng fade
document.addEventListener('DOMContentLoaded', function() {
    const alert = document.querySelector('.alert');
    
    if (alert) {
        setTimeout(function() {
            // Thêm hiệu ứng fade out
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            
            // Xóa element sau khi fade xong
            setTimeout(function() {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 500);
        }, 5000);
    }
});