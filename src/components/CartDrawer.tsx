'use client';

import React from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Store as StoreIcon,
  AlertCircle,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { CartItem, DeliveryPolicy, DistanceRule, Store } from '@/lib/types';

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
  orderType: 'delivery' | 'pickup';
  onSelectOrderType: (type: 'delivery' | 'pickup') => void;
  stores?: Store[];
  selectedStoreId: string;
  onSelectStoreId: (storeId: string) => void;
  onProceedOrder: () => void;
}

const DEFAULT_STORES: Store[] = [
  {
    id: '74f3b811-7bf3-4793-a0f2-ceeee50da851',
    name: '은달 1호점 (조원)',
    branch_name: '조원점',
    address: '경기도 수원시 장안구 조원로 25',
    address_detail: '1층 은달카페',
    postal_code: '16298',
    phone: '031-255-0815',
    operating_hours: '09:00 ~ 21:00',
    description: '조원시장 맞은편, 픽업 대기 공간 완비',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'c948e546-490d-400d-b8d5-583465111e72',
    name: '은달 2호점 (파장)',
    branch_name: '파장점',
    address: '경기도 수원시 장안구 파장로 48',
    address_detail: '1층 은달카페',
    postal_code: '16305',
    phone: '031-255-0816',
    operating_hours: '09:00 ~ 21:00',
    description: '파장시장 입구 인근, 드라이브 픽업 및 정차 가능',
    is_active: true,
    sort_order: 2,
  },
];

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
  orderType,
  onSelectOrderType,
  stores = [],
  selectedStoreId,
  onSelectStoreId,
  onProceedOrder,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const activeStores = stores.length > 0 ? stores.filter((s) => s.is_active) : DEFAULT_STORES;
  const currentStore = activeStores.find((s) => s.id === selectedStoreId) || activeStores[0];

  // 상품 합계
  const itemsTotal = cart.reduce((sum, item) => sum + item.menu.price * item.quantity, 0);

  // 배달비 정책 계산
  const isPickup = orderType === 'pickup';
  const baseFee = deliveryPolicy?.base_fee ?? 3000;
  const freeThreshold = deliveryPolicy?.free_threshold ?? 35000;
  const minOrderAmount = deliveryPolicy?.min_order_amount ?? 10000;
  const distanceRules: DistanceRule[] = deliveryPolicy?.distance_rules ?? [];

  // 거리 할증 계산
  const selectedRule = distanceRules.find((r) => r.label === selectedDistanceLabel) || distanceRules[0];
  const distanceExtraFee = isPickup ? 0 : (selectedRule ? selectedRule.extra_fee : 0);

  // 무료배달 여부 (픽업은 무조건 0원 무료)
  const isFreeDelivery = isPickup || (itemsTotal >= freeThreshold && itemsTotal > 0);
  const currentBaseFee = isPickup ? 0 : (isFreeDelivery ? 0 : (itemsTotal > 0 ? baseFee : 0));
  const totalDeliveryFee = isPickup ? 0 : (itemsTotal > 0 ? currentBaseFee + distanceExtraFee : 0);

  // 최종 견적 합계
  const finalTotal = itemsTotal + totalDeliveryFee;

  // 무료배달까지 남은 금액 (배달 주문일 때만 유효)
  const remainingForFree = Math.max(0, freeThreshold - itemsTotal);
  const freeProgress = Math.min(100, Math.round((itemsTotal / freeThreshold) * 100));

  // 픽업 주문은 최소 주문 금액 제한이 없음 (배달만 제한)
  const isBelowMin = !isPickup && itemsTotal > 0 && itemsTotal < minOrderAmount;

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
              {/* 1. 수령 방식 선택 (배달 vs 픽업) - 장바구니 상단에 위치하여 실시간 견적과 상호 연동 */}
              <div className="p-1 bg-stone-100 rounded-2xl flex gap-1 border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => onSelectOrderType('delivery')}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                    !isPickup
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>배달 주문</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectOrderType('pickup')}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                    isPickup
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>매장 픽업</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-black">
                    0원
                  </span>
                </button>
              </div>

              {/* 2. 혜택 안내 바 (배달 vs 픽업 분기) */}
              {isPickup ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-950">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs">
                      ✦
                    </span>
                    <div>
                      <p className="font-bold">매장 픽업 무료 혜택 적용!</p>
                      <p className="text-[11px] text-amber-800">거리와 상관없이 배달비 0원으로 주문됩니다.</p>
                    </div>
                  </div>
                  <span className="font-black text-amber-900 text-sm">0원</span>
                </div>
              ) : (
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
              )}

              {/* 3. 담긴 메뉴 리스트 */}
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

              {/* 4. 배달 vs 픽업 옵션 영역 (상호 호환 연동) */}
              {isPickup ? (
                /* 🏬 픽업 선택 시: 픽업 매장 선택 및 찾아올 곳 지도 */
                <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-300/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <StoreIcon className="w-3.5 h-3.5 text-amber-700" />
                      픽업 매장 선택 (은달 1호점 / 2호점)
                    </label>
                    <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full">
                      배달비 0원
                    </span>
                  </div>

                  {/* 매장 목록 선택 */}
                  <div className="space-y-2">
                    {activeStores.map((store) => {
                      const isSelected = selectedStoreId === store.id;
                      return (
                        <div
                          key={store.id}
                          onClick={() => onSelectStoreId(store.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white/80 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-900">
                              <input
                                type="radio"
                                name="cart_pickup_store"
                                checked={isSelected}
                                onChange={() => onSelectStoreId(store.id)}
                                className="text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                              />
                              <span>{store.name}</span>
                            </label>
                            {store.phone && (
                              <span className="text-[10px] text-stone-500">{store.phone}</span>
                            )}
                          </div>
                          <div className="mt-1 pl-5 text-[11px] text-stone-600">
                            <p className="line-clamp-1">
                              <strong className="text-amber-800">[{store.postal_code || '16298'}]</strong> {store.address} {store.address_detail}
                            </p>
                          </div>
                          {/* 지도 길찾기 링크 */}
                          <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-end gap-1.5 pl-5">
                            <a
                              href={`https://map.naver.com/v5/search/${encodeURIComponent(store.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 border border-emerald-200"
                            >
                              네이버 지도 <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <a
                              href={`https://map.kakao.com/link/search/${encodeURIComponent(store.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 rounded bg-yellow-50 hover:bg-yellow-100 text-yellow-900 text-[10px] font-bold flex items-center gap-0.5 border border-yellow-300"
                            >
                              카카오맵 <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* 🛵 배달 선택 시: 배달 거리 구간 선택 */
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-stone-600" />
                      배달 거리 구간 선택
                    </label>
                    <span className="text-[11px] text-stone-500">
                      거리별 할증 연동
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
              )}

              {/* 5. 실시간 견적 상세 내역 */}
              <div className="p-4 bg-stone-100/70 rounded-2xl border border-stone-200/70 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>상품 주문 금액 ({cart.reduce((s, i) => s + i.quantity, 0)}개)</span>
                  <span className="font-semibold text-stone-900">{itemsTotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{isPickup ? '매장 픽업 할인' : '기본 배달비'}</span>
                  <span>
                    {isPickup ? (
                      <span className="text-emerald-700 font-bold">0원 (매장 픽업 무료)</span>
                    ) : isFreeDelivery ? (
                      <span className="text-amber-700 font-bold">무료 (0원)</span>
                    ) : (
                      `${baseFee.toLocaleString()}원`
                    )}
                  </span>
                </div>
                {!isPickup && distanceExtraFee > 0 && (
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

              {/* 배달 최소 주문 금액 미달 경고 */}
              {isBelowMin && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    배달 최소 주문 금액은 {minOrderAmount.toLocaleString()}원입니다. (
                    {(minOrderAmount - itemsTotal).toLocaleString()}원 부족, 픽업 시에는 금액 제한이 없습니다)
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 주문서 작성하기 버튼 (iOS Safe Area 대응) */}
        {cart.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-stone-200 bg-white pb-safe">
            <button
              onClick={onProceedOrder}
              disabled={isBelowMin}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                isBelowMin
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-amber-600 active:scale-[0.99]'
              }`}
            >
              <span>{isPickup ? '주문자 정보 입력 & 매장 픽업 예약' : '주문자 정보 입력 & 배달 예약'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
