'use client';

import React from 'react';
import { CheckCircle2, Copy, MapPin, Calendar, Clock, ShoppingBag } from 'lucide-react';
import { Order } from '@/lib/types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderSuccessModal({ order, onClose }: OrderSuccessModalProps) {
  if (!order) return null;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    alert('주문번호가 복사되었습니다: ' + order.order_number);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col text-xs">
        {/* 상단 축하 배너 */}
        <div className="text-center py-2 space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">주문이 정상 접수되었습니다!</h2>
          <p className="text-stone-500 text-xs">
            은달 카페에서 주문을 확인 후 정성을 다해 준비해 드립니다.
          </p>
        </div>

        {/* 주문 영수증 카드 */}
        <div className="my-4 p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3 overflow-y-auto">
          {/* 주문번호 & 복사 */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-medium">Order Number</span>
              <span className="text-sm font-black text-amber-900 tracking-wide">{order.order_number}</span>
            </div>
            <button
              onClick={copyOrderNumber}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>복사</span>
            </button>
          </div>

          {/* 배달 예약 정보 */}
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

          {/* 주문 품목 내역 */}
          {order.items && order.items.length > 0 && (
            <div className="pt-2 border-t border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                주문 품목 ({order.items.length}종)
              </div>
              <div className="space-y-1.5">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-stone-600">
                    <span>{it.menu_name} x {it.quantity}</span>
                    <span className="font-medium text-stone-900">{it.subtotal.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결제 금액 */}
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
              <span className="text-sm">총 결제 금액</span>
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
