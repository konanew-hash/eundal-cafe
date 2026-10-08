'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardList,
  Coffee,
  Truck,
  Store,
  Users,
  LogOut,
  ExternalLink,
  Moon,
  Loader2,
  MessageSquare,
  Smartphone,
  Sparkles,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Staff } from '@/lib/types';
import InstallPromptModal from '@/components/InstallPromptModal';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [checking, setChecking] = useState(true);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // 세션 확인
  useEffect(() => {
    // 로그인 페이지는 레이아웃 체크 제외
    if (pathname === '/admin/login') {
      setChecking(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setCurrentStaff(data.staff);
      } catch {
        router.push('/admin/login');
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  // 로그아웃
  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs text-stone-400">관리자 보안 세션 확인 중...</p>
      </div>
    );
  }

  // 효율적인 운영 동선별 관리자 메뉴 체계화 (4대 카테고리)
  const navGroups = [
    {
      group: '영업·관제',
      items: [
        { label: '주문·견적 관제', href: '/admin/orders', icon: ClipboardList },
        { label: '주변 카페 비교', href: '/admin/competitors', icon: TrendingUp },
      ],
    },
    {
      group: '상품·콘텐츠',
      items: [
        { label: '메뉴 & 알러지', href: '/admin/menus', icon: Coffee },
        { label: '추천 세트(은픽)', href: '/admin/preset-sets', icon: Sparkles },
        { label: '납품 포트폴리오', href: '/admin/portfolio', icon: Award },
      ],
    },
    {
      group: '매장·배달',
      items: [
        { label: '픽업 매장 관리', href: '/admin/stores', icon: Store },
        { label: '배달비 정책', href: '/admin/delivery', icon: Truck },
      ],
    },
    {
      group: '운영·설정',
      items: [
        { label: '카페 브랜딩/안내', href: '/admin/cafe-info', icon: Store },
        { label: '공지/전달사항', href: '/admin/notices', icon: MessageSquare },
        { label: '직원 계정 관리', href: '/admin/staff', icon: Users },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      {/* 관리자 글로벌 탑 헤더 */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/orders" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-stone-950 font-bold shadow-sm">
                <Moon className="w-4 h-4 fill-stone-950 stroke-stone-950" />
              </div>
              <span className="font-bold text-base tracking-tight">은달 매니지먼트</span>
            </Link>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 font-semibold border border-stone-700">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentStaff && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-stone-200">
                  {currentStaff.name} ({currentStaff.username})
                </p>
                <p className="text-[10px] text-amber-400">
                  {currentStaff.role === 'super_admin' ? '최고 총괄관리자' : '매니저'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsInstallModalOpen(true)}
              title="관리자 스마트폰/태블릿/PC 바탕화면에 바로가기 앱 아이콘 추가"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold hover:brightness-110 transition-all shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">바탕화면 바로가기</span>
              <span className="sm:hidden">앱 추가</span>
            </button>

            <Link
              href="/"
              target="_blank"
              title="고객 웹사이트 새창 열기"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">고객 홈페이지</span>
            </Link>

            <button
              onClick={handleLogout}
              title="로그아웃"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-950/80 text-red-300 hover:bg-red-900 transition-colors border border-red-800/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 바 (그룹별 구분 구조) */}
        <div className="bg-stone-950/90 border-t border-stone-800/80 px-4 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center divide-x divide-stone-800 py-1">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className={`flex items-center gap-0.5 ${gIdx > 0 ? 'pl-2 ml-1' : ''}`}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-xl transition-all ${
                          isActive
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                            : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* 모바일 탭 바 우측 바로가기 유도 버튼 */}
            <button
              type="button"
              onClick={() => setIsInstallModalOpen(true)}
              className="sm:hidden flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0"
              title="바탕화면 바로가기 추가"
            >
              <Smartphone className="w-3 h-3" />
              <span>바로가기</span>
            </button>
          </div>
        </div>
      </header>

      {/* 관리자 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">{children}</main>

      {/* 바탕화면 바로가기 (PWA 설치 가이드) 모달 */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
