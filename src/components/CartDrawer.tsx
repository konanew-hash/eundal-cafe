'use client';

import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, Truck, AlertCircle, Sparkles } from 'lucide-react';
import { CartItem, DeliveryPolicy, DistanceRule } from '@/lib/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (menuId: string, delta: number) => void;
  onRemoveItem: (menuId: string) => void;
  onClearCart: () => void;
  deliveryPolicy: DeliveryPolicy | null;
  selectedDistanceLabel: string;
  onSelectDistance: (label: string) => void;
  onProceedOrder: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  deliveryPolicy,
  selectedDistanceLabel,
  onSelectDistance,
  onProceedOrder,
}: CartDrawerProps) {
  if (!isOpen) return null;

  // 상품 합계
  const itemsTotal = cart.reduce((sum, item) => sum + item.menu.price * item.quantity, 0);

  // 배달비 정책 계산
  const baseFee = deliveryPolicy?.base_fee ?? 3000;
  const freeThreshold = deliveryPolicy?.free_threshold ?? 35000;
  const minOrderAmount = deliveryPolicy?.min_order_amount ?? 10000;
  const distanceRules: DistanceRule[] = deliveryPolicy?.distance_rules ?? [];

  // 거리 할증 계산
  const selectedRule = distanceRules.find((r) => r.label === selectedDistanceLabel) || distanceRules[0];
  const distanceExtraFee = selectedRule ? selectedRule.extra_fee : 0;

  // 무료배달 여부
  const isFreeDelivery = itemsTotal >= freeThreshold && itemsTotal > 0;
  const currentBaseFee = isFreeDelivery ? 0 : (itemsTotal > 0 ? baseFee : 0);
  const totalDeliveryFee = itemsTotal > 0 ? currentBaseFee + distanceExtraFee : 0;

  // 최종 견적 합계
  const finalTotal = itemsTotal + totalDeliveryFee;

  // 무료배달까지 남은 금액
  const remainingForFree = Math.max(0, freeThreshold - itemsTotal);
  const freeProgress = Math.min(100, Math.round((itemsTotal / freeThreshold) * 100));

  const isBelowMin = itemsTotal > 0 && itemsTotal < minOrderAmount;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden animate-slide-left">
        {/* 상단 헤더 & 초기화 버튼 */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">장바구니 & 실시간 견적</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)}개
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-red-600 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                title="장바구니 전체 비우기"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>비우기</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 장바구니 본문 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
                <Truck className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-stone-600">장바구니가 비어 있습니다.</p>
              <p className="text-xs text-stone-400 max-w-xs">
                원하시는 스페셜티 메뉴를 담으시면 실시간으로 견적과 배달비가 자동 산정됩니다.
              </p>
            </div>
          ) : (
            <>
              {/* 무료 배달 혜택 안내 바 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    {isFreeDelivery ? '기본 배달비 무료 혜택 적용!' : '무료 배달 혜택'}
                  </span>
                  <span className="font-bold text-amber-900">
                    {isFreeDelivery
                      ? '무료 배달 달성'
                      : `${remainingForFree.toLocaleString()}원 더 담으면 기본 배달비 무료`}
                  </span>
                </div>
                <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${freeProgress}%` }}
                  />
                </div>
              </div>

              {/* 담긴 메뉴 리스트 */}
              <div className="space-y-2.5">
                {cart.map((item) => (
                  <div
                    key={item.menu.id}
                    className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1">
                        {item.menu.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {item.menu.price.toLocaleString()}원
                      </p>
                    </div>

                    {/* 수량 증감 컨트롤 */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-stone-300 rounded-full px-1.5 py-0.5 shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(item.menu.id, -1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.menu.id, 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.menu.id)}
                        className="text-stone-400 hover:text-red-500 p-1"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 배달 거리 구간 선택 (배달비 정책 실시간 연동) */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-stone-600" />
                    배달 거리 구간 선택
                  </label>
                  <span className="text-[11px] text-stone-500">
                    관리자 설정 연동
                  </span>
                </div>
                <select
                  value={selectedDistanceLabel}
                  onChange={(e) => onSelectDistance(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {distanceRules.map((rule) => (
                    <option key={rule.label} value={rule.label}>
                      {rule.label} {rule.extra_fee > 0 ? `(+${rule.extra_fee.toLocaleString()}원)` : '(추가금 없음)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 실시간 견적 상세 내역 */}
              <div className="p-4 bg-stone-100/70 rounded-2xl border border-stone-200/70 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>상품 주문 금액</span>
                  <span className="font-semibold text-stone-900">{itemsTotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>기본 배달비</span>
                  <span>
                    {isFreeDelivery ? (
                      <span className="text-amber-700 font-bold">무료 (0원)</span>
                    ) : (
                      `${baseFee.toLocaleString()}원`
                    )}
                  </span>
                </div>
                {distanceExtraFee > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>거리별 할증 요금 ({selectedRule?.label})</span>
                    <span className="font-semibold text-stone-900">+{distanceExtraFee.toLocaleString()}원</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline text-stone-900">
                  <span className="font-bold text-sm">실시간 총 견적 금액</span>
                  <span className="text-lg font-black text-amber-900">
                    {finalTotal.toLocaleString()}
                    <span className="text-xs font-normal text-stone-600 ml-0.5">원</span>
                  </span>
                </div>
              </div>

              {isBelowMin && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    최소 주문 금액은 {minOrderAmount.toLocaleString()}원입니다. (
                    {(minOrderAmount - itemsTotal).toLocaleString()}원 부족)
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 주문서 작성하기 버튼 */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-white">
            <button
              onClick={onProceedOrder}
              disabled={isBelowMin}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                isBelowMin
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-amber-600 active:scale-[0.99]'
              }`}
            >
              <span>주문자 정보 입력 & 배달 예약</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
