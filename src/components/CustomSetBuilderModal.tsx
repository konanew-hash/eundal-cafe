'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Coffee,
  AlertCircle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { MenuItem, Category, CartItem, CustomSetDetails, SetComponentItem, PresetSet } from '@/lib/types';

interface CustomSetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menus: MenuItem[];
  categories: Category[];
  presetSets?: PresetSet[];
  onAddSetToCart: (cartItem: CartItem) => void;
}

// 1. 포장용기 옵션 기본 Fallback
const PACKAGE_BOX_OPTIONS = [
  { id: 'box_craft', name: '은달 시그니처 크라프트 선물박스', price: 1500, desc: '고급 크라프트 재질의 은달 전용 선물 상자', max_items_count: 3 },
  { id: 'box_clear', name: '투명 손잡이 선물팩', price: 1000, desc: '디저트와 음료가 돋보이는 모던 투명 패키지', max_items_count: 2 },
  { id: 'box_premium', name: '프리미엄 기프트 하드케이스', price: 3000, desc: '격식 있는 자리에 어울리는 단단한 선물용 하드케이스', max_items_count: 4 },
  { id: 'box_carrier', name: '일반 테이크아웃 캐리어 & 백', price: 0, desc: '기본 음료 캐리어 및 종이봉투 포장', max_items_count: 2 },
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
  presetSets = [],
  onAddSetToCart,
}: CustomSetBuilderModalProps) {
  const [setName, setSetName] = useState('은달 맞춤 선물세트');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, number>>({});
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  // 요구사항 버그 해결: 캔시머 등 특수 포장 옵션은 사용자가 원할 때만 선택하도록 기본값 빈 배열로 설정하고 강제 자동선택 완전 제거!
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [setQuantity, setSetQuantity] = useState<number>(1);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [addedEffect, setAddedEffect] = useState(false);

  // 음료 카테고리/품목 판별 헬퍼
  const isBeverage = (menu: MenuItem) => {
    const cat = categories.find((c) => c.id === menu.category_id);
    const catName = cat?.name || '';
    return (
      catName.includes('커피') ||
      catName.includes('음료') ||
      catName.includes('티') ||
      catName.includes('에이드') ||
      catName.includes('시그니처') ||
      menu.name.includes('아메리카노') ||
      menu.name.includes('라떼') ||
      menu.name.includes('스무디') ||
      menu.name.includes('티') ||
      menu.name.includes('에이드') ||
      menu.name.includes('밀크티')
    );
  };

  // 1. 관리자 등록 포장용기 목록 (DB 메뉴 중 packaging_type === 'box' 또는 기본 fallback)
  const boxOptions = useMemo(() => {
    const dbBoxes = menus.filter((m) => m.packaging_type === 'box' && m.is_active && !m.is_sold_out);
    if (dbBoxes.length > 0) {
      return dbBoxes.map((b) => ({
        id: b.id,
        name: b.name,
        price: b.price,
        desc: b.description || '은달 전용 선물 포장용기',
        max_items_count: b.max_items_count ?? (b.name.includes('하드케이스') ? 4 : b.name.includes('크라프트') ? 3 : 2),
      }));
    }
    return PACKAGE_BOX_OPTIONS;
  }, [menus]);

  // 2. 관리자 등록 특수포장 옵션 목록 (DB 메뉴 중 packaging_type === 'special' 또는 기본 fallback)
  const specialOptions = useMemo(() => {
    const dbOptions = menus.filter((m) => m.packaging_type === 'special' && m.is_active && !m.is_sold_out);
    if (dbOptions.length > 0) {
      return dbOptions.map((o) => ({
        id: o.id,
        name: o.name,
        price: o.price,
        desc: o.description || '은달 특별 포장 옵션',
      }));
    }
    return SPECIAL_OPTIONS;
  }, [menus]);

  // 초기 포장용기 기본 선택 설정
  useEffect(() => {
    if (boxOptions.length > 0 && (!selectedBoxId || !boxOptions.some((b) => b.id === selectedBoxId))) {
      setSelectedBoxId(boxOptions[0].id);
    }
  }, [boxOptions, selectedBoxId]);

  // 선택된 포장용기
  const selectedBox = useMemo(() => {
    return boxOptions.find((b) => b.id === selectedBoxId) || boxOptions[0] || { id: 'default', name: '기본 포장', price: 0, desc: '', max_items_count: 3 };
  }, [boxOptions, selectedBoxId]);

  // 구성된 품목 중에 1/2 샌드위치가 포함되어 있는지 여부
  const hasHalfSandwich = useMemo(() => {
    return Object.entries(selectedComponents).some(([menuId, qty]) => {
      if (qty <= 0) return false;
      const item = menus.find((m) => m.id === menuId);
      return item && (item.is_set_only || item.is_even_only || item.name.includes('(1/2개)'));
    });
  }, [selectedComponents, menus]);

  // 요구사항: 1/2 샌드위치가 포함된 경우 세트 주문 수량을 짝수로 보정
  useEffect(() => {
    if (hasHalfSandwich && setQuantity % 2 !== 0) {
      setSetQuantity((prev) => Math.max(2, Math.ceil(prev / 2) * 2));
    }
  }, [hasHalfSandwich, setQuantity]);

  // 품목 수량 조절 (+/-)
  const handleUpdateComponentQty = (menuId: string, delta: number) => {
    const targetMenu = menus.find((m) => m.id === menuId);
    if (!targetMenu) return;

    // 1. 음료 제한 검사: 한 세트당 음료는 최대 1개만 선택 가능
    if (delta > 0 && isBeverage(targetMenu)) {
      const currentBevEntries = Object.entries(selectedComponents).filter(([id, qty]) => {
        if (qty <= 0) return false;
        const m = menus.find((item) => item.id === id);
        return m && isBeverage(m);
      });
      const totalBevCount = currentBevEntries.reduce((sum, [, qty]) => sum + qty, 0);

      if (totalBevCount >= 1) {
        alert('⚠️ 한 세트당 음료는 최대 1개만 선택하실 수 있습니다.\n(다른 음료로 변경하시려면 담긴 음료를 먼저 빼주세요.)');
        return;
      }
    }

    // 2. 포장용기 담을 수 있는 가지수 제한 검사
    if (delta > 0 && (!selectedComponents[menuId] || selectedComponents[menuId] <= 0)) {
      const currentKindsCount = Object.keys(selectedComponents).filter((id) => selectedComponents[id] > 0).length;
      const maxKinds = selectedBox.max_items_count || 3;
      if (currentKindsCount >= maxKinds) {
        alert(`⚠️ 선택하신 포장용기 [${selectedBox.name}]에는 최대 ${maxKinds}가지 품목까지만 담을 수 있습니다.\n(다른 품목을 담으시려면 기존 품목을 먼저 빼주세요.)`);
        return;
      }
    }

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

  // 품목 수량 직접 입력 처리
  const handleDirectSetComponentQty = (menuId: string, val: number) => {
    const targetMenu = menus.find((m) => m.id === menuId);
    if (!targetMenu) return;

    if (isNaN(val) || val <= 0) {
      setSelectedComponents((prev) => {
        const next = { ...prev };
        delete next[menuId];
        return next;
      });
      return;
    }

    // 음료인 경우 최대 1개 제한
    if (isBeverage(targetMenu) && val > 1) {
      alert('⚠️ 한 세트당 음료는 최대 1개만 선택 가능합니다.');
      val = 1;
    }

    // 신규 가지수 초과 검사
    if (!selectedComponents[menuId] || selectedComponents[menuId] <= 0) {
      const currentKindsCount = Object.keys(selectedComponents).filter((id) => selectedComponents[id] > 0).length;
      const maxKinds = selectedBox.max_items_count || 3;
      if (currentKindsCount >= maxKinds) {
        alert(`⚠️ 선택하신 포장용기 [${selectedBox.name}]에는 최대 ${maxKinds}가지 품목까지만 담을 수 있습니다.`);
        return;
      }
    }

    setSelectedComponents((prev) => ({
      ...prev,
      [menuId]: val,
    }));
  };

  // 특수 옵션 토글
  const handleToggleOption = (optId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  // 필터링된 메뉴 목록 (포장용기/특수포장 제외, 세트 허용 품목 + 1/2 샌드위치 포함)
  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      if (m.is_sold_out) return false;
      if (m.packaging_type === 'box' || m.packaging_type === 'special') return false;
      if (m.is_available_for_set === false) return false;
      if (m.category_id === '77777777-7777-7777-7777-777777777777') return false;
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

  // 선택된 옵션들
  const selectedOptions = useMemo(() => {
    return specialOptions.filter((o) => selectedOptionIds.includes(o.id));
  }, [specialOptions, selectedOptionIds]);

  const optionsTotal = useMemo(() => {
    return selectedOptions.reduce((sum, o) => sum + o.price, 0);
  }, [selectedOptions]);

  // 세트 1개당 단가 = 품목 합계 + 포장용기 + 옵션 합계
  const unitSetPrice = componentsTotal + selectedBox.price + optionsTotal;
  // 세트 총금액 = 단가 x 세트수량
  const totalSetAmount = unitSetPrice * setQuantity;

  const totalItemsCount = componentsList.reduce((sum, i) => sum + i.quantity, 0);

  // 세트 수량 변경 핸들러 (1/2 샌드위치가 있으면 짝수 2씩 증감)
  const handleUpdateSetQty = (delta: number) => {
    if (hasHalfSandwich) {
      const step = 2;
      const next = setQuantity + delta * step;
      setSetQuantity(Math.max(2, next));
    } else {
      setSetQuantity((prev) => Math.max(1, prev + delta));
    }
  };

  // 세트 수량 직접 입력 핸들러
  const handleDirectSetQuantity = (val: number) => {
    if (isNaN(val) || val <= 0) {
      setSetQuantity(hasHalfSandwich ? 2 : 1);
      return;
    }
    if (hasHalfSandwich) {
      if (val % 2 !== 0) {
        const adjusted = Math.max(2, Math.ceil(val / 2) * 2);
        alert(`🥪 1/2 샌드위치가 포함된 세트메뉴는 온전한 빵 제조를 위해 짝수 수량(2, 4, 6...세트) 단위로 주문 가능합니다.\n(${adjusted}세트로 자동 보정됩니다.)`);
        setSetQuantity(adjusted);
      } else {
        setSetQuantity(Math.max(2, val));
      }
    } else {
      setSetQuantity(Math.max(1, val));
    }
  };

  // 은픽(추천 세트) 원클릭 견적서(장바구니) 담기 핸들러
  const handleQuickAddPreset = (preset: PresetSet) => {
    // 1/2 샌드위치 포함 여부 검사
    const hasHalf = preset.components.some((c) => {
      const item = menus.find((m) => m.id === c.menu_id);
      return item && (item.is_set_only || item.is_even_only || item.name.includes('(1/2개)'));
    });
    const qty = hasHalf ? 2 : 1;

    const setDetails: CustomSetDetails = {
      set_name: preset.name,
      components: preset.components,
      package_box: {
        name: preset.package_box_name || '은달 전용 선물포장',
        price: preset.package_box_price || 0,
      },
      packaging_options: (preset.packaging_options || []).map((o) => ({
        name: o.name,
        price: o.price,
      })),
      unit_price: preset.price,
    };

    const setMenuDummy: MenuItem = {
      id: `preset-set-${preset.id}-${Date.now()}`,
      category_id: 'custom_set',
      name: `[은픽] ${preset.name}`,
      description:
        preset.description ||
        `구성: ${preset.components.map((c) => `${c.menu_name}(${c.quantity})`).join(', ')} / 포장: ${preset.package_box_name || '기본'}`,
      price: preset.price,
      image_url:
        preset.image_url ||
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
      is_sold_out: false,
      sort_order: 999,
      is_active: true,
    };

    const cartItem: CartItem = {
      id: `set-item-${Date.now()}`,
      menu: setMenuDummy,
      quantity: qty,
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

  // 은픽(추천 세트) 커스텀 빌더로 불러와서 수정하기 핸들러
  const handleLoadPreset = (preset: PresetSet) => {
    setSetName(preset.name);
    const compMap: Record<string, number> = {};
    preset.components.forEach((c) => {
      compMap[c.menu_id] = c.quantity;
    });
    setSelectedComponents(compMap);

    if (preset.package_box_id) {
      setSelectedBoxId(preset.package_box_id);
    }
    if (preset.packaging_options && preset.packaging_options.length > 0) {
      setSelectedOptionIds(preset.packaging_options.map((o) => o.id));
    } else {
      setSelectedOptionIds([]);
    }

    const hasHalf = preset.components.some((c) => {
      const item = menus.find((m) => m.id === c.menu_id);
      return item && (item.is_set_only || item.is_even_only || item.name.includes('(1/2개)'));
    });
    setSetQuantity(hasHalf ? 2 : 1);
  };

  if (!isOpen) return null;

  // 장바구니에 세트메뉴 담기
  const handleAddToCart = () => {
    if (componentsList.length === 0) {
      alert('세트메뉴에 포함할 품목을 최소 1개 이상 담아주세요.');
      return;
    }

    if (hasHalfSandwich && setQuantity % 2 !== 0) {
      alert('🥪 1/2 샌드위치가 포함된 세트메뉴는 짝수 세트(2개, 4개, 6개...) 단위로만 주문하실 수 있습니다.');
      setSetQuantity((prev) => Math.max(2, Math.ceil(prev / 2) * 2));
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
                원하는 음료·디저트를 자유롭게 담고, 포장용기와 옵션을 지정하여 나만의 세트를 구성합니다.
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
          {/* 요구사항: 서브웨이 썹픽 스타일 추천 세트 조합 (은픽) 섹션 */}
          {presetSets && presetSets.filter((p) => p.is_active).length > 0 && (
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border-2 border-amber-400/40 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-stone-950 font-black">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-1.5">
                      <span>은달 추천 꿀조합</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold">
                        은픽 (썹픽)
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      고민될 땐 검증된 꿀조합으로! 원클릭으로 견적서에 바로 담거나 불러와서 수정할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 추천 조합 카드 목록 (가로 스크롤 & 슬라이드 형태) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {presetSets
                  .filter((p) => p.is_active)
                  .map((preset) => {
                    const presetHasHalf = preset.components.some((c) => {
                      const item = menus.find((m) => m.id === c.menu_id);
                      return item && (item.is_set_only || item.is_even_only || item.name.includes('(1/2개)'));
                    });

                    return (
                      <div
                        key={preset.id}
                        className="bg-white rounded-xl p-3 border border-amber-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                      >
                        {preset.badge_text && (
                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              {preset.badge_text}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1.5 pr-14">
                          <h5 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-amber-800 transition-colors">
                            {preset.name}
                          </h5>
                          <p className="text-amber-700 font-extrabold text-xs">
                            {preset.price.toLocaleString()}원
                            <span className="text-[10px] text-stone-500 font-normal ml-1">/ 1세트</span>
                          </p>
                        </div>

                        {preset.description && (
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-1">
                            {preset.description}
                          </p>
                        )}

                        {/* 구성품 요약 태그 */}
                        <div className="my-2.5 p-2 bg-stone-50 rounded-lg border border-stone-200/70 space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {preset.components.map((c, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-700 font-medium"
                              >
                                {c.menu_name} ×{c.quantity}
                              </span>
                            ))}
                          </div>
                          {preset.package_box_name && (
                            <div className="text-[10px] text-stone-500 flex items-center gap-1 pt-0.5 border-t border-stone-200/60">
                              <Package className="w-2.5 h-2.5 text-amber-600" />
                              <span>포장: {preset.package_box_name}</span>
                            </div>
                          )}
                          {presetHasHalf && (
                            <div className="text-[10px] text-amber-700 font-bold">
                              🥪 1/2 샌드위치 포함 (주문 수량: 짝수 단위)
                            </div>
                          )}
                        </div>

                        {/* 액션 버튼 2종 */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-stone-100">
                          <button
                            type="button"
                            onClick={() => handleLoadPreset(preset)}
                            className="w-full py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[11px] transition-colors flex items-center justify-center gap-1"
                            title="이 조합의 구성을 아래 빌더로 불러와서 자유롭게 변경합니다"
                          >
                            <span>✏️ 불러와 수정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddPreset(preset)}
                            className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-stone-950 font-black rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 shadow-2xs"
                            title="이 구성 그대로 견적서에 즉시 담습니다"
                          >
                            <Zap className="w-3 h-3 fill-stone-950" />
                            <span>견적서 담기</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 요구사항: 세트메뉴 이름 지정 개선 (수정이 가능하다는 안내 및 자율 입력 지원) */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>✏️ 세트메뉴 이름 지정</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded font-bold">
                  자유롭게 수정 가능
                </span>
              </label>
              <span className="text-[11px] text-amber-800 hidden sm:inline">
                견적서 및 주문서에 표기될 명칭입니다
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="예: VIP 간담회 샌드위치 세트, 선생님 감사 선물세트 등"
                className="w-full pl-3.5 pr-16 py-2.5 bg-white border border-amber-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-xs sm:text-sm"
              />
              {setName && (
                <button
                  type="button"
                  onClick={() => setSetName('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md"
                >
                  지우기
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-500">
              * 기본 이름 대신 행사명이나 용도에 맞게 원하는 이름으로 자유롭게 입력하실 수 있습니다.
            </p>
          </div>

          {/* 1단계: 세트에 포함할 품목 담기 (음료 1개 제한 및 가지수 제한 안내) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                <span>세트에 담을 품목 선택</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-normal">
                  포장용기 한도: 최대 {selectedBox.max_items_count || 3}가지 품목
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                선택된 가지수: <strong className="text-amber-800">{componentsList.length}/{selectedBox.max_items_count || 3}가지</strong> (총 {totalItemsCount}개 / {componentsTotal.toLocaleString()}원)
              </span>
            </div>

            {/* 안내 뱃지 바: 음료 1개 제한 & 1/2 샌드위치 안내 */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-200">
              <span className="inline-flex items-center gap-1 text-amber-900 font-semibold">
                <Coffee className="w-3 h-3 text-amber-700" />
                음료는 한 세트당 최대 1개만 선택 가능
              </span>
              <span className="text-stone-300">|</span>
              <span className="inline-flex items-center gap-1 text-stone-700">
                🥪 1/2 샌드위치 포함 시 세트 주문 수량은 짝수개(2, 4, 6...)로 제한
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
                {categories
                  .filter((c) => c.id !== '77777777-7777-7777-7777-777777777777')
                  .map((c) => (
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
                const isHalf = menu.is_set_only || menu.is_even_only || menu.name.includes('(1/2개)');
                const isBev = isBeverage(menu);

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
                        <div className="flex items-center gap-1 flex-wrap">
                          <h4 className="font-bold text-stone-900 text-xs truncate">{menu.name}</h4>
                          {isHalf && (
                            <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[9px] shrink-0">
                              1/2 하프
                            </span>
                          )}
                          {isBev && (
                            <span className="px-1 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[9px] shrink-0">
                              음료(1개한도)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-amber-900">
                          {menu.price.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    {/* 수량 컨트롤러 (요구사항: +,-버튼은 1씩, 숫자를 클릭시 직접 수량 기입 가능) */}
                    <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-1 py-0.5 shrink-0 shadow-2xs">
                      {count > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUpdateComponentQty(menu.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}

                      {/* 수량 직접 입력 지원 인풋 */}
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={count === 0 ? '' : count}
                        placeholder="0"
                        onChange={(e) => handleDirectSetComponentQty(menu.id, parseInt(e.target.value, 10))}
                        className={`w-7 text-center font-bold text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded p-0 ${
                          count > 0 ? 'text-amber-900 font-black' : 'text-stone-400'
                        }`}
                        title="클릭하여 수량을 직접 숫자로 입력할 수 있습니다"
                      />

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

          {/* 2단계: 포장용기 선택 (요구사항: 포장용기별 담을 수 있는 가지수 표기) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[11px] flex items-center justify-center font-bold">
                  2
                </span>
                <span>포장용기 선택 (필수 1종)</span>
              </div>
              <span className="text-[11px] text-amber-800 font-semibold">
                선택 용기 수용 한도: 최대 {selectedBox.max_items_count || 3}가지 품목
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {boxOptions.map((box) => {
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
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="font-bold text-stone-900 text-xs">{box.name}</span>
                        <span className="font-bold text-amber-900 text-[11px]">
                          {box.price === 0 ? '무료' : `+${box.price.toLocaleString()}원`}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">{box.desc}</p>
                      <div className="mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                          최대 {box.max_items_count || 3}가지 품목 담기 가능
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3단계: 특수 옵션 선택 (요구사항 버그 수정: 1개가 선택 안 되어도 캔시머 강제 선택되지 않고 완전 자유 선택!) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[11px] flex items-center justify-center font-bold">
                  3
                </span>
                <span>특수 포장 & 선물 옵션 (선택 안 해도 됨 / 자유 선택)</span>
              </div>
              <span className="text-[11px] text-stone-400">
                {selectedOptionIds.length}개 선택됨
              </span>
            </div>

            <div className="space-y-1.5">
              {specialOptions.map((opt) => {
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
                        <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 shrink-0" />
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
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 flex-wrap gap-2">
              <div>
                <span className="text-stone-300 font-medium block">세트 주문 수량</span>
                {hasHalfSandwich && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold mt-0.5">
                    🥪 1/2 샌드위치 포함: 짝수(2, 4, 6...) 세트 단위 주문
                  </span>
                )}
              </div>

              {/* 세트 수량 컨트롤러 (+,-버튼 1 또는 2씩, 숫자 직접 기입 가능) */}
              <div className="flex items-center gap-2 bg-stone-800 p-1.5 rounded-xl border border-stone-700">
                <button
                  type="button"
                  onClick={() => handleUpdateSetQty(-1)}
                  className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
                  title={hasHalfSandwich ? '2세트 감소' : '1세트 감소'}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* 세트 수량 직접 입력 지원 */}
                <input
                  type="number"
                  min={hasHalfSandwich ? 2 : 1}
                  step={hasHalfSandwich ? 2 : 1}
                  value={setQuantity}
                  onChange={(e) => handleDirectSetQuantity(parseInt(e.target.value, 10))}
                  className="w-12 text-center font-black text-sm font-mono text-amber-300 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded p-0"
                  title="클릭하여 세트 수량을 직접 숫자로 입력할 수 있습니다"
                />

                <button
                  type="button"
                  onClick={() => handleUpdateSetQty(1)}
                  className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-bold"
                  title={hasHalfSandwich ? '2세트 증가' : '1세트 증가'}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 세트 구성 요약 */}
            <div className="space-y-1 text-[11px] text-stone-300">
              <div className="flex justify-between">
                <span>포함 품목 ({componentsList.length}가지 / 총 {totalItemsCount}개):</span>
                <span>{componentsTotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>포장용기 ({selectedBox.name}):</span>
                <span>{selectedBox.price.toLocaleString()}원</span>
              </div>
              {selectedOptions.length > 0 && (
                <div className="flex justify-between text-stone-400">
                  <span>특수포장 옵션 ({selectedOptions.map((o) => o.name).join(', ')}):</span>
                  <span>{optionsTotal.toLocaleString()}원</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline font-bold">
                <span className="text-xs text-stone-200">
                  세트 1개당 단가 {setQuantity > 1 && `(x ${setQuantity}세트)`}:
                </span>
                <span className="text-base text-amber-400 font-mono font-black">
                  {totalSetAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 담기 액션 버튼 */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={componentsList.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                componentsList.length > 0
                  ? addedEffect
                    ? 'bg-emerald-600 text-white scale-98'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 active:scale-98'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {componentsList.length === 0
                  ? '세트에 담을 품목을 먼저 선택해주세요'
                  : addedEffect
                  ? '✓ 세트메뉴가 장바구니에 담겼습니다!'
                  : `이 세트메뉴 장바구니에 담기 (${totalSetAmount.toLocaleString()}원)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
