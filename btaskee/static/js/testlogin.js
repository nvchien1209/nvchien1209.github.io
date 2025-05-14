// Hàm giả lập đăng nhập
function fakeLogin(name = "Nguyễn Văn A", avatar = "../images/avatar1.jpg") {
    // Lưu trạng thái đăng nhập vào localStorage
    localStorage.setItem('isLoggedIn', 'true');
    
    // Tạo đối tượng dữ liệu người dùng
    const userData = {
      name: name,
      avatar: avatar
    };
    
    // Lưu dữ liệu người dùng vào localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Làm mới trang để áp dụng thay đổi
    location.reload();
  }
  
  // Hàm giả lập đăng xuất
  function fakeLogout() {
    // Xóa dữ liệu đăng nhập khỏi localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    
    // Làm mới trang để áp dụng thay đổi
    location.reload();
  }
  
  // Để đăng nhập, hãy gọi: fakeLogin()
  // Để đăng xuất, hãy gọi: fakeLogout()