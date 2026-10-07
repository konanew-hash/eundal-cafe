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
} from 'lucide-react';
import { Staff } from '@/lib/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [checking, setChecking] = useState(true);

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

  const navItems = [
    { label: '주문·견적 관제', href: '/admin/orders', icon: ClipboardList },
    { label: '매니저 전달사항', href: '/admin/notices', icon: MessageSquare },
    { label: '픽업 매장 관리', href: '/admin/stores', icon: Store },
    { label: '메뉴 & 알러지', href: '/admin/menus', icon: Coffee },
    { label: '배달비 정책', href: '/admin/delivery', icon: Truck },
    { label: '카페 브랜딩/아이콘', href: '/admin/cafe-info', icon: Store },
    { label: '직원 계정 관리', href: '/admin/staff', icon: Users },
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

        {/* 탭 네비게이션 바 */}
        <div className="bg-stone-950/80 border-t border-stone-800/80 px-4 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'border-amber-500 text-amber-400 bg-stone-900/50'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* 관리자 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
