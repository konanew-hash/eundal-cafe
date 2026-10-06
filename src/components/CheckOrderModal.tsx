'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Clock,
  CheckCircle,
  Bike,
  PackageCheck,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  AlertCircle,
  Loader2,
  Copy,
} from 'lucide-react';
import { Order } from '@/lib/types';

interface CheckOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckOrderModal({ isOpen, onClose }: CheckOrderModalProps) {
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) {
      setErrorMsg('주문/견적 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${orderNumberInput.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '해당 번호의 주문/견적을 찾을 수 없습니다.');
      }
      setOrder(data.order);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('조회 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 견적 접수 대기 중
          </span>
        );
      case 'accepted':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs border border-blue-300 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> 주문 확정 완료
          </span>
        );
      case 'brewing':
        return (
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-xs border border-purple-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 음료/디저트 제조 중
          </span>
        );
      case 'delivering':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 font-bold text-xs border border-indigo-300 flex items-center gap-1">
            <Bike className="w-3.5 h-3.5" /> 안전하게 배달 중
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5" /> 배달 완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-700 font-bold text-xs border border-stone-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> 주문 취소
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col text-xs">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-bold text-stone-900 text-base">견적 및 주문 상태 조회</h3>
            <p className="text-stone-500 text-[11px] mt-0.5">
              발급받으신 견적/주문 번호로 현재 진행 상태를 확인하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="py-3 flex gap-2">
          <input
            type="text"
            required
            placeholder="예: EUN-20261010-1234"
            value={orderNumberInput}
            onChange={(e) => setOrderNumberInput(e.target.value)}
            className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>조회</span>
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-200 my-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 조회 결과 영역 */}
        {order && (
          <div className="flex-1 overflow-y-auto space-y-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 my-2 animate-fade-in">
            {/* 상태 뱃지 & 주문번호 */}
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 block font-mono">주문번호</span>
                <span className="font-black text-amber-900 font-mono text-sm">{order.order_number}</span>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* 일정 & 배달 정보 */}
            <div className="space-y-1.5 text-stone-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>배달 희망일: <strong>{order.delivery_date}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>배달 희망시간: <strong>{order.delivery_time} (24시간제)</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>
                  배달지: <strong>{order.delivery_address} {order.delivery_address_detail || ''}</strong>
                </span>
              </div>
            </div>

            {/* 품목 내역 */}
            {order.items && order.items.length > 0 && (
              <div className="pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-900 block mb-1.5">요청 품목 ({order.items.length}개)</span>
                <div className="space-y-1">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-stone-600">
                      <span>{it.menu_name} x {it.quantity}</span>
                      <span className="font-medium text-stone-900">{it.subtotal.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 금액 */}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-stone-900">
              <span>총 견적 금액 (배달비 포함)</span>
              <span className="text-base text-amber-900 font-black">{order.total_amount.toLocaleString()}원</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-stone-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
