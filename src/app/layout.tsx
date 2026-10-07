import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '은달(銀月) 카페 | 프리미엄 스페셜티 커피 & 수제 디저트 배달',
  description: '은은한 달빛 아래 한 잔의 여유. 매일 직접 로스팅하는 신선한 커피와 수제 디저트를 실시간 견적과 맞춤 배달로 만나보세요.',
  keywords: ['은달', '은달카페', '카페배달', '스페셜티커피', '아인슈페너', '수제디저트', '단체주문'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '은달 카페',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: '은달(銀月) 카페 - 실시간 예약 배달 주문',
    description: '은은한 달빛 아래 한 잔의 여유. 매일 로스팅하는 스페셜티 커피와 수제 디저트',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1c1917',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#faf8f5] text-[#22170f] selection:bg-amber-200">
        {children}
      </body>
    </html>
  );
}
