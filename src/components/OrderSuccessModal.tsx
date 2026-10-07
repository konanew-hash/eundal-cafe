import React, { useState } from 'react';
import { CheckCircle2, Copy, MapPin, Calendar, Clock, ShoppingBag, MessageCircle, Gift, Send, Check } from 'lucide-react';
import { Order, CafeInfo } from '@/lib/types';

interface OrderSuccessModalProps {
  order: Order | null;
  quoteNotice?: string;
  cafe?: CafeInfo | null;
  onClose: () => void;
}

export default function OrderSuccessModal({ order, quoteNotice, cafe, onClose }: OrderSuccessModalProps) {
  const [copiedKakao, setCopiedKakao] = useState(false);

  if (!order) return null;

  const defaultNotice =
    quoteNotice ||
    '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다.';

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    alert('견적/주문번호가 복사되었습니다: ' + order.order_number);
  };

  // 요구사항: 주문이 접수되면 카톡으로 은달 총괄관리자에게 전송할 수 있도록 조치
  const generateKakaoOrderText = () => {
    const isPickup = order.order_type === 'pickup';
    const deliveryMethod = isPickup
      ? `매장 픽업 (${order.pickup_store_name || '은달 매장'})`
      : `배달 (${order.delivery_address} ${order.delivery_address_detail || ''})`;

    let itemsText = '';
    if (order.items && order.items.length > 0) {
      itemsText = order.items
        .map((it, idx) => {
          let line = `${idx + 1}. ${it.menu_name} x ${it.quantity} (${it.subtotal.toLocaleString()}원)`;
          if (it.set_details) {
            const comps = it.set_details.components?.map((c) => `${c.menu_name}x${c.quantity}`).join(', ');
            line += `\n   └ 구성: ${comps || '-'}\n   └ 포장: ${it.set_details.package_box?.name || '-'}`;
          }
          return line;
        })
        .join('\n');
    }

    return (
      `[은달카페 신규 주문 접수]\n` +
      `■ 주문번호: ${order.order_number}\n` +
      `■ 주문고객: ${order.customer_name} (${order.customer_phone})\n` +
      `■ 수령방식: ${deliveryMethod}\n` +
      `■ 희망일시: ${order.delivery_date} ${order.delivery_time}\n` +
      `■ 주문품목:\n${itemsText}\n` +
      (order.packaging_box ? `■ 선물/포장용기: ${order.packaging_box.name}\n` : '') +
      `■ 배달비: ${order.delivery_fee.toLocaleString()}원\n` +
      `■ 총 견적금액: ${order.total_amount.toLocaleString()}원\n` +
      `-------------------------\n` +
      `* 은달카페 주문조회: https://eundal.vercel.app/check-order`
    );
  };

  const handleSendKakaoToManager = async () => {
    const kakaoText = generateKakaoOrderText();

    // 1. 모바일 Web Share API 지원 시 (카카오톡 바로 선택 전송 가능)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `[은달카페 주문] ${order.customer_name}님 (${order.order_number})`,
          text: kakaoText,
        });
        return;
      } catch {
        // 취소 또는 에러 시 클립보드 복사 및 URL 실행
      }
    }

    // 2. 오픈채팅 링크가 등록되어 있는 경우
    if (cafe?.manager_kakao_id && cafe.manager_kakao_id.startsWith('http')) {
      navigator.clipboard.writeText(kakaoText);
      alert('주문 내역이 복사되었습니다! 열리는 총괄관리자 카카오톡 창에 붙여넣기(Ctrl+V) 해주세요.');
      window.open(cafe.manager_kakao_id, '_blank');
      return;
    }

    // 3. 클립보드 복사 후 카카오톡 실행
    navigator.clipboard.writeText(kakaoText);
    setCopiedKakao(true);
    setTimeout(() => setCopiedKakao(false), 3000);
    alert(
      `[주문 내역 복사 완료!]\n\n` +
      `총괄관리자에게 전송할 주문서 텍스트가 복사되었습니다.\n` +
      `카카오톡을 열어 붙여넣기(Ctrl+V)하여 전송해주세요.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col text-xs">
        {/* 상단 완료 배너 (요구사항: 견적이 정상 접수되었습니다!) */}
        <div className="text-center py-2 space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">견적이 정상 접수되었습니다!</h2>
        </div>

        {/* 요구사항: 견적 확인 안내 문구 박스 */}
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/90 text-amber-950 flex items-start gap-2.5 my-2">
          <MessageCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="font-semibold text-xs leading-relaxed">
            {defaultNotice}
          </p>
        </div>

        {/* 견적 내역 카드 */}
        <div className="my-2 p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3 overflow-y-auto">
          {/* 견적 번호 & 복사 */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-medium">견적 번호 (조회용)</span>
              <span className="text-sm font-black text-amber-900 tracking-wide">{order.order_number}</span>
            </div>
            <button
              onClick={copyOrderNumber}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors font-bold"
            >
              <Copy className="w-3 h-3" />
              <span>번호 복사</span>
            </button>
          </div>

          {/* 배달 희망 예약 정보 */}
          <div className="space-y-1.5 text-stone-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>배달일자: <strong>{order.delivery_date}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>배달시간: <strong>{order.delivery_time} (24h 기준)</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
              <span>
                배달장소: <strong>{order.delivery_address} {order.delivery_address_detail || ''}</strong>
              </span>
            </div>
          </div>

          {/* 견적 품목 내역 */}
          {order.items && order.items.length > 0 && (
            <div className="pt-2 border-t border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                견적 요청 품목 ({order.items.length}종)
              </div>
              <div className="space-y-1.5">
                {order.items.map((it, idx) => {
                  const isSet = !!it.set_details;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-stone-700">
                        <span className="font-medium">
                          {isSet && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded mr-1 border border-amber-300">
                              <Gift className="w-2.5 h-2.5 text-amber-700 inline" />
                              세트
                            </span>
                          )}
                          {it.menu_name} x {it.quantity}
                        </span>
                        <span className="font-bold text-stone-900 shrink-0 ml-2">
                          {it.subtotal.toLocaleString()}원
                        </span>
                      </div>
                      {isSet && it.set_details && (
                        <div className="ml-2 pl-2 border-l-2 border-amber-400 text-[10px] text-stone-600 space-y-0.5 bg-amber-50/70 p-1.5 rounded-r-lg">
                          <div>
                            <strong className="text-stone-800">구성:</strong>{' '}
                            {it.set_details.components?.map((c) => `${c.menu_name} x${c.quantity}`).join(', ') || '-'}
                          </div>
                          <div>
                            <strong className="text-stone-800">포장:</strong> {it.set_details.package_box?.name}
                          </div>
                          {it.set_details.packaging_options && it.set_details.packaging_options.length > 0 && (
                            <div>
                              <strong className="text-stone-800">옵션:</strong>{' '}
                              {it.set_details.packaging_options.map((opt) => opt.name).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 예상 결제 금액 */}
          <div className="pt-2.5 border-t border-stone-200 space-y-1">
            <div className="flex justify-between text-stone-600">
              <span>상품 합계</span>
              <span>{order.items_total.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>배달비 ({order.selected_distance_label})</span>
              <span>{order.delivery_fee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 font-bold text-stone-900">
              <span className="text-sm">예상 견적 총액</span>
              <span className="text-base text-amber-900 font-black">
                {order.total_amount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 요구사항: 카톡으로 은달 총괄관리자에게 전송 버튼 */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleSendKakaoToManager}
            className="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] border border-[#E6CF00]"
          >
            {copiedKakao ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-900">주문서 텍스트 복사 완료! (카톡에 붙여넣기)</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.868 1.865 5.394 4.675 6.777l-.95 3.52c-.105.39.296.72.648.537l4.31-2.247c.432.046.87.07 1.317.07 5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
                </svg>
                <span>💬 카카오톡으로 은달 총괄관리자에게 전송</span>
              </>
            )}
          </button>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors shadow-sm"
          >
            확인 (홈으로 이동)
          </button>
        </div>
      </div>
    </div>
  );
}
