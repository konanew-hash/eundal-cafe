'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Clock,
  CheckCircle,
  Bike,
  PackageCheck,
  XCircle,
  Calendar,
  MapPin,
  Moon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Order } from '@/lib/types';

function CheckOrderContent() {
  const searchParams = useSearchParams();
  const initialNumber = searchParams.get('number') || '';
  const [orderNumberInput, setOrderNumberInput] = useState(initialNumber);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const performSearch = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${num.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '해당 주문/견적 번호를 찾을 수 없습니다.');
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

  useEffect(() => {
    if (initialNumber) {
      performSearch(initialNumber);
    }
  }, [initialNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(orderNumberInput);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 견적대기 (검토 중)</span>;
      case 'confirmed':
      case 'accepted':
      case 'brewing':
      case 'delivering':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs border border-blue-300 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 견적확정 (제조/배달 진행)</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center gap-1"><PackageCheck className="w-3.5 h-3.5" /> 거래완료</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-700 font-bold text-xs border border-stone-300 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> 취소됨</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-bold text-xs">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] px-4 py-8 text-stone-900">
      <div className="max-w-md mx-auto space-y-5">
        {/* 상단 홈으로 돌아가기 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>은달 카페 홈으로 돌아가기</span>
        </Link>

        {/* 타이틀 카드 */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-200 flex items-center justify-center">
              <Moon className="w-4 h-4 fill-amber-300 stroke-amber-200" />
            </div>
            <h1 className="text-lg font-bold">견적 및 주문 실시간 확인</h1>
          </div>
          <p className="text-xs text-stone-500">
            복사해두신 주문번호(예: EUN-20261010-XXXX)를 입력하여 현재 접수 및 배달 상태를 실시간으로 확인하실 수 있습니다.
          </p>

          {/* 검색 입력 */}
          <form onSubmit={handleSearch} className="pt-2 flex gap-2">
            <input
              type="text"
              required
              placeholder="주문번호 입력 (예: EUN-20261010-1234)"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              className="flex-1 p-3 bg-stone-50 border border-stone-300 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl flex items-center gap-1.5 text-xs transition-colors shrink-0 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>조회하기</span>
            </button>
          </form>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 주문 상세 카드 */}
        {order && (
          <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm space-y-4 text-xs animate-fade-in">
            {/* 상태 뱃지 & 주문번호 */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] text-stone-400 block font-mono">주문번호</span>
                <span className="font-black text-amber-950 font-mono text-sm">{order.order_number}</span>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* 배달 일정 */}
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-2 text-stone-800">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>배달 희망일시: {order.delivery_date} {order.delivery_time} (24시간제)</span>
              </div>
              <div className="flex items-start gap-2 text-stone-600">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>배달 장소: {order.delivery_address} {order.delivery_address_detail || ''}</span>
              </div>
            </div>

            {/* 품목 내역 */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-stone-900 block">요청 품목 ({order.items.length}개)</span>
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-1.5">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span>{it.menu_name} x {it.quantity}</span>
                      <span className="font-semibold text-stone-900">{it.subtotal.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 금액 요약 */}
            <div className="pt-2 border-t border-stone-100 space-y-1.5 text-stone-600">
              <div className="flex justify-between">
                <span>상품 합계</span>
                <span>{order.items_total.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>배달비 ({order.selected_distance_label})</span>
                <span>{order.delivery_fee.toLocaleString()}원</span>
              </div>
              <div className="pt-1.5 flex justify-between items-baseline font-bold text-stone-900 border-t border-stone-100">
                <span className="text-sm">총 견적 금액</span>
                <span className="text-base text-amber-900 font-black">{order.total_amount.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-8 text-stone-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-amber-700" />
          <span>페이지를 불러오는 중입니다...</span>
        </div>
      }
    >
      <CheckOrderContent />
    </Suspense>
  );
}
