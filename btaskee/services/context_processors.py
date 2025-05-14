from .models import Category

def category_services_processor(request):
    # Truy vấn dữ liệu từ Category và Service
    categories = Category.objects.prefetch_related('services').all()
    
    return {
        'categories': categories,
    }