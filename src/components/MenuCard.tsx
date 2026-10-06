'use client';

import React from 'react';
import { Plus, Check } from 'lucide-react';
import { MenuItem } from '@/lib/types';

interface MenuCardProps {
  menu: MenuItem;
  inCartCount: number;
  onAddToCart: (menu: MenuItem) => void;
}

export default function MenuCard({ menu, inCartCount, onAddToCart }: MenuCardProps) {
  const isSoldOut = menu.is_sold_out;

  return (
    <div
      className={`group relative bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-sm transition-all hover:shadow-md flex gap-3.5 items-center ${
        isSoldOut ? 'opacity-60 grayscale-[30%]' : ''
      }`}
    >
      {/* 메뉴 썸네일 이미지 */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100 shrink-0">
        <img
          src={menu.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'}
          alt={menu.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isSoldOut && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm">
              품절 (Sold Out)
            </span>
          </div>
        )}
      </div>

      {/* 메뉴 정보 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-1">
              {menu.name}
            </h3>
            {inCartCount > 0 && !isSoldOut && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full">
                <Check className="w-2.5 h-2.5" /> {inCartCount}개 담김
              </span>
            )}
          </div>
          {menu.description && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {menu.description}
            </p>
          )}
        </div>

        {/* 가격 & 담기 버튼 */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
          <span className="font-bold text-sm sm:text-base text-stone-900">
            {menu.price.toLocaleString()}
            <span className="text-xs font-normal text-stone-600 ml-0.5">원</span>
          </span>

          <button
            onClick={() => onAddToCart(menu)}
            disabled={isSoldOut}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isSoldOut
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 text-white hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-sm'
            }`}
            title={isSoldOut ? '품절된 상품입니다' : '장바구니에 담기'}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
