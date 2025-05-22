(function($) {
    $(document).ready(function() {
        // Đợi DOM load xong
        setTimeout(function() {
            // Tìm button "Add another" trong section staff assignment
            $('.add-row a').each(function() {
                var text = $(this).text();
                if (text.includes('Phân công nhân viên')) {
                    $(this).text('+ Thêm nhân viên');
                }
            });
        }, 100);
        
        // Cũng lắng nghe khi có thay đổi dynamic
        $(document).on('DOMNodeInserted', function() {
            $('.add-row a').each(function() {
                var text = $(this).text();
                if (text.includes('Phân công nhân viên') && !text.includes('+ Thêm nhân viên')) {
                    $(this).text('+ Thêm nhân viên');
                }
            });
        });
    });
})(django.jQuery);