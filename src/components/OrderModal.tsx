'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, User, Phone, CheckSquare, Square, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { CartItem, DeliveryPolicy, Order } from '@/lib/types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  deliveryPolicy: DeliveryPolicy | null;
  selectedDistanceLabel: string;
  onOrderSuccess: (order: Order) => void;
  onOpenPrivacyModal: () => void;
}

export default function OrderModal({
  isOpen,
  onClose,
  cart,
  deliveryPolicy,
  selectedDistanceLabel,
  onOrderSuccess,
  onOpenPrivacyModal,
}: OrderModalProps) {
  // 오늘 날짜 기본값 YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // 폼 상태
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(todayStr);
  const [deliveryHour, setDeliveryHour] = useState('12'); // 24시간제 시: "09" ~ "21"
  const [deliveryMinute, setDeliveryMinute] = useState('00'); // 분: 반드시 "00" 또는 "30"
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState('');
  const [orderMemo, setOrderMemo] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // 금액 계산
  const itemsTotal = cart.reduce((sum, item) => sum + item.menu.price * item.quantity, 0);
  const baseFee = deliveryPolicy?.base_fee ?? 3000;
  const freeThreshold = deliveryPolicy?.free_threshold ?? 35000;
  const isFreeDelivery = itemsTotal >= freeThreshold && itemsTotal > 0;
  const distanceRule = deliveryPolicy?.distance_rules.find((r) => r.label === selectedDistanceLabel);
  const extraFee = distanceRule ? distanceRule.extra_fee : 0;
  const deliveryFee = (isFreeDelivery ? 0 : baseFee) + extraFee;
  const finalTotal = itemsTotal + deliveryFee;

  // 24시간제 시간 옵션 (09시 ~ 21시 우선, 필요시 00시~23시 전체 제공)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // 휴대폰 번호 자동 하이픈 포맷
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setCustomerPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 유효성 검증
    if (!customerName.trim()) {
      setErrorMsg('주문자 성함을 입력해주세요.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      setErrorMsg('정확한 휴대전화번호를 입력해주세요.');
      return;
    }
    if (!deliveryDate) {
      setErrorMsg('배달 희망 날짜를 선택해주세요.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('배달 장소(기본 주소)를 입력해주세요.');
      return;
    }
    if (!privacyAgreed) {
      setErrorMsg('개인정보 수집 및 이용에 동의하셔야 주문이 가능합니다.');
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
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: deliveryAddress,
          delivery_address_detail: deliveryAddressDetail,
          selected_distance_label: selectedDistanceLabel,
          order_memo: orderMemo,
          privacy_agreed: privacyAgreed,
          items: cart.map((i) => ({
            menu_id: i.menu.id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '주문 처리에 실패했습니다.');
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

  // 날짜 한국어 포맷팅 예시
  const [year, month, day] = deliveryDate.split('-');
  const formattedPreview = `${year || '2026'}년 ${month || '10'}월 ${day || '10'}일 ${deliveryHour}시 ${deliveryMinute}분`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-base font-bold text-stone-900">은달 카페 배달 주문서</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              배달 예약 일시와 배송지를 입력해주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. 주문자 정보 */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              주문자 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                  연락처 (필수)
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

          {/* 2. 배달 희망 일시 (24시간제 & 00분/30분 필수) */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                배달 예약 일시 (24시간제 / 30분 단위)
              </h3>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                필수 기입
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 날짜 선택 */}
              <div className="sm:col-span-1">
                <label className="block text-stone-600 mb-1 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-500" />
                  배달 날짜
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

              {/* 24시간제 시 (00시 ~ 23시) */}
              <div>
                <label className="block text-stone-600 mb-1 font-medium">시간 (24시간제)</label>
                <select
                  value={deliveryHour}
                  onChange={(e) => setDeliveryHour(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-stone-900"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h}시 ({parseInt(h, 10) < 12 ? '오전' : '오후'} {h}:00)
                    </option>
                  ))}
                </select>
              </div>

              {/* 분: 반드시 00분 혹은 30분만 지원 */}
              <div>
                <label className="block text-stone-600 mb-1 font-medium">분 (00분 / 30분)</label>
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

            {/* 실시간 예약 일시 프리뷰 */}
            <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">배달 지정 일시:</span>
              <span className="font-bold text-amber-900">{formattedPreview}</span>
            </div>
          </div>

          {/* 3. 배달 장소 */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              배달 장소
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">기본 주소 (도로명 / 지번, 필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 서울특별시 마포구 월드컵북로 120"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
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
                  placeholder="예: 문 앞에 놓아주시고 벨 눌러주세요"
                  value={orderMemo}
                  onChange={(e) => setOrderMemo(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. 개인정보보호법상 동의 체크 (필수) */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5">
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
                    주문 처리, 배달지 확인 및 고객 응대를 위해 필요한 최소한의 정보를 수집합니다.
                  </p>
                </div>
              </div>

              {/* 전문 보기 링크 */}
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

          {/* 5. 최종 결제 금액 요약 */}
          <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>주문 품목 ({cart.reduce((s, i) => s + i.quantity, 0)}개)</span>
              <span className="font-semibold">{itemsTotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>배달비 ({selectedDistanceLabel})</span>
              <span className="font-semibold">
                {isFreeDelivery ? '무료 (0원)' : `${deliveryFee.toLocaleString()}원`}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline text-stone-900">
              <span className="font-bold text-sm">최종 결제 금액</span>
              <span className="text-lg font-black text-amber-900">
                {finalTotal.toLocaleString()}
                <span className="text-xs font-normal text-stone-600 ml-0.5">원</span>
              </span>
            </div>
          </div>

          {/* 주문 제출 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !privacyAgreed}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                loading || !privacyAgreed
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-amber-600 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>주문 접수 중...</span>
                </>
              ) : (
                <span>{finalTotal.toLocaleString()}원 주문 접수하기</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
