'use client';

import React from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { MenuItem } from '@/lib/types';

interface MenuCardProps {
  menu: MenuItem;
  inCartCount: number;
  onAddToCart: (menu: MenuItem) => void;
  onUpdateQuantity?: (menuId: string, delta: number) => void;
  onOpenDetail?: (menu: MenuItem) => void;
}

export default function MenuCard({
  menu,
  inCartCount,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail,
}: MenuCardProps) {
  const isSoldOut = menu.is_sold_out;

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(menu);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-2xl p-3 sm:p-3.5 border border-stone-200/90 shadow-sm transition-all hover:shadow-md flex gap-2.5 sm:gap-3.5 items-center cursor-pointer ${
        isSoldOut ? 'opacity-60 grayscale-[30%]' : ''
      }`}
    >
      {/* 메뉴 썸네일 이미지 (모바일 w-20, 태블릿/PC w-24) */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
        <img
          src={menu.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'}
          alt={menu.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isSoldOut ? (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm">
              품절 (Sold Out)
            </span>
          </div>
        ) : (
          <div className="absolute top-1 right-1 flex items-center gap-1">
            {menu.additional_images && menu.additional_images.length > 0 && (
              <span className="px-1 py-0.5 bg-black/60 text-white rounded-md text-[9px] font-bold backdrop-blur-xs shadow-2xs">
                +{menu.additional_images.length + 1}장
              </span>
            )}
            {menu.video_urls && menu.video_urls.length > 0 && (
              <span className="px-1 py-0.5 bg-red-600 text-white rounded-md text-[9px] font-bold shadow-2xs">
                영상
              </span>
            )}
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
          {menu.allergens && (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium line-clamp-1">
                알레르기: {menu.allergens}
              </span>
            </div>
          )}
        </div>

        {/* 가격 & 수량 조절 버튼 (요구사항: +와 함께 -도 포함하여 줄이기 지원) */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
          <span className="font-bold text-sm sm:text-base text-stone-900">
            {menu.price.toLocaleString()}
            <span className="text-xs font-normal text-stone-600 ml-0.5">원</span>
          </span>

          {isSoldOut ? (
            <span className="text-xs text-stone-400 font-medium px-2 py-1">품절</span>
          ) : inCartCount > 0 && onUpdateQuantity ? (
            /* 이미 담긴 경우: - 와 + 수량 조절 컨트롤러 */
            <div
              className="flex items-center bg-stone-100 border border-stone-300/80 rounded-full px-1.5 py-0.5 shadow-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(menu.id, -1);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 active:scale-95 hover:bg-white transition-all"
                title="수량 1개 줄이기"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="w-6 text-center text-xs font-black text-amber-900 select-none">
                {inCartCount}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(menu.id, 1);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 active:scale-95 hover:bg-white transition-all"
                title="수량 1개 늘리기"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            /* 아직 담기지 않은 경우: + 담기 버튼 */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(menu);
              }}
              className="px-3 py-1.5 rounded-full bg-stone-900 text-white hover:bg-amber-600 font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
              title="장바구니에 담기"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>담기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
