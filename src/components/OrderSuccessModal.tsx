'use client';

import React from 'react';
import { CheckCircle2, Copy, MapPin, Calendar, Clock, ShoppingBag, MessageCircle, Gift } from 'lucide-react';
import { Order } from '@/lib/types';

interface OrderSuccessModalProps {
  order: Order | null;
  quoteNotice?: string;
  onClose: () => void;
}

export default function OrderSuccessModal({ order, quoteNotice, onClose }: OrderSuccessModalProps) {
  if (!order) return null;

  const defaultNotice =
    quoteNotice ||
    '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다.';

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    alert('견적/주문번호가 복사되었습니다: ' + order.order_number);
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

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors shadow-sm"
        >
          확인 (홈으로 이동)
        </button>
      </div>
    </div>
  );
}
