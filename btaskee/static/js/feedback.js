$(document).ready(function(){
    // Khởi tạo Testimonial Slider
    $('.testimonial-slider').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        asNavFor: '.avatar-slider'
    });
    
    // Khởi tạo Avatar Slider
    $('.avatar-slider').slick({
        slidesToShow: 7,
        slidesToScroll: 1,
        asNavFor: '.testimonial-slider',
        dots: false,
        centerMode: true,
        focusOnSelect: true,
        prevArrow: '<button type="button" class="slick-prev "><i class="bi bi-chevron-left"></i></button>',
        nextArrow: '<button type="button" class="slick-next"><i class="bi bi-chevron-right"></i></button>',
        responsive: [
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 5
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 3
                }
            },
            {
                breakpoint: 576,
                settings: {
                    slidesToShow: 3,
                    centerMode: false
                }
            }
        ]
    });
    
    // Cập nhật class active cho avatar khi slide thay đổi
    $('.testimonial-slider').on('afterChange', function(event, slick, currentSlide){
        $('.avatar-img').removeClass('active');
        $('.avatar-slider .slick-center .avatar-img').addClass('active');
    });
    
    // Thiết lập avatar đầu tiên là active
    $('.avatar-slider .slick-center .avatar-img').addClass('active');
});