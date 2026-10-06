'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Info, Search, ShoppingBag } from 'lucide-react';
import { CafeInfo } from '@/lib/types';

interface HeaderProps {
  cafe: CafeInfo | null;
  onOpenIntro: () => void;
  onOpenCart: () => void;
  onOpenCheckOrder: () => void;
  cartCount: number;
}

export default function Header({ cafe, onOpenIntro, onOpenCart, onOpenCheckOrder, cartCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-stone-200/80 transition-all">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* 카페 로고 및 브랜드 */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-stone-900 via-stone-800 to-amber-700 flex items-center justify-center shadow-sm text-amber-200">
            <Moon className="w-5 h-5 fill-amber-300 stroke-amber-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-stone-900 leading-none">
              {cafe?.name || '카페 은달'}
            </h1>
            <p className="text-[10px] text-amber-800 font-medium tracking-wider mt-0.5 uppercase">
              Eundal Specialty Coffee
            </p>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-1.5">
          {/* 카페 소개 버튼 */}
          <button
            onClick={onOpenIntro}
            title="카페 소개 보기"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline font-medium">소개</span>
          </button>

          {/* 견적/주문 조회 버튼 */}
          <button
            onClick={onOpenCheckOrder}
            title="견적 및 주문 상태 조회"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline font-medium">견적조회</span>
          </button>

          {/* 장바구니 버튼 */}
          <button
            onClick={onOpenCart}
            title="장바구니 및 견적"
            className="relative p-2 rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm ml-1"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
