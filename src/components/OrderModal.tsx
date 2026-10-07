'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  CheckSquare,
  Square,
  FileText,
  AlertCircle,
  Loader2,
  Search,
  Store as StoreIcon,
  Truck,
  ExternalLink,
  Navigation,
  RotateCw,
  HelpCircle,
  LocateFixed,
} from 'lucide-react';
import DaumPostcode from 'react-daum-postcode';
import { CartItem, DeliveryPolicy, Order, Store } from '@/lib/types';
import { getBrowserLocation, calculateDistanceInMeters, formatDistance } from '@/lib/geoUtils';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  deliveryPolicy: DeliveryPolicy | null;
  selectedDistanceLabel: string;
  stores?: Store[];
  initialOrderType?: 'delivery' | 'pickup';
  initialStoreId?: string;
  onOrderSuccess: (order: Order) => void;
  onOpenPrivacyModal: () => void;
  onOpenGpsGuide?: () => void;
}

// 매장 기본 좌표 (수원시 장안구 조원동, 파장동)
const STORE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '74f3b811-7bf3-4793-a0f2-ceeee50da851': { lat: 37.3015, lng: 127.0178 }, // 은달 1호점 조원
  'c948e546-490d-400d-b8d5-583465111e72': { lat: 37.3168, lng: 126.9885 }, // 은달 2호점 파장
};

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

export default function OrderModal({
  isOpen,
  onClose,
  cart,
  deliveryPolicy,
  selectedDistanceLabel,
  stores = [],
  initialOrderType = 'delivery',
  initialStoreId,
  onOrderSuccess,
  onOpenPrivacyModal,
  onOpenGpsGuide,
}: OrderModalProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // 주문 형태: 배달(delivery) vs 픽업(pickup)
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>(initialOrderType);

  // 픽업 매장 목록 (props가 비었으면 기본 매장 사용)
  const activeStores = stores.length > 0 ? stores.filter((s) => s.is_active) : DEFAULT_STORES;
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    initialStoreId || activeStores[0]?.id || DEFAULT_STORES[0].id
  );

  // 상위 상태 변경 시 동기화
  useEffect(() => {
    if (initialOrderType) setOrderType(initialOrderType);
  }, [initialOrderType]);

  useEffect(() => {
    if (initialStoreId) setSelectedStoreId(initialStoreId);
  }, [initialStoreId]);

  // 폼 상태
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(todayStr);
  const [deliveryHour, setDeliveryHour] = useState('12');
  const [deliveryMinute, setDeliveryMinute] = useState('00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState('');
  const [orderMemo, setOrderMemo] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // 주소 검색 팝업 상태
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  // 지도 보기 팝업 상태
  const [mapPopupStore, setMapPopupStore] = useState<Store | null>(null);

  // GPS 좌표 수집 상태
  const [gpsLat, setGpsLat] = useState<number | undefined>(undefined);
  const [gpsLng, setGpsLng] = useState<number | undefined>(undefined);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | undefined>(undefined);
  const [gpsAddress, setGpsAddress] = useState<string>('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'denied' | 'unsupported'>('idle');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // GPS Geolocation 수집 함수 (고도화 2단계 방식: 저정밀도 즉시 획득 후 고정밀 갱신 + 서버 역지오코딩)
  const requestGpsLocation = async () => {
    setGpsStatus('locating');
    try {
      const loc = await getBrowserLocation();
      setGpsLat(loc.latitude);
      setGpsLng(loc.longitude);
      setGpsAccuracy(loc.accuracy);
      setGpsAddress(loc.address || `위도 ${loc.latitude.toFixed(4)}, 경도 ${loc.longitude.toFixed(4)}`);
      setGpsStatus('success');
      return loc;
    } catch (err: any) {
      console.warn('Geolocation 수집 실패:', err?.message || err);
      if (err?.message === 'PERMISSION_DENIED') {
        setGpsStatus('denied');
      } else {
        setGpsStatus('denied');
      }
      return null;
    }
  };

  // 현재 GPS 위치로 배달 주소 자동 채우기
  const handleAutoFillAddressWithGps = async () => {
    let currentAddress = gpsAddress;
    let lat = gpsLat;
    let lng = gpsLng;

    if (!gpsLat || !gpsAddress || gpsStatus !== 'success') {
      const loc = await requestGpsLocation();
      if (!loc) {
        alert('위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.');
        return;
      }
      currentAddress = loc.roadAddress || loc.address || '';
      lat = loc.latitude;
      lng = loc.longitude;
    }

    if (currentAddress) {
      setDeliveryAddress(currentAddress);
    }
  };

  // 모달 오픈 시 자동 1회 GPS Geolocation 수집
  useEffect(() => {
    if (isOpen) {
      requestGpsLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStore = activeStores.find((s) => s.id === selectedStoreId) || activeStores[0];

  // 금액 계산
  const itemsTotal = cart.reduce((sum, item) => sum + item.menu.price * item.quantity, 0);
  const isPickup = orderType === 'pickup';

  // 픽업 시 배달비 0원
  let deliveryFee = 0;
  if (!isPickup) {
    const baseFee = deliveryPolicy?.base_fee ?? 3000;
    const freeThreshold = deliveryPolicy?.free_threshold ?? 35000;
    const isFreeDelivery = itemsTotal >= freeThreshold && itemsTotal > 0;
    const distanceRule = deliveryPolicy?.distance_rules.find((r) => r.label === selectedDistanceLabel);
    const extraFee = distanceRule ? distanceRule.extra_fee : 0;
    deliveryFee = isFreeDelivery ? 0 : baseFee + extraFee;
  }
  const finalTotal = itemsTotal + deliveryFee;

  // 시간 옵션 포맷 (모바일에서 줄바꿈 없이 깔끔하게 보이도록 12h/24h 최적화)
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h24 = i.toString().padStart(2, '0');
    let period = '오전';
    let h12 = i;
    if (i === 0) {
      period = '자정';
      h12 = 12;
    } else if (i === 12) {
      period = '오후';
      h12 = 12;
    } else if (i > 12) {
      period = '오후';
      h12 = i - 12;
    }
    const label = `${h24}시 (${period} ${h12}시)`;
    return { value: h24, label };
  });

  // 휴대폰 번호 규격 및 자동 하이픈 포맷 (숫자만, 13자 제한)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    }
    setCustomerPhone(formatted);
  };

  // 다음 도로명 주소 선택 핸들러
  const handleCompletePostcode = (data: { roadAddress: string; jibunAddress: string; zonecode: string }) => {
    const fullAddress = data.roadAddress || data.jibunAddress;
    setDeliveryAddress(fullAddress);
    setIsPostcodeOpen(false);
  };

  // 견적 요청 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('요청자 성함을 입력해주세요.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 11) {
      setErrorMsg('정확한 휴대전화번호를 입력해주세요 (예: 010-1234-5678).');
      return;
    }
    if (!deliveryDate) {
      setErrorMsg(isPickup ? '픽업 희망 날짜를 선택해주세요.' : '배달 희망 날짜를 선택해주세요.');
      return;
    }
    if (!isPickup && !deliveryAddress.trim()) {
      setErrorMsg('배달 장소(기본 도로명 주소)를 입력해주세요.');
      return;
    }
    if (!privacyAgreed) {
      setErrorMsg('개인정보 수집 및 이용에 동의하셔야 견적 요청이 가능합니다.');
      return;
    }

    const deliveryTime = `${deliveryHour}:${deliveryMinute}`;

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          order_type: orderType,
          pickup_store_id: isPickup ? currentStore?.id : undefined,
          pickup_store_name: isPickup ? currentStore?.name : undefined,
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: isPickup ? (currentStore?.address || '매장 픽업') : deliveryAddress,
          delivery_address_detail: isPickup ? (currentStore?.name || '') : deliveryAddressDetail,
          selected_distance_label: isPickup ? '매장 픽업 (0원)' : selectedDistanceLabel,
          order_memo: orderMemo,
          privacy_agreed: privacyAgreed,
          gps_lat: gpsLat,
          gps_lng: gpsLng,
          gps_address: gpsAddress,
          items: cart.map((i) => ({
            menu_id: i.menu.id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '견적 요청 처리에 실패했습니다.');
      }

      onOrderSuccess(data.order);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [year, month, day] = deliveryDate.split('-');
  const formattedPreview = `${year || '2026'}년 ${month || '10'}월 ${day || '10'}일 ${deliveryHour}시 ${deliveryMinute}분`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[94vh] sm:max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">
              은달 카페 {isPickup ? '매장 픽업' : '배달'} 견적 요청서
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 truncate">
              {isPickup ? '픽업 매장과 일시를 선택해 간편하게 요청하세요.' : '배달 희망 일시와 배송지를 입력하여 견적을 요청합니다.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors shrink-0"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* GPS 기반 위치정보 수집 상태 배너 */}
          <div className="p-2.5 sm:p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] bg-stone-50 border-stone-200">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Navigation className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-stone-800">
                  {gpsStatus === 'locating' && '📍 GPS 위치 확인 중...'}
                  {gpsStatus === 'success' && '📍 GPS 위치 인증 완료'}
                  {gpsStatus === 'denied' && '⚠️ 위치 권한이 꺼져 있거나 차단되었습니다'}
                  {gpsStatus === 'unsupported' && '⚠️ 기기에서 위치 서비스를 지원하지 않습니다'}
                  {gpsStatus === 'idle' && '📍 GPS 위치 확인 대기'}
                </span>
                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                  {gpsStatus === 'success' && (gpsAddress || `위도 ${gpsLat?.toFixed(4)}, 경도 ${gpsLng?.toFixed(4)}`)}
                  {gpsStatus === 'success' && gpsAccuracy && ` · 오차 ±${gpsAccuracy}m`}
                  {gpsStatus === 'denied' && '스마트폰/PC 브라우저 위치 권한을 허용하시면 자동 주소 입력 및 관제가 가능합니다.'}
                  {gpsStatus === 'locating' && '기기 GPS 센서 및 기지국 신호를 수신하는 중입니다.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              {onOpenGpsGuide && (
                <button
                  type="button"
                  onClick={onOpenGpsGuide}
                  className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3 h-3 text-amber-700" />
                  <span>설정 안내</span>
                </button>
              )}
              <button
                type="button"
                onClick={requestGpsLocation}
                disabled={gpsStatus === 'locating'}
                className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-[10px] font-bold flex items-center gap-1 border border-stone-300 transition-colors shadow-2xs active:scale-95"
                title="GPS 위치 다시 측정"
              >
                <RotateCw className={`w-3 h-3 ${gpsStatus === 'locating' ? 'animate-spin text-amber-600' : ''}`} />
                <span>재측정</span>
              </button>
              {gpsStatus === 'success' && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  인증됨
                </span>
              )}
            </div>
          </div>

          {/* 1. 수령 방법 선택 (배달 vs 픽업) */}
          <div className="space-y-1.5">
            <label className="block text-stone-700 font-bold text-xs">수령 방식 선택</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center flex items-center justify-center gap-1.5 sm:gap-2 font-bold transition-all text-xs ${
                  orderType === 'delivery'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>🛵 배달 주문</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center flex items-center justify-center gap-1.5 sm:gap-2 font-bold transition-all text-xs ${
                  orderType === 'pickup'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <StoreIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>🏬 픽업 <span className="text-[10px] bg-white/20 px-1 py-0.5 rounded-full ml-0.5">0원</span></span>
              </button>
            </div>
          </div>

          {/* 2. 견적 요청자 정보 */}
          <div className="p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5 sm:space-y-3">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              견적 요청자 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">성함 (필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-500" />
                  연락처 (필수, 숫자만 입력)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  maxLength={13}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. 일시 선택 */}
          <div className="p-3.5 sm:p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                {isPickup ? '픽업 희망 일시' : '배달 희망 일시'} (30분 단위)
              </h3>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                필수 기입
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <label className="block text-stone-600 mb-1 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-500" />
                  희망 날짜
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">시간 선택</label>
                <select
                  value={deliveryHour}
                  onChange={(e) => setDeliveryHour(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-stone-900"
                >
                  {hours.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">분 (30분 단위)</label>
                <select
                  value={deliveryMinute}
                  onChange={(e) => setDeliveryMinute(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-amber-900"
                >
                  <option value="00">00분</option>
                  <option value="30">30분</option>
                </select>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">지정 일시:</span>
              <span className="font-bold text-amber-900">{formattedPreview}</span>
            </div>
          </div>

          {/* 4. 장소 선택: 픽업 매장 선택 vs 배달 주소 입력 */}
          {isPickup ? (
            /* 🏬 매장 픽업 상세 선택 (내 위치와 매장 간 실시간 거리 연동) */
            <div className="p-3.5 sm:p-4 bg-amber-50/40 rounded-2xl border border-amber-300/80 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <StoreIcon className="w-3.5 h-3.5 text-amber-700" />
                  픽업 매장 선택 (은달 1호점 / 2호점)
                </h3>
                <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full">
                  배달비 0원 적용
                </span>
              </div>

              {/* 매장 라디오 선택 */}
              <div className="grid grid-cols-1 gap-2">
                {activeStores.map((store) => {
                  const isSelected = selectedStoreId === store.id;
                  const storeCoord = STORE_COORDINATES[store.id];
                  const distMeters =
                    storeCoord && gpsLat && gpsLng
                      ? calculateDistanceInMeters(gpsLat, gpsLng, storeCoord.lat, storeCoord.lng)
                      : null;

                  return (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-amber-600 ring-2 ring-amber-500/20 shadow-sm'
                          : 'bg-white/80 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="pickup_store"
                            checked={isSelected}
                            onChange={() => setSelectedStoreId(store.id)}
                            className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                          />
                          <span className="font-bold text-stone-900 text-xs">{store.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {distMeters !== null && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md font-bold">
                              내 위치에서 약 {formatDistance(distMeters)}
                            </span>
                          )}
                          {store.phone && (
                            <span className="text-[10px] text-stone-500">{store.phone}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-stone-600 space-y-0.5 pl-6">
                        <p className="flex items-center gap-1 font-medium">
                          <span className="text-amber-700 font-bold">[{store.postal_code || '16298'}]</span>
                          <span>{store.address} {store.address_detail}</span>
                        </p>
                        {store.operating_hours && (
                          <p className="text-stone-400">운영시간: {store.operating_hours}</p>
                        )}
                        {store.description && (
                          <p className="text-stone-500 italic mt-0.5">{store.description}</p>
                        )}
                      </div>

                      {/* 지도 바로가기 버튼 */}
                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-end gap-1.5 pl-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapPopupStore(store);
                          }}
                          className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-amber-700" />
                          찾아올 곳 지도 보기
                        </button>
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(store.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 border border-emerald-200"
                        >
                          네이버 지도 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={`https://map.kakao.com/link/search/${encodeURIComponent(store.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded bg-yellow-50 hover:bg-yellow-100 text-yellow-900 text-[10px] font-bold flex items-center gap-0.5 border border-yellow-300"
                        >
                          카카오맵 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">픽업 요청사항</label>
                <input
                  type="text"
                  placeholder="예: 도착 10분 전에 연락 부탁드립니다"
                  value={orderMemo}
                  onChange={(e) => setOrderMemo(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* 🛵 배달 장소 입력 (도로명 주소 검색 + GPS 원클릭 자동 입력 지원) */
            <div className="p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  배달 장소 입력
                </h3>
                {/* 📍 현재 GPS 위치로 배달지 자동 입력 버튼 */}
                <button
                  type="button"
                  onClick={handleAutoFillAddressWithGps}
                  className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] sm:text-[11px] flex items-center gap-1 border border-amber-300/80 transition-colors active:scale-95 shadow-2xs"
                  title="현재 기기 GPS 위치의 주소를 배달지로 즉시 자동 입력합니다"
                >
                  <LocateFixed className="w-3 h-3 text-amber-700" />
                  <span>내 GPS 위치로 자동 입력</span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">
                    도로명 주소 (필수)
                  </label>
                  <div className="flex gap-1.5 sm:gap-2">
                    <input
                      type="text"
                      required
                      placeholder="주소 검색 또는 내 GPS 위치로 자동 입력"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      onClick={() => !deliveryAddress && setIsPostcodeOpen(true)}
                      className="flex-1 min-w-0 p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPostcodeOpen(true)}
                      className="px-3 sm:px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 transition-colors text-xs active:scale-95"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>주소 검색</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">상세 주소 (동/호수, 층 등)</label>
                  <input
                    type="text"
                    placeholder="예: 은달빌딩 302호"
                    value={deliveryAddressDetail}
                    onChange={(e) => setDeliveryAddressDetail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">배달 요청사항</label>
                  <input
                    type="text"
                    placeholder="예: 문 앞에 놓아주시고 문자 남겨주세요"
                    value={orderMemo}
                    onChange={(e) => setOrderMemo(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. 개인정보보호법상 동의 체크 (필수) */}
          <div className="p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div
                onClick={() => setPrivacyAgreed(!privacyAgreed)}
                className="flex items-start gap-2.5 cursor-pointer select-none"
              >
                <div className="mt-0.5 text-amber-700 shrink-0">
                  {privacyAgreed ? (
                    <CheckSquare className="w-5 h-5 fill-amber-700 text-white" />
                  ) : (
                    <Square className="w-5 h-5 text-stone-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-xs">
                    [필수] 개인정보 수집 및 이용 동의
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    견적 확인 및 {isPickup ? '픽업' : '배달'} 처리 목적 (보유 기간: <strong className="text-amber-900 font-bold">배달 완료일 이후 14일까지 보관 후 삭제</strong>)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenPrivacyModal}
                className="text-[11px] text-amber-800 underline hover:text-amber-900 shrink-0 flex items-center gap-0.5 mt-0.5 font-medium"
              >
                <FileText className="w-3 h-3" />
                전문 보기
              </button>
            </div>
          </div>

          {/* 6. 최종 견적 금액 요약 */}
          <div className="p-3.5 sm:p-4 bg-stone-100 rounded-2xl border border-stone-200 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>견적 품목 ({cart.reduce((s, i) => s + i.quantity, 0)}개)</span>
              <span className="font-semibold">{itemsTotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>{isPickup ? '매장 픽업 할인' : `예상 배달비 (${selectedDistanceLabel})`}</span>
              <span className="font-semibold text-emerald-800">
                {isPickup ? '0원 (픽업 무료)' : deliveryFee === 0 ? '무료 (0원)' : `${deliveryFee.toLocaleString()}원`}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline text-stone-900">
              <span className="font-bold text-sm">최종 예상 견적 금액</span>
              <span className="text-lg font-black text-amber-900">
                {finalTotal.toLocaleString()}
                <span className="text-xs font-normal text-stone-600 ml-0.5">원</span>
              </span>
            </div>
          </div>

          {/* 견적 요청 제출 버튼 */}
          <div className="pt-2 pb-1">
            <button
              type="submit"
              disabled={loading || !privacyAgreed}
              className={`w-full py-3 sm:py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                loading || !privacyAgreed
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-amber-600 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>견적 요청 접수 중...</span>
                </>
              ) : (
                <span>{finalTotal.toLocaleString()}원 견적 요청하기</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 다음 도로명 주소 검색 모달 (최상단 z-[100] 배치) */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-300">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">도로명 주소 검색</span>
              <button
                type="button"
                onClick={() => setIsPostcodeOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-stone-50">
              <DaumPostcode onComplete={handleCompletePostcode} autoClose={false} />
            </div>
          </div>
        </div>
      )}

      {/* 찾아올 곳 지도 팝업 모달 (최상단 z-[100] 배치) */}
      {mapPopupStore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-300">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">{mapPopupStore.name} 찾아오시는 길</span>
              </div>
              <button
                type="button"
                onClick={() => setMapPopupStore(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="text-[11px] font-bold text-amber-800">
                  우편번호 [{mapPopupStore.postal_code || '16298'}]
                </div>
                <div className="font-bold text-stone-900 text-sm">
                  {mapPopupStore.address}
                </div>
                {mapPopupStore.address_detail && (
                  <div className="text-stone-600">{mapPopupStore.address_detail}</div>
                )}
                {mapPopupStore.phone && (
                  <div className="text-stone-500 pt-1 border-t border-stone-200 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 매장 전화: {mapPopupStore.phone}
                  </div>
                )}
              </div>

              {/* 외부 지도 앱 연동 */}
              <div className="space-y-2">
                <p className="font-bold text-stone-700">지도 앱 바로가기 (길찾기 / 상세위치):</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(mapPopupStore.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    <span>네이버 지도</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(mapPopupStore.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    <span>카카오맵</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapPopupStore.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-stone-200 active:scale-95"
                >
                  <span>구글 지도(Google Maps) 열기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setMapPopupStore(null)}
                className="w-full py-2.5 bg-stone-900 text-white font-bold rounded-xl active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
