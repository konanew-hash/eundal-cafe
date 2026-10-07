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
  Gift,
  Package,
  Check,
} from 'lucide-react';
import { CartItem, DeliveryPolicy, DistanceRule, MenuItem, Store } from '@/lib/types';
import MiniMapPopup from '@/components/MiniMapPopup';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  menus?: MenuItem[];
  onUpdateQuantity: (menuId: string, delta: number, exactQty?: number) => void;
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
  selectedPackagingBoxId?: string;
  onSelectPackagingBoxId?: (id: string) => void;
  selectedPackagingOptionIds?: string[];
  onTogglePackagingOptionId?: (id: string) => void;
  onProceedOrder: () => void;
  onOpenSetBuilder?: () => void;
}

const DEFAULT_PACKAGE_BOX_OPTIONS = [
  { id: 'none', name: '기본 포장 (선물박스 없음)', price: 0, desc: '일반 테이크아웃 음료 캐리어 및 기본 포장백' },
  { id: 'box_craft', name: '은달 시그니처 크라프트 선물박스', price: 1500, desc: '고급 크라프트 재질의 은달 전용 선물 상자' },
  { id: 'box_clear', name: '투명 손잡이 선물팩', price: 1000, desc: '디저트와 음료가 돋보이는 모던 투명 패키지' },
  { id: 'box_premium', name: '프리미엄 기프트 하드케이스', price: 3000, desc: '격식 있는 자리에 어울리는 단단한 선물용 하드케이스' },
];

const DEFAULT_SPECIAL_OPTIONS = [
  { id: 'opt_can', name: '음료 캔시머(알루미늄 캔 밀봉) 안심 포장', price: 500, desc: '배달/이동 시 음료가 전혀 새지 않는 밀봉 캔 포장' },
  { id: 'opt_ribbon', name: '선물용 고급 리본 & 스티커 패키징', price: 1000, desc: '정성을 더하는 리본 매듭과 은달 로고 씰링 스티커' },
  { id: 'opt_card', name: '감사 메시지 카드 동봉', price: 500, desc: '마음을 전하는 인쇄형 감사 엽서 동봉' },
];

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
  menus = [],
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
  selectedPackagingBoxId: propBoxId,
  onSelectPackagingBoxId: propOnSelectBox,
  selectedPackagingOptionIds: propOptionIds,
  onTogglePackagingOptionId: propOnToggleOption,
  onProceedOrder,
  onOpenSetBuilder,
}: CartDrawerProps) {
  const [selectedMapStore, setSelectedMapStore] = React.useState<Store | null>(null);

  // 로컬 fallback 상태 (부모에서 prop을 안 넘겨도 자체 작동)
  const [localBoxId, setLocalBoxId] = React.useState<string>('none');
  const [localOptionIds, setLocalOptionIds] = React.useState<string[]>([]);

  const selectedBoxId = propBoxId !== undefined ? propBoxId : localBoxId;
  const onSelectBoxId = propOnSelectBox || setLocalBoxId;
  const selectedOptionIds = propOptionIds !== undefined ? propOptionIds : localOptionIds;
  const onToggleOptionId =
    propOnToggleOption ||
    ((id: string) => {
      setLocalOptionIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    });

  // DB에 등록된 packaging_type === 'box' 품목들을 동적으로 로드 (없으면 기본 fallback)
  const boxOptions = React.useMemo(() => {
    const dbBoxes = menus.filter((m) => m.packaging_type === 'box' && m.is_active && !m.is_sold_out);
    if (dbBoxes.length > 0) {
      return [
        { id: 'none', name: '기본 포장 (선물박스 없음)', price: 0, desc: '일반 테이크아웃 기본 캐리어 및 종이봉투 포장' },
        ...dbBoxes.map((b) => ({
          id: b.id,
          name: b.name,
          price: b.price,
          desc: b.description || '은달 전용 포장용기',
        })),
      ];
    }
    return DEFAULT_PACKAGE_BOX_OPTIONS;
  }, [menus]);

  // DB에 등록된 packaging_type === 'special' 품목들을 동적으로 로드 (없으면 기본 fallback)
  const specialOptions = React.useMemo(() => {
    const dbSpecials = menus.filter((m) => m.packaging_type === 'special' && m.is_active && !m.is_sold_out);
    if (dbSpecials.length > 0) {
      return dbSpecials.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        desc: s.description || '은달 특별 패키징 옵션',
      }));
    }
    return DEFAULT_SPECIAL_OPTIONS;
  }, [menus]);

  if (!isOpen) return null;

  const activeStores = stores.length > 0 ? stores.filter((s) => s.is_active) : DEFAULT_STORES;
  const currentStore = activeStores.find((s) => s.id === selectedStoreId) || activeStores[0];

  // 상품 합계
  const itemsTotal = cart.reduce((sum, item) => sum + item.menu.price * item.quantity, 0);

  // 포장용기 및 특수포장 비용 계산 (실시간 견적 반영)
  const currentBox = boxOptions.find((b) => b.id === selectedBoxId) || boxOptions[0];
  const boxFee = currentBox ? currentBox.price : 0;
  const specialFee = selectedOptionIds.reduce((sum, id) => {
    const opt = specialOptions.find((o) => o.id === id);
    return sum + (opt ? opt.price : 0);
  }, 0);
  const packagingFee = boxFee + specialFee;

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

  // 최종 실시간 총 견적 금액: 상품비 + 배달비 + 포장비 (요구사항 실시간 계산 연동)
  const finalTotal = itemsTotal + totalDeliveryFee + packagingFee;

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

              {/* 3. 담긴 메뉴 리스트 및 세트메뉴 세부 정리 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">담긴 품목 ({cart.length}종류)</span>
                  {onOpenSetBuilder && (
                    <button
                      type="button"
                      onClick={onOpenSetBuilder}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 px-2 py-0.5 rounded-lg border border-amber-300 transition-colors shadow-2xs"
                    >
                      <Gift className="w-3 h-3 text-amber-700" />
                      <span>+ 맞춤 세트메뉴 만들기</span>
                    </button>
                  )}
                </div>

                {cart.map((item) => {
                  const isSet = item.is_custom_set && item.set_details;
                  const isHalfSandwichSet = Boolean(
                    isSet && item.set_details?.components.some((c) => c.menu_name.includes('(1/2개)'))
                  );
                  const step = isHalfSandwichSet ? 2 : 1;
                  const minQty = isHalfSandwichSet ? 2 : 1;

                  return (
                    <div
                      key={item.id || item.menu.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSet
                          ? 'bg-amber-50/40 border-amber-300/80 shadow-2xs'
                          : 'bg-stone-50 border-stone-200/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isSet && (
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-300/70">
                                <Gift className="w-2.5 h-2.5 text-amber-700" />
                                맞춤 세트메뉴
                              </span>
                              {isHalfSandwichSet && (
                                <span className="text-[10px] font-bold text-orange-800 bg-orange-100 border border-orange-300 px-1.5 py-0.5 rounded-md">
                                  🥪 짝수(2개 단위) 세트
                                </span>
                              )}
                            </div>
                          )}
                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1">
                            {item.menu.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-amber-950">
                              {(item.menu.price * item.quantity).toLocaleString()}원
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-stone-400">
                                (개당 {item.menu.price.toLocaleString()}원)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 수량 증감 컨트롤 */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-white border border-stone-300 rounded-full px-1.5 py-0.5 shadow-2xs">
                            <button
                              onClick={() => {
                                if (item.quantity <= minQty) {
                                  if (confirm('이 메뉴를 장바구니에서 삭제하시겠습니까?')) {
                                    onRemoveItem(item.menu.id);
                                  }
                                } else {
                                  onUpdateQuantity(item.menu.id, -step);
                                }
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                              title={isHalfSandwichSet ? '2세트 줄이기' : '1개 줄이기'}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={minQty}
                              step={step}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  onUpdateQuantity(item.menu.id, 0, Math.max(0, val));
                                }
                              }}
                              onBlur={() => {
                                if (isHalfSandwichSet) {
                                  let finalVal = item.quantity;
                                  if (finalVal < 2) finalVal = 2;
                                  else if (finalVal % 2 !== 0) {
                                    finalVal += 1;
                                  }
                                  if (finalVal !== item.quantity) {
                                    onUpdateQuantity(item.menu.id, 0, finalVal);
                                  }
                                } else if (item.quantity <= 0) {
                                  onRemoveItem(item.menu.id);
                                }
                              }}
                              className="w-8 text-center text-xs font-bold text-stone-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0"
                              title="클릭하여 수량 직접 입력"
                            />
                            <button
                              onClick={() => onUpdateQuantity(item.menu.id, step)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                              title={isHalfSandwichSet ? '2세트 늘리기' : '1개 늘리기'}
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

                      {/* 세트메뉴인 경우 각 항목 세부 정리 (포함 품목, 포장용기, 옵션) */}
                      {isSet && item.set_details && (
                        <div className="mt-2.5 pt-2 border-t border-amber-200/80 text-[11px] text-stone-600 space-y-1 bg-white/70 p-2 rounded-xl border border-amber-100">
                          <div>
                            <strong className="text-stone-800">포함 품목:</strong>{' '}
                            {item.set_details.components.map((c) => `${c.menu_name}(${c.quantity}개)`).join(', ')}
                          </div>
                          <div className="flex items-center justify-between text-stone-500">
                            <span>
                              <strong>포장용기:</strong> {item.set_details.package_box.name}
                            </span>
                            {item.set_details.package_box.price > 0 && (
                              <span className="font-semibold text-amber-900">
                                +{item.set_details.package_box.price.toLocaleString()}원
                              </span>
                            )}
                          </div>
                          {item.set_details.packaging_options.length > 0 && (
                            <div className="text-stone-500">
                              <strong>추가 옵션:</strong>{' '}
                              {item.set_details.packaging_options.map((o) => `${o.name}(+${o.price.toLocaleString()}원)`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                          {/* 지도 길찾기 링크 및 미니 지도 팝업 */}
                          <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-end gap-1.5 pl-5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMapStore(store);
                              }}
                              className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <MapPin className="w-2.5 h-2.5 text-amber-700" />
                              <span>지도 보기</span>
                            </button>
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

              {/* 4. [신규 요구사항] 포장용기 & 특수포장 옵션 선택 (실시간 견적 연동) */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50/70 to-stone-50 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-stone-900">포장용기 & 선물포장 옵션 선택</span>
                  </div>
                  {packagingFee > 0 ? (
                    <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                      +{packagingFee.toLocaleString()}원
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-medium">선택 가능</span>
                  )}
                </div>

                {/* 포장용기 선택 그리드 */}
                <div>
                  <div className="text-[11px] font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                    <span>1) 포장용기 선택</span>
                    <span className="text-[10px] text-stone-400">전체 주문 포장 기준</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {boxOptions.map((box) => {
                      const isSelected = selectedBoxId === box.id;
                      return (
                        <div
                          key={box.id}
                          onClick={() => onSelectBoxId(box.id)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-white border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white/80 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-stone-900 line-clamp-1">{box.name}</span>
                            <span className={`text-[11px] font-extrabold shrink-0 ${box.price > 0 ? 'text-amber-800' : 'text-stone-500'}`}>
                              {box.price > 0 ? `+${box.price.toLocaleString()}원` : '무료'}
                            </span>
                          </div>
                          {box.desc && (
                            <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{box.desc}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 특수포장 옵션 다중 선택 (캔시머, 리본 등) */}
                <div className="pt-2 border-t border-amber-200/60">
                  <div className="text-[11px] font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                    <span>2) 특수포장 안심/선물 옵션</span>
                    <span className="text-[10px] text-stone-400">다중 선택 가능</span>
                  </div>
                  <div className="space-y-1.5">
                    {specialOptions.map((opt) => {
                      const isChecked = selectedOptionIds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-white border-amber-600 ring-1 ring-amber-500/20 shadow-2xs'
                              : 'bg-white/80 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleOptionId(opt.id)}
                              className="w-3.5 h-3.5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-stone-900 block truncate">{opt.name}</span>
                              {opt.desc && (
                                <span className="text-[10px] text-stone-500 block truncate">{opt.desc}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-extrabold text-amber-800 shrink-0 ml-2">
                            +{opt.price.toLocaleString()}원
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

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
                {packagingFee > 0 && (
                  <div className="flex justify-between text-stone-700 font-medium">
                    <span>
                      포장용기 & 특수옵션
                      {currentBox?.price ? ` (${currentBox.name})` : ''}
                      {selectedOptionIds.length > 0 ? ` 외 ${selectedOptionIds.length}건` : ''}
                    </span>
                    <span className="font-bold text-amber-800">+{packagingFee.toLocaleString()}원</span>
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

      {/* 픽업 매장 미니 지도 팝업 */}
      <MiniMapPopup
        isOpen={Boolean(selectedMapStore)}
        onClose={() => setSelectedMapStore(null)}
        title={selectedMapStore ? `${selectedMapStore.name} 찾아오시는 길` : '매장 위치'}
        address={selectedMapStore?.address || ''}
        detailAddress={selectedMapStore?.address_detail}
        postalCode={selectedMapStore?.postal_code}
        phone={selectedMapStore?.phone}
      />
    </div>
  );
}
