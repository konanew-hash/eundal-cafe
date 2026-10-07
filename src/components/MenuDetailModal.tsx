'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { Menu } from '@/lib/types';

interface MenuDetailModalProps {
  menu: Menu | null;
  isOpen: boolean;
  onClose: () => void;
  currentQuantity: number;
  onUpdateQuantity: (menu: Menu, newQty: number) => void;
}

export default function MenuDetailModal({
  menu,
  isOpen,
  onClose,
  currentQuantity,
  onUpdateQuantity,
}: MenuDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [addedEffect, setAddedEffect] = useState(false);

  useEffect(() => {
    if (menu) {
      setQty(currentQuantity > 0 ? currentQuantity : 1);
      setAddedEffect(false);
    }
  }, [menu, currentQuantity, isOpen]);

  if (!isOpen || !menu) return null;

  const handleApply = () => {
    onUpdateQuantity(menu, qty);
    setAddedEffect(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleMinus = () => {
    if (qty > 1) {
      setQty(qty - 1);
    } else {
      // If was 1 and user clicks minus, set to 0 (remove)
      setQty(0);
    }
  };

  const handlePlus = () => {
    setQty(qty + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 transform transition-all animate-scale-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 메뉴 이미지 */}
        <div className="relative w-full h-64 sm:h-72 bg-stone-100 shrink-0 overflow-hidden">
          <img
            src={menu.image_url || 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'}
            alt={menu.name}
            className="w-full h-full object-cover"
          />
          {menu.is_sold_out && (
            <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-[2px]">
              <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-sm font-bold shadow-lg">
                현재 품절 (Sold Out)
              </span>
            </div>
          )}
          <div className="absolute bottom-3 left-4">
            <span className="px-2.5 py-1 rounded-md bg-stone-900/80 text-amber-200 text-xs font-semibold backdrop-blur-sm">
              은달 수제 메뉴
            </span>
          </div>
        </div>

        {/* 상세 설명 및 가격 본문 */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">{menu.name}</h3>
            <p className="text-lg font-black text-amber-900 mt-1">
              {menu.price.toLocaleString()}원
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-stone-700 text-xs leading-relaxed whitespace-pre-line">
            {menu.description || '은달 카페만의 정성과 신선함을 담아 준비한 대표 메뉴입니다.'}
          </div>

          {/* 수량 조절 및 소계 */}
          {!menu.is_sold_out && (
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">주문 수량</span>
                <div className="flex items-center gap-3 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
                  <button
                    type="button"
                    onClick={handleMinus}
                    className="w-8 h-8 rounded-xl bg-white text-stone-700 flex items-center justify-center hover:bg-stone-200 font-bold transition-colors shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-stone-900 text-sm font-mono">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={handlePlus}
                    className="w-8 h-8 rounded-xl bg-white text-stone-700 flex items-center justify-center hover:bg-stone-200 font-bold transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-stone-500 font-medium">예상 견적 금액</span>
                <span className="font-extrabold text-stone-900 text-base">
                  {(menu.price * qty).toLocaleString()}원
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 하단 담기 / 수량적용 버튼 */}
        <div className="p-4 border-t border-stone-100 bg-white shrink-0">
          {menu.is_sold_out ? (
            <button
              disabled
              className="w-full py-3.5 rounded-2xl bg-stone-200 text-stone-400 font-bold text-sm cursor-not-allowed text-center"
            >
              품절된 메뉴입니다
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] ${
                addedEffect
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-amber-600 text-white'
              }`}
            >
              {addedEffect ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>견적서에 반영되었습니다!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {currentQuantity > 0 ? '견적서 수량 변경하기' : '견적서에 담기'} ({(menu.price * qty).toLocaleString()}원)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
