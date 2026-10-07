'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CafeIntroModal from '@/components/CafeIntroModal';
import CategoryNav from '@/components/CategoryNav';
import MenuCard from '@/components/MenuCard';
import CartDrawer from '@/components/CartDrawer';
import OrderModal from '@/components/OrderModal';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import CheckOrderModal from '@/components/CheckOrderModal';
import MenuDetailModal from '@/components/MenuDetailModal';
import InstallPromptModal, { useHomeScreenInstall } from '@/components/InstallPromptModal';
import GpsGuideModal from '@/components/GpsGuideModal';
import { CafeInfo, Category, MenuItem, DeliveryPolicy, CartItem, Order, Store } from '@/lib/types';
import { ShoppingBag, ArrowRight, Sparkles, Coffee, Clock, MapPin, Loader2, BookmarkPlus, Navigation } from 'lucide-react';

export default function HomePage() {
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [deliveryPolicy, setDeliveryPolicy] = useState<DeliveryPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  // 주문 수령 형태: 배달(기본) vs 매장 픽업
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // 선택된 카테고리
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 장바구니 상태
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDistanceLabel, setSelectedDistanceLabel] = useState<string>('');

  // 모달 제어
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCheckOrderOpen, setIsCheckOrderOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isGpsGuideOpen, setIsGpsGuideOpen] = useState(false);
  const [selectedDetailMenu, setSelectedDetailMenu] = useState<MenuItem | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // 휴대폰 바탕화면 추가(PWA) 훅
  const { triggerInstall } = useHomeScreenInstall();

  const handleInstallClick = () => {
    triggerInstall(() => setIsInstallModalOpen(true));
  };

  // 초기 데이터 불러오기
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/public/data');
        const data = await res.json();
        if (data.cafe) setCafe(data.cafe);
        if (data.categories) setCategories(data.categories);
        if (data.menus) setMenus(data.menus);
        if (data.stores && data.stores.length > 0) {
          setStores(data.stores);
          setSelectedStoreId(data.stores[0].id);
        }
        if (data.deliveryPolicy) {
          setDeliveryPolicy(data.deliveryPolicy);
          if (data.deliveryPolicy.distance_rules && data.deliveryPolicy.distance_rules.length > 0) {
            setSelectedDistanceLabel(data.deliveryPolicy.distance_rules[0].label);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 장바구니에 메뉴 담기
  const handleAddToCart = (menu: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.menu.id === menu.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { menu, quantity: 1 }];
    });
  };

  // 장바구니 수량 변경 (+/-)
  const handleUpdateQuantity = (menuId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menu.id === menuId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // 장바구니 항목 삭제
  const handleRemoveItem = (menuId: string) => {
    setCart((prev) => prev.filter((item) => item.menu.id !== menuId));
  };

  // 장바구니 전체 초기화
  const handleClearCart = () => {
    if (confirm('장바구니를 모두 비우시겠습니까?')) {
      setCart([]);
    }
  };

  // 주문 접수 성공 콜백
  const handleOrderSuccess = (order: Order) => {
    setCompletedOrder(order);
    setCart([]);
  };

  // 필터링된 메뉴 목록
  const filteredMenus = menus.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category_id === selectedCategory;
  });

  // 실시간 합계 금액 계산
  const isPickup = orderType === 'pickup';
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const itemsTotal = cart.reduce((sum, item) => sum + item.menu.price * item.quantity, 0);
  const baseFee = deliveryPolicy?.base_fee ?? 3000;
  const freeThreshold = deliveryPolicy?.free_threshold ?? 35000;
  const isFreeDelivery = isPickup || (itemsTotal >= freeThreshold && itemsTotal > 0);
  const distanceRule = deliveryPolicy?.distance_rules.find((r) => r.label === selectedDistanceLabel);
  const extraFee = isPickup ? 0 : (distanceRule ? distanceRule.extra_fee : 0);
  const deliveryFee = isPickup
    ? 0
    : itemsTotal > 0
    ? (isFreeDelivery ? 0 : baseFee) + extraFee
    : 0;
  const finalEstimatedTotal = itemsTotal + deliveryFee;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] text-stone-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        <p className="text-sm font-medium tracking-wide">은달 카페를 준비하는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-28">
      {/* 1. 상단 글로벌 헤더 (관리자 링크 분리, 견적조회 버튼, 홈화면추가 버튼) */}
      <Header
        cafe={cafe}
        onOpenIntro={() => setIsIntroOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCheckOrder={() => setIsCheckOrderOpen(true)}
        onOpenInstall={handleInstallClick}
        cartCount={cartTotalItems}
      />

      <main className="max-w-md mx-auto w-full">
        {/* 2. 상단 감성 비주얼 배너 */}
        <section className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-stone-200/60 bg-stone-900 h-44 sm:h-52">
            <img
              src={cafe?.hero_image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'}
              alt="은달 카페 무드"
              className="w-full h-full object-cover opacity-80 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/40 to-transparent" />

            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between text-white">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-200 border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  당일 로스팅 & 수제 베이커리
                </span>
                <span className="text-[10px] sm:text-[11px] text-stone-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  09:00 ~ 21:00
                </span>
              </div>

              <div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-tight line-clamp-2">
                  {cafe?.slogan || '은은한 달빛 아래, 깊고 그윽한 한 잔의 여유'}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-stone-300">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{cafe?.address || '서울특별시 마포구 월드컵북로 120'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 휴대폰 바탕화면 즐겨찾기 추가 배너 카드 */}
        <section className="px-3 sm:px-4 py-1.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full p-2.5 sm:p-3 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-amber-800/40 text-left group"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-base sm:text-lg border border-amber-400/20 shrink-0">
                📱
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="truncate">휴대폰 바탕화면에 바로가기 추가</span>
                  <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded-full shrink-0">
                    원클릭
                  </span>
                </div>
                <div className="text-[11px] text-stone-300 mt-0.5 truncate">
                  앱처럼 터치 한 번으로 빠르게 주문하세요
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-0.5 shrink-0 pl-1.5">
              <span>추가</span>
              <span className="group-hover:translate-x-0.5 transition-transform">➔</span>
            </div>
          </button>
        </section>

        {/* 배달비 및 픽업 정책 안내 바 & GPS 위치설정 안내 버튼 */}
        <section className="px-3 sm:px-4 py-1 space-y-1">
          <div className="p-2.5 sm:p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-950 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-200 flex items-center justify-center font-bold text-[10px] sm:text-[11px] text-amber-900 shrink-0">
                ✦
              </span>
              <span className="text-[11px] sm:text-xs truncate">
                <strong>{deliveryPolicy?.free_threshold.toLocaleString()}원↑</strong> 배달비 무료! (픽업 <strong>0원</strong>)
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsGpsGuideOpen(true)}
                className="text-[11px] text-amber-900 font-bold underline hover:text-amber-950 flex items-center gap-0.5"
                title="정확한 배달/픽업 관제를 위한 기기 GPS 설정 안내"
              >
                <Navigation className="w-3 h-3 text-amber-700" />
                <span>GPS안내</span>
              </button>
              <button
                onClick={() => setIsIntroOpen(true)}
                className="text-[11px] text-stone-500 font-medium underline hover:text-stone-700"
              >
                소개
              </button>
            </div>
          </div>
        </section>

        {/* 3. 카테고리 네비게이션 (Sticky) */}
        <CategoryNav
          categories={categories}
          selectedCategoryId={selectedCategory}
          onSelectCategory={(id) => setSelectedCategory(id)}
        />

        {/* 4. 메뉴 카드 리스트 (수량 증감 - 및 + 지원) */}
        <section className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-800" />
              {selectedCategory === 'all'
                ? '전체 메뉴'
                : categories.find((c) => c.id === selectedCategory)?.name || '메뉴'}
              <span className="text-xs text-stone-600 font-normal">({filteredMenus.length})</span>
            </h3>
            <span className="text-[11px] text-stone-600">실시간 견적 자동 반영</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {filteredMenus.map((menu) => {
              const inCart = cart.find((i) => i.menu.id === menu.id)?.quantity || 0;
              return (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  inCartCount={inCart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onOpenDetail={(targetMenu) => setSelectedDetailMenu(targetMenu)}
                />
              );
            })}
          </div>
        </section>
      </main>

      {/* 5. 하단 고정 실시간 견적 플로팅 바 (iOS Safe Area 대응) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 sm:p-3 pb-safe bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md border-t border-stone-200">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-stone-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-xl flex items-center justify-between hover:bg-stone-800 active:scale-[0.99] transition-all gap-2"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="relative p-1.5 sm:p-2 rounded-xl bg-amber-600 text-white font-bold shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-stone-900 text-[10px] font-black flex items-center justify-center">
                    {cartTotalItems}
                  </span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] sm:text-[11px] text-stone-300 font-medium truncate">실시간 예상 견적</p>
                  <p className="text-sm sm:text-base font-black text-amber-200 tracking-tight truncate">
                    {finalEstimatedTotal.toLocaleString()}원
                    <span className="text-[11px] font-normal text-stone-300 ml-1 hidden xs:inline">
                      {isPickup ? '(픽업 0원)' : `(배달비 ${isFreeDelivery ? '무료' : `${deliveryFee.toLocaleString()}원`})`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold bg-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-amber-200 shrink-0">
                <span>{isPickup ? '픽업요청' : '견적요청'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 6. 모달 컴포넌트들 */}
      {/* 카페 소개 모달 */}
      <CafeIntroModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
        cafe={cafe}
      />

      {/* 실시간 견적 및 장바구니 드로어 (배달 vs 픽업 선택 상호 연동) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        deliveryPolicy={deliveryPolicy}
        selectedDistanceLabel={selectedDistanceLabel}
        onSelectDistance={setSelectedDistanceLabel}
        orderType={orderType}
        onSelectOrderType={setOrderType}
        stores={stores}
        selectedStoreId={selectedStoreId}
        onSelectStoreId={setSelectedStoreId}
        onProceedOrder={() => {
          setIsCartOpen(false);
          setIsOrderOpen(true);
        }}
      />

      {/* 주문서/견적서 작성 모달 (24시간/12h 병기 + 도로명주소 API + 개인정보동의 + 픽업/GPS) */}
      <OrderModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        cart={cart}
        deliveryPolicy={deliveryPolicy}
        selectedDistanceLabel={selectedDistanceLabel}
        stores={stores}
        initialOrderType={orderType}
        initialStoreId={selectedStoreId}
        onOrderSuccess={handleOrderSuccess}
        onOpenPrivacyModal={() => setIsPrivacyOpen(true)}
        onOpenGpsGuide={() => setIsGpsGuideOpen(true)}
      />

      {/* 개인정보보호법 전문 모달 */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* 견적 정상 접수 완료 모달 (안내 문구 포함) */}
      <OrderSuccessModal
        order={completedOrder}
        quoteNotice={cafe?.quote_notice}
        onClose={() => setCompletedOrder(null)}
      />

      {/* 견적/주문 실시간 확인 모달 */}
      <CheckOrderModal
        isOpen={isCheckOrderOpen}
        onClose={() => setIsCheckOrderOpen(false)}
      />

      {/* 메뉴 상세 모달 (사진, 설명, 가격 및 수량 담기) */}
      <MenuDetailModal
        menu={selectedDetailMenu}
        isOpen={!!selectedDetailMenu}
        onClose={() => setSelectedDetailMenu(null)}
        currentQuantity={
          selectedDetailMenu
            ? cart.find((c) => c.menu.id === selectedDetailMenu.id)?.quantity || 0
            : 0
        }
        onUpdateQuantity={(menu, newQty) => {
          if (newQty <= 0) {
            setCart((prev) => prev.filter((item) => item.menu.id !== menu.id));
          } else {
            setCart((prev) => {
              const existing = prev.find((item) => item.menu.id === menu.id);
              if (existing) {
                return prev.map((item) =>
                  item.menu.id === menu.id ? { ...item, quantity: newQty } : item
                );
              }
              return [...prev, { menu, quantity: newQty }];
            });
          }
        }}
      />

      {/* 4. 휴대폰 바탕화면 즐겨찾기 추가 가이드 모달 */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        appIconUrl={cafe?.app_icon_url || cafe?.logo_icon_url}
      />

      {/* 5. GPS 위치 정보 권한 및 설정 안내 모달 */}
      <GpsGuideModal
        isOpen={isGpsGuideOpen}
        onClose={() => setIsGpsGuideOpen(false)}
      />
    </div>
  );
}
