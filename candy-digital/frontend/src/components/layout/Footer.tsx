import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Candy Digital</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Cửa hàng điện thoại và phụ kiện chính hãng uy tín. Cam kết hàng thật, giá tốt, bảo hành đầy đủ.
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Danh mục</h4>
          <ul className="space-y-2 text-sm">
            {['Điện thoại', 'Laptop', 'Tai nghe', 'Đồng hồ', 'Phụ kiện'].map(c => (
              <li key={c}><Link href={`/products?category=${c.toLowerCase().replace(/\s/g, '-')}`} className="hover:text-white transition-colors">{c}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
            {['Chính sách đổi trả', 'Chính sách bảo hành', 'Hướng dẫn mua hàng', 'Theo dõi đơn hàng'].map(item => (
              <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Liên hệ</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-primary-400" />123 Đường ABC, Quận 3, TP.Ha Long</li>
            <li className="flex items-center gap-2"><Phone size={14} className="text-primary-400" />1800 1234 (Miễn phí)</li>
            <li className="flex items-center gap-2"><Mail size={14} className="text-primary-400" />support@candydigital.vn</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © 2026 Candy Digital. All rights reserved.
      </div>
    </footer>
  );
}
