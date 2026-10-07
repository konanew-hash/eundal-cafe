'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Gift,
  Plus,
  Minus,
  Check,
  Package,
  Sparkles,
  ShoppingBag,
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { MenuItem, Category, CartItem, CustomSetDetails, SetComponentItem } from '@/lib/types';

interface CustomSetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menus: MenuItem[];
  categories: Category[];
  onAddSetToCart: (cartItem: CartItem) => void;
}

// 1. 포장용기 옵션
const PACKAGE_BOX_OPTIONS = [
  { id: 'box_craft', name: '은달 시그니처 크라프트 선물박스', price: 1500, desc: '고급 크라프트 재질의 은달 전용 선물 상자' },
  { id: 'box_clear', name: '투명 손잡이 선물팩', price: 1000, desc: '디저트와 음료가 돋보이는 모던 투명 패키지' },
  { id: 'box_premium', name: '프리미엄 기프트 하드케이스', price: 3000, desc: '격식 있는 자리에 어울리는 단단한 선물용 하드케이스' },
  { id: 'box_carrier', name: '일반 테이크아웃 캐리어 & 백', price: 0, desc: '기본 음료 캐리어 및 종이봉투 포장' },
];

// 2. 특수 포장 옵션 (캔시머, 리본 등)
const SPECIAL_OPTIONS = [
  { id: 'opt_can', name: '음료 캔시머(알루미늄 캔 밀봉) 안심 포장', price: 500, desc: '배달/이동 시 음료가 전혀 새지 않는 밀봉 캔 포장' },
  { id: 'opt_ribbon', name: '선물용 고급 리본 & 스티커 패키징', price: 1000, desc: '정성을 더하는 리본 매듭과 은달 로고 씰링 스티커' },
  { id: 'opt_card', name: '감사 메시지 카드 동봉', price: 500, desc: '마음을 전하는 인쇄형 감사 엽서 동봉' },
];

export default function CustomSetBuilderModal({
  isOpen,
  onClose,
  menus,
  categories,
  onAddSetToCart,
}: CustomSetBuilderModalProps) {
  const [setName, setSetName] = useState('은달 맞춤 선물세트');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, number>>({});
  const [selectedBoxId, setSelectedBoxId] = useState<string>('box_craft');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(['opt_can']);
  const [setQuantity, setSetQuantity] = useState<number>(1);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [addedEffect, setAddedEffect] = useState(false);

  // 품목 수량 조절
  const handleUpdateComponentQty = (menuId: string, delta: number) => {
    setSelectedComponents((prev) => {
      const next = { ...prev };
      const current = next[menuId] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        delete next[menuId];
      } else {
        next[menuId] = updated;
      }
      return next;
    });
  };

  // 특수 옵션 토글
  const handleToggleOption = (optId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  // 필터링된 메뉴 목록
  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      if (m.is_sold_out) return false;
      if (selectedCatId !== 'all' && m.category_id !== selectedCatId) return false;
      if (searchKeyword.trim() && !m.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [menus, selectedCatId, searchKeyword]);

  // 선택된 품목들의 합계 계산
  const componentsList: SetComponentItem[] = useMemo(() => {
    return Object.entries(selectedComponents)
      .map(([menuId, qty]) => {
        const item = menus.find((m) => m.id === menuId);
        if (!item) return null;
        return {
          menu_id: item.id,
          menu_name: item.name,
          price: item.price,
          quantity: qty,
        };
      })
      .filter((x): x is SetComponentItem => x !== null);
  }, [selectedComponents, menus]);

  const componentsTotal = useMemo(() => {
    return componentsList.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [componentsList]);

  // 선택된 포장용기
  const selectedBox = useMemo(() => {
    return PACKAGE_BOX_OPTIONS.find((b) => b.id === selectedBoxId) || PACKAGE_BOX_OPTIONS[0];
  }, [selectedBoxId]);

  // 선택된 옵션들
  const selectedOptions = useMemo(() => {
    return SPECIAL_OPTIONS.filter((o) => selectedOptionIds.includes(o.id));
  }, [selectedOptionIds]);

  const optionsTotal = useMemo(() => {
    return selectedOptions.reduce((sum, o) => sum + o.price, 0);
  }, [selectedOptions]);

  // 세트 1개당 단가 = 품목 합계 + 포장용기 + 옵션 합계
  const unitSetPrice = componentsTotal + selectedBox.price + optionsTotal;
  // 세트 총금액 = 단가 x 세트수량
  const totalSetAmount = unitSetPrice * setQuantity;

  const totalItemsCount = componentsList.reduce((sum, i) => sum + i.quantity, 0);

  if (!isOpen) return null;

  // 장바구니에 세트메뉴 담기
  const handleAddToCart = () => {
    if (componentsList.length === 0) {
      alert('세트메뉴에 포함할 품목을 최소 1개 이상 담아주세요.');
      return;
    }

    const setDetails: CustomSetDetails = {
      set_name: setName.trim() || '은달 맞춤 선물세트',
      components: componentsList,
      package_box: {
        name: selectedBox.name,
        price: selectedBox.price,
      },
      packaging_options: selectedOptions.map((o) => ({
        name: o.name,
        price: o.price,
      })),
      unit_price: unitSetPrice,
    };

    // 가상 대표 MenuItem 생성
    const setMenuDummy: MenuItem = {
      id: `custom-set-${Date.now()}`,
      category_id: 'custom_set',
      name: `[세트] ${setDetails.set_name}`,
      description: `구성: ${componentsList.map((c) => `${c.menu_name}(${c.quantity})`).join(', ')} / 포장: ${selectedBox.name}`,
      price: unitSetPrice,
      image_url:
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
      is_sold_out: false,
      sort_order: 999,
      is_active: true,
    };

    const cartItem: CartItem = {
      id: `set-item-${Date.now()}`,
      menu: setMenuDummy,
      quantity: setQuantity,
      is_custom_set: true,
      set_details: setDetails,
    };

    onAddSetToCart(cartItem);
    setAddedEffect(true);
    setTimeout(() => {
      setAddedEffect(false);
      onClose();
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-800 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-900 to-amber-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-400 text-stone-950 font-black">
              <Gift className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base sm:text-lg">은달 맞춤 세트메뉴 만들기</h3>
              <p className="text-[11px] text-amber-200/90">
                원하는 음료·디저트를 자유롭게 담고, 포장용기와 캔시머 등 옵션을 지정하여 나만의 세트를 구성합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* 세트 이름 지정 */}
          <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-1.5">
            <label className="block text-xs font-bold text-amber-950">
              세트메뉴 이름 지정
            </label>
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="예: 승진 축하 다과세트, VIP 티타임 선물세트 등"
              className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 1단계: 세트에 포함할 품목 담기 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                <span>세트에 담을 품목 선택 (다수 선택 가능)</span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                담긴 품목: <strong className="text-amber-800">{totalItemsCount}개</strong> ({componentsTotal.toLocaleString()}원)
              </span>
            </div>

            {/* 카테고리 필터 & 검색 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedCatId('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                    selectedCatId === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  전체
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCatId(c.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                      selectedCatId === c.id
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="relative w-36 sm:w-44 shrink-0">
                <Search className="w-3 h-3 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="메뉴 검색"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-[11px]"
                />
              </div>
            </div>

            {/* 메뉴 선택 카드 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-stone-50 rounded-2xl border border-stone-200">
              {filteredMenus.map((menu) => {
                const count = selectedComponents[menu.id] || 0;
                return (
                  <div
                    key={menu.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      count > 0
                        ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/40'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={menu.image_url}
                        alt={menu.name}
                        className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 text-xs truncate">{menu.name}</h4>
                        <p className="text-[11px] font-bold text-amber-900">
                          {menu.price.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    {/* 수량 컨트롤러 */}
                    <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-lg px-1.5 py-0.5 shrink-0 shadow-2xs">
                      {count > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUpdateComponentQty(menu.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                      <span className={`w-4 text-center font-bold text-[11px] ${count > 0 ? 'text-amber-900' : 'text-stone-400'}`}>
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateComponentQty(menu.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2단계: 포장용기 선택 */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              <span>포장용기 선택 (필수 1종)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PACKAGE_BOX_OPTIONS.map((box) => {
                const isSelected = selectedBoxId === box.id;
                return (
                  <div
                    key={box.id}
                    onClick={() => setSelectedBoxId(box.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-600 ring-2 ring-amber-500/20 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="package_box"
                      checked={isSelected}
                      onChange={() => setSelectedBoxId(box.id)}
                      className="text-amber-600 focus:ring-amber-500 h-4 w-4 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-stone-900 text-xs">{box.name}</span>
                        <span className="font-bold text-amber-900 text-[11px]">
                          {box.price === 0 ? '무료' : `+${box.price.toLocaleString()}원`}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">{box.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3단계: 특수 옵션 선택 (캔시머, 리본 선물포장 등) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[11px] flex items-center justify-center font-bold">
                3
              </span>
              <span>특수 포장 & 선물 옵션 (선택 가능)</span>
            </div>

            <div className="space-y-1.5">
              {SPECIAL_OPTIONS.map((opt) => {
                const isChecked = selectedOptionIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleToggleOption(opt.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isChecked
                        ? 'bg-amber-50/60 border-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-700" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                      <div>
                        <span className="font-bold text-stone-900 text-xs">{opt.name}</span>
                        <p className="text-[10px] text-stone-500">{opt.desc}</p>
                      </div>
                    </div>
                    <span className="font-bold text-amber-900 text-xs shrink-0">
                      +{opt.price.toLocaleString()}원
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4단계: 세트 주문 수량 및 요약 카드 */}
          <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <span className="text-stone-300 font-medium">세트 주문 수량</span>
              <div className="flex items-center gap-2 bg-stone-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSetQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-black text-sm font-mono text-amber-300">
                  {setQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setSetQuantity((prev) => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 세부 항목 브레이크다운 */}
            <div className="space-y-1 text-[11px] text-stone-300">
              <div className="flex justify-between">
                <span>포함 품목 합계 ({totalItemsCount}개):</span>
                <span>{componentsTotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>포장용기 ({selectedBox.name}):</span>
                <span>+{selectedBox.price.toLocaleString()}원</span>
              </div>
              {selectedOptions.length > 0 && (
                <div className="flex justify-between">
                  <span>추가 옵션 ({selectedOptions.map((o) => o.name.split(' ')[0]).join(', ')}):</span>
                  <span>+{optionsTotal.toLocaleString()}원</span>
                </div>
              )}
              <div className="flex justify-between text-stone-200 pt-1 border-t border-stone-800 font-bold">
                <span>세트 1개 단가:</span>
                <span className="text-amber-300">{unitSetPrice.toLocaleString()}원</span>
              </div>
            </div>

            {/* 최종 통합 금액 */}
            <div className="pt-2 border-t border-dashed border-stone-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-300">세트메뉴 통합 견적 합계</span>
                <p className="text-[10px] text-stone-400">({setQuantity}세트 구성)</p>
              </div>
              <span className="text-xl font-black text-amber-400 font-mono">
                {totalSetAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 하단 담기 버튼 바 */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-2xl text-xs transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={componentsList.length === 0}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
              componentsList.length === 0
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : addedEffect
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-700 hover:bg-amber-800 text-white'
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
                  세트메뉴 견적서에 담기 ({totalSetAmount.toLocaleString()}원)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
