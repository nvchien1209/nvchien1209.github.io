# payment/vnpay.py
import hashlib
import hmac
import urllib.parse
import uuid
from datetime import datetime
from django.conf import settings

class VNPay:
    def __init__(self):
        self.request_data = {}
        self.response_data = {}

    def get_payment_url(self, order_info, amount, order_id, ipaddr='127.0.0.1'):
        """
        Tạo URL thanh toán VNPay
        """
       
        
        # Các tham số cần thiết
        self.request_data = {
            'vnp_Amount': int(amount * 100),  # VNPay yêu cầu amount * 100
            'vnp_Command': 'pay',
            'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S'),
            'vnp_CurrCode': 'VND',
            'vnp_IpAddr': ipaddr,
            'vnp_Locale': 'vn',
            'vnp_OrderInfo': order_info,
            'vnp_OrderType': 'other',
            'vnp_ReturnUrl': settings.VNPAY_SETTINGS['RETURN_URL'],
            'vnp_TmnCode': settings.VNPAY_SETTINGS['TMN_CODE'],
            'vnp_TxnRef': str(order_id),
            'vnp_Version': '2.1.0',
        }
        
        print("Debug - VNPay params before sorting:", self.request_data)
        
        # Kiểm tra các tham số bắt buộc
        required_params = ['vnp_TmnCode', 'vnp_Amount', 'vnp_TxnRef', 'vnp_OrderInfo', 'vnp_ReturnUrl']
        for param in required_params:
            if not self.request_data.get(param):
                print(f"ERROR: Missing required parameter: {param}")
                return None
        
        # Sử dụng phương thức cải tiến để tạo URL
        payment_url = settings.VNPAY_SETTINGS['PAYMENT_URL']
        secret_key = settings.VNPAY_SETTINGS['HASH_SECRET_KEY']
        
        final_url = self._build_payment_url(payment_url, secret_key)
        
        
        return final_url

    def _build_payment_url(self, vnpay_payment_url, secret_key):
        """
        Xây dựng URL thanh toán theo chuẩn VNPay (dựa theo code mẫu)
        """
        # Sắp xếp tham số theo thứ tự alphabet
        input_data = sorted(self.request_data.items())
        query_string = ''
        seq = 0
        
        # Tạo query string
        for key, val in input_data:
            if seq == 1:
                query_string = query_string + "&" + key + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                query_string = key + '=' + urllib.parse.quote_plus(str(val))
        
       
        
        # Tạo secure hash
        hash_value = self.__hmacsha512(secret_key, query_string)
       
        
        # Trả về URL hoàn chỉnh
        return vnpay_payment_url + "?" + query_string + '&vnp_SecureHash=' + hash_value

    def validate_response(self, input_data):
        """
        Xác thực response từ VNPay (theo chuẩn code mẫu)
        """
        # Lưu response data
        self.response_data = {}
        for key, value in input_data.items():
            if key.startswith('vnp_'):
                self.response_data[key] = value

        secret_key = settings.VNPAY_SETTINGS['HASH_SECRET_KEY']
        return self._validate_response_hash(secret_key)

    def _validate_response_hash(self, secret_key):
        """
        Xác thực hash của response (theo logic code mẫu)
        """
        # Lấy secure hash từ response
        vnp_secure_hash = self.response_data.get('vnp_SecureHash', '')
        
        # Loại bỏ các tham số hash
        if 'vnp_SecureHash' in self.response_data.keys():
            self.response_data.pop('vnp_SecureHash')
        if 'vnp_SecureHashType' in self.response_data.keys():
            self.response_data.pop('vnp_SecureHashType')
        
        # Sắp xếp tham số
        input_data = sorted(self.response_data.items())
        has_data = ''
        seq = 0
        
        # Tạo chuỗi dữ liệu để hash
        for key, val in input_data:
            if str(key).startswith('vnp_'):
                if seq == 1:
                    has_data = has_data + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    has_data = str(key) + '=' + urllib.parse.quote_plus(str(val))
        
        # Tạo hash để so sánh
        hash_value = self.__hmacsha512(secret_key, has_data)
        
       
        
        return vnp_secure_hash == hash_value

    @staticmethod
    def __hmacsha512(key, data):
        """
        Tạo HMAC SHA512 hash (theo code mẫu)
        """
        try:
            byte_key = key.encode('utf-8')
            byte_data = data.encode('utf-8')
            return hmac.new(byte_key, byte_data, hashlib.sha512).hexdigest()
        except Exception as e:
            print(f"Error creating HMAC hash: {str(e)}")
            return None

    # Phương thức cũ để tương thích ngược (deprecated)
    def create_secure_hash(self, data):
        """
        Phương thức cũ - khuyến khích sử dụng __hmacsha512
        """
        try:
            secret_key = settings.VNPAY_SETTINGS['HASH_SECRET_KEY']
            return self.__hmacsha512(secret_key, data)
        except Exception as e:
            print(f"Error creating secure hash: {str(e)}")
            return None