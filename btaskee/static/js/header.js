document.addEventListener('DOMContentLoaded', function() {
  // Xử lý hiển thị dropdown cấp 2 trên desktop
  const dropdownSubmenus = document.querySelectorAll('.dropdown-submenu');
  
  dropdownSubmenus.forEach(function(submenu) {
    submenu.addEventListener('mouseenter', function() {
      const dropdown = this.querySelector('.dropdown-menu');
      if (window.innerWidth > 992) {
        dropdown.classList.add('show');
      }
    });
    
    submenu.addEventListener('mouseleave', function() {
      const dropdown = this.querySelector('.dropdown-menu');
      if (window.innerWidth > 992) {
        dropdown.classList.remove('show');
      }
    });
    
    // Xử lý click trên mobile
    const dropdownToggle = submenu.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
          e.preventDefault();
          e.stopPropagation();
          const dropdown = this.nextElementSibling;
          dropdown.classList.toggle('show');
        }
      });
    }
  });

  // Lấy các phần tử cần thao tác
  const userProfileSection = document.getElementById('userProfileSection');
  const authButtonsSection = document.getElementById('authButtonsSection');
  const logoutButton = document.getElementById('logoutButton');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  // Kiểm tra trạng thái đăng nhập từ localStorage
  const checkLoginStatus = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (isLoggedIn && userData) {
          // Cập nhật thông tin người dùng
          if (userData.name) {
              userName.textContent = userData.name;
          }
          if (userData.avatar) {
              userAvatar.src = userData.avatar;
          } 
          
          // Hiển thị phần profile và ẩn phần auth buttons
          userProfileSection.classList.remove('d-none');
          authButtonsSection.classList.add('d-none');
      } else {
          // Hiển thị phần auth buttons và ẩn phần profile
          userProfileSection.classList.add('d-none');
          authButtonsSection.classList.remove('d-none');
      }
  };
  
  // Xử lý hiển thị dropdown trên mobile
  if (window.innerWidth < 992) {
      document.querySelectorAll('.dropdown-submenu').forEach(function(element) {
          element.addEventListener('click', function(e) {
              e.stopPropagation();
              let subMenu = this.querySelector('.dropdown-menu');
              if (subMenu) {
                  if (subMenu.style.display === 'block') {
                      subMenu.style.display = 'none';
                  } else {
                      subMenu.style.display = 'block';
                  }
              }
          });
      });
  }
  
  console.log(localStorage.getItem('isLoggedIn')); // Kiểm tra trạng thái đăng nhập
console.log(localStorage.getItem('userData'));   // Kiểm tra dữ liệu người dùng
  // Xử lý sự kiện đăng xuất
  if (logoutButton) {
      logoutButton.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Xóa dữ liệu đăng nhập khỏi localStorage
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userData');
          
          // Chuyển hướng đến trang đăng xuất Django
          window.location.href = 'http://127.0.0.1:8000/logout/';
      });
  }
  
  // Kiểm tra trạng thái đăng nhập khi trang tải
  checkLoginStatus();
  console.log(logoutButton)
});