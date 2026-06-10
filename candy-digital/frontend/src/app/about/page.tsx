import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BadgeCheck,
  HeadphonesIcon,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  Users,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';

export const metadata: Metadata = {
  title: 'Về chúng tôi | Candy Digital',
  description:
    'Candy Digital — đơn vị phân phối điện thoại & phụ kiện chính hãng. Tầm nhìn, giá trị cốt lõi và cam kết với khách hàng.',
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Chính hãng có chứng nhận',
    body:
      'Nguồn hàng rõ ràng, truy xuất xuất xứ. Mỗi sản phẩm được kiểm duyệt trước khi đến tay khách hàng — không bán hàng không rõ nguồn gốc.',
  },
  {
    icon: BadgeCheck,
    title: 'Bảo hành & hậu mãi minh bạch',
    body:
      'Quy trình bảo hành, đổi trả được công bố rõ ràng. Đội ngũ hỗ trợ ghi nhận phản hồi và đồng hành xử lý đến khi bạn hài lòng.',
  },
  {
    icon: Truck,
    title: 'Giao nhận đúng hẹn',
    body:
      'Đóng gói cẩn thận, cập nhật trạng thái đơn hàng liên tục. Cam kết giao hàng nhanh, an toàn trên toàn quốc.',
  },
  {
    icon: HeartHandshake,
    title: 'Giá trị lâu dài',
    body:
      'Chúng tôi ưu tiên mối quan hệ bền vững: tư vấn trung thực, không thổi phồng công nghệ — để bạn chọn đúng sản phẩm thật sự cần.',
  },
];

const MILESTONES = [
  { year: '2019', text: 'Thành lập Candy Digital với định hướng bán lẻ công nghệ chính hãng.' },
  { year: '2021', text: 'Mở rộng danh mục phụ kiện, đồng hồ thông minh và thiết bị âm thanh.' },
  { year: '2023', text: 'Chuẩn hóa quy trình bảo hành & chăm sóc khách hàng đa kênh.' },
  { year: '2026', text: 'Tiếp tục đầu tư trải nghiệm mua sắm trực tuyến và tư vấn cá nhân hóa.' },
];

export default function AboutPage() {
  return (
    <UserLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-primary-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <p className="text-primary-200 text-sm font-medium tracking-widest uppercase mb-4">
            Về Candy Digital
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl leading-tight">
            Công nghệ chính hãng, trải nghiệm như bạn xứng đáng
          </h1>
          <p className="mt-6 text-lg text-gray-300 max-w-2xl leading-relaxed">
            Candy Digital là điểm đến tin cậy cho người dùng muốn sở hữu điện thoại, phụ kiện và thiết bị số
            với nguồn gốc rõ ràng, chính sách rành mạch và dịch vụ tận tâm — từ lúc bạn cân nhắc mua đến khi
            sử dụng lâu dài.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100"
            >
              Khám phá sản phẩm
            </Link>
            <a
              href="mailto:support@candydigital.vn"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Liên hệ doanh nghiệp
            </a>
          </div>
        </div>
      </section>

      {/* Intro + mission / vision */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Câu chuyện của chúng tôi
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Xuất phát từ niềm tin rằng mua công nghệ không chỉ là giao dịch một lần, Candy Digital được xây
              dựng để trở thành người đồng hành: lắng nghe nhu cầu, tư vấn phù hợp ngân sách và hỗ trợ sau
              bán hàng một cách nhất quán. Chúng tôi chọn làm việc trực tiếp với nhà phân phối uy tín, giảm
              tối đa rủi ro hàng giả, hàng nhái — vì uy tín thương hiệu gắn liền với lòng tin của từng khách
              hàng.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Hôm nay, Candy Digital phục vụ hàng nghìn đơn hàng mỗi năm với mục tiêu duy nhất:{' '}
              <span className="font-medium text-gray-800">bạn an tâm khi bấm “đặt hàng”</span>, và hài lòng
              khi nhận sản phẩm trong tay.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card p-6 border-primary-100 bg-gradient-to-br from-white to-primary-50/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <Target size={20} aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Tầm nhìn</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Trở thành chuỗi bán lẻ công nghệ được nhắc đến bởi sự minh bạch, tốc độ và chất lượng dịch vụ
                hậu mãi tại Việt Nam.
              </p>
            </div>
            <div className="card p-6 border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                <Sparkles size={20} aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Sứ mệnh</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Mang đến sản phẩm chính hãng với mức giá cạnh tranh, quy trình mua bán đơn giản và đội ngũ luôn
                sẵn sàng hỗ trợ — mọi lúc, mọi kênh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '5+', label: 'Năm đồng hành cùng khách hàng' },
              { value: '100%', label: 'Cam kết nguồn hàng rõ ràng' },
              { value: '50+', label: 'Dòng sản phẩm & phụ kiện' },
              { value: '24/7', label: 'Kênh hỗ trợ & theo dõi đơn hàng' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-3xl md:text-4xl font-bold text-primary">{item.value}</p>
                <p className="mt-2 text-sm text-gray-600 leading-snug max-w-[200px] mx-auto">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Giá trị cốt lõi</h2>
          <p className="mt-3 text-gray-600">
            Bốn trụ cột định hướng mọi quyết định tại Candy Digital — từ tuyển chọn sản phẩm đến cách chúng
            tôi nói chuyện với bạn.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow border-gray-100">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <Icon size={22} aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline + promise */}
      <section className="bg-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Hành trình phát triển</h2>
            <p className="mt-3 text-gray-600 text-sm md:text-base">
              Mỗi mốc son là một bước củng cố niềm tin — không chỉ trong con số doanh thu, mà ở chất lượng
              trải nghiệm bạn nhận được.
            </p>
            <ul className="mt-8 space-y-6 border-l-2 border-primary-200 pl-6">
              {MILESTONES.map((m) => (
                <li key={m.year} className="relative">
                  <span className="absolute -left-[29px] top-1.5 flex h-3 w-3 rounded-full border-2 border-primary bg-white" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">{m.year}</span>
                  <p className="mt-1 text-gray-700 leading-relaxed">{m.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-8 border-gray-100 self-start">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white">
                <Users size={18} aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Cam kết với khách hàng</h3>
                <p className="text-sm text-gray-500">Điều bạn có thể kỳ vọng ở mỗi lần ghé Candy Digital</p>
              </div>
            </div>
            <ol className="space-y-4 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  1
                </span>
                <span>
                  <strong className="text-gray-900">Tư vấn trung thực</strong> — ưu tiên nhu cầu thực tế,
                  không ép mua mẫu cao hơn mức bạn cần.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  2
                </span>
                <span>
                  <strong className="text-gray-900">Thông tin đầy đủ</strong> — tình trạng máy, phụ kiện kèm
                  theo và chính sách bảo hành được nêu rõ trước khi thanh toán.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  3
                </span>
                <span>
                  <strong className="text-gray-900">Hỗ trợ sau bán</strong> — hotline, email và kênh online
                  phối hợp xử lý khiếu nại theo quy trình chuẩn.
                </span>
              </li>
            </ol>
            <div className="mt-8 flex items-start gap-3 rounded-xl bg-primary-50 p-4 text-sm text-gray-700">
              <HeadphonesIcon className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" aria-hidden />
              <p>
                Cần báo giá số lượng lớn hoặc hợp tác B2B? Gửi yêu cầu tới{' '}
                <a href="mailto:support@candydigital.vn" className="font-medium text-primary hover:underline">
                  support@candydigital.vn
                </a>
                — chúng tôi phản hồi trong giờ hành chính.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-700 px-6 py-12 md:px-12 md:py-14 text-white shadow-xl">
          <div className="relative max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Sẵn sàng đồng hành cùng bạn</h2>
            <p className="mt-3 text-white/90 leading-relaxed">
              Dù bạn đang tìm chiếc điện thoại mới hay phụ kiện tinh gọn cho công việc hàng ngày — hãy để Candy
              Digital gợi ý lựa chọn phù hợp, minh bạch và đáng tin cậy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow transition hover:bg-gray-50"
              >
                Xem cửa hàng trực tuyến
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-full border border-white/50 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Tạo tài khoản
              </Link>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -right-8 -bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl md:-right-4 md:top-1/2 md:-translate-y-1/2"
            aria-hidden
          />
        </div>
      </section>
    </UserLayout>
  );
}
