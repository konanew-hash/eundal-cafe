'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Info, Search, ShoppingBag, BookmarkPlus, Award } from 'lucide-react';
import { CafeInfo } from '@/lib/types';

interface HeaderProps {
  cafe: CafeInfo | null;
  onOpenIntro: () => void;
  onOpenCart: () => void;
  onOpenCheckOrder: () => void;
  onOpenInstall: () => void;
  cartCount: number;
}

export default function Header({
  cafe,
  onOpenIntro,
  onOpenCart,
  onOpenCheckOrder,
  onOpenInstall,
  cartCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-stone-200/80 transition-all">
      <div className="max-w-md mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5">
        {/* 카페 로고 및 브랜드 (모바일 truncate 적용) */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-stone-900 via-stone-800 to-amber-700 flex items-center justify-center shadow-sm text-amber-200 shrink-0">
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-300 stroke-amber-200" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 leading-tight truncate">
              {cafe?.name || '카페 은달'}
            </h1>
            <p className="text-[9px] sm:text-[10px] text-amber-800 font-medium tracking-wider uppercase truncate">
              Eundal Specialty
            </p>
          </div>
        </div>

        {/* 액션 버튼들 (모바일 360px에서도 밀림 없는 컴팩트 반응형) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 휴대폰 바탕화면 즐겨찾기 버튼 */}
          <button
            onClick={onOpenInstall}
            title="휴대폰 바탕화면에 바로가기 추가"
            className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors active:scale-95"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="font-bold whitespace-nowrap">홈추가</span>
          </button>

          {/* 단체 납품 포트폴리오 사례 링크 */}
          <Link
            href="/portfolio"
            title="실제 단체 납품 & 케이터링 포트폴리오 보기"
            className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors active:scale-95"
          >
            <Award className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-bold whitespace-nowrap">납품사례</span>
          </Link>

          {/* 카페 소개 버튼 */}
          <button
            onClick={onOpenIntro}
            title="카페 소개 보기"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors flex items-center gap-1 active:scale-95"
          >
            <Info className="w-3.5 h-3.5 text-stone-600 shrink-0" />
            <span className="hidden sm:inline text-xs font-medium">소개</span>
          </button>

          {/* 견적/주문 조회 버튼 */}
          <button
            onClick={onOpenCheckOrder}
            title="견적 및 주문 상태 조회"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors flex items-center gap-1 active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-stone-600 shrink-0" />
            <span className="hidden sm:inline text-xs font-medium">조회</span>
          </button>

          {/* 장바구니 버튼 */}
          <button
            onClick={onOpenCart}
            title="장바구니 및 실시간 견적"
            className="relative p-2 rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm ml-0.5 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
