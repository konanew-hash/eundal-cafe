'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Clock,
  CheckCircle,
  PackageCheck,
  XCircle,
  Calendar,
  MapPin,
  Moon,
  AlertCircle,
  Loader2,
  Trash2,
  Phone,
} from 'lucide-react';
import { Order } from '@/lib/types';

function CheckOrderContent() {
  const searchParams = useSearchParams();
  const initialNumber = searchParams.get('number') || '';
  const [searchInput, setSearchInput] = useState(initialNumber);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  const performSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setCancelSuccessMsg('');
    setOrder(null);
    setOrderList([]);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(queryStr.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '해당 주문/견적 또는 연락처의 접수 내역을 찾을 수 없습니다.');
      }
      setOrder(data.order);
      setOrderList(data.orders || [data.order]);
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
    performSearch(searchInput);
  };

  // 견적 취소 처리
  const handleCancelOrder = async () => {
    if (!order) return;
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      alert('이미 처리 중이거나 취소/완료된 견적은 취소할 수 없습니다.');
      return;
    }

    const confirmed = window.confirm(
      `[주문번호: ${order.order_number}]\n정말 이 견적 요청을 취소하시겠습니까?\n취소 후에는 복구할 수 없습니다.`
    );
    if (!confirmed) return;

    setCancelling(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.order_number)}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '견적 취소에 실패했습니다.');
      }
      setOrder(data.order);
      setOrderList((prev) =>
        prev.map((o) => (o.id === data.order.id ? data.order : o))
      );
      setCancelSuccessMsg('견적 요청이 성공적으로 취소되었습니다.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('견적 취소 중 오류가 발생했습니다.');
      }
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 견적대기 (검토 중)
          </span>
        );
      case 'confirmed':
      case 'accepted':
      case 'brewing':
      case 'delivering':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs border border-blue-300 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> 견적확정 (제조/배달 진행)
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5" /> 거래완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-700 font-bold text-xs border border-stone-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> 취소됨
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-bold text-xs">
            {status}
          </span>
        );
    }
  };

  const canCancel = order && (order.status === 'pending' || order.status === 'confirmed');

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
            <strong>주문번호</strong> 또는 주문 시 등록하신 <strong>연락처(전화번호)</strong>를 입력하여 현재 접수 및 배달 상태를 실시간으로 확인하실 수 있습니다.
          </p>

          {/* 검색 입력 */}
          <form onSubmit={handleSearch} className="pt-2 flex gap-2">
            <input
              type="text"
              required
              placeholder="주문번호 또는 전화번호 (예: 010-1234-5678)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
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

        {cancelSuccessMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
        )}

        {/* 동일 전화번호로 여러 건의 주문이 검색된 경우 탭 표시 */}
        {orderList.length > 1 && (
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-stone-500 block">
              동일 연락처로 접수된 견적 내역 ({orderList.length}건)
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {orderList.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOrder(o)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                    order?.id === o.id
                      ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="font-mono text-[10px] opacity-80">{o.order_number}</div>
                  <div>{o.delivery_date} ({o.total_amount.toLocaleString()}원)</div>
                </button>
              ))}
            </div>
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

            {/* 주문자 정보 */}
            <div className="py-1 flex items-center justify-between text-stone-600">
              <span>주문자: <strong>{order.customer_name} 님</strong></span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                {order.customer_phone}
              </span>
            </div>

            {/* 배달 일정 */}
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-2 text-stone-800">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>배달 희망일시: {order.delivery_date} {order.delivery_time}</span>
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

            {/* 견적 취소 액션 바 (요구사항: 확인 창에서 취소가 가능하도록 프로세스 추가) */}
            {canCancel && (
              <div className="pt-3 border-t border-stone-100">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {cancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{cancelling ? '취소 처리 중...' : '이 견적 요청 취소하기'}</span>
                </button>
                <p className="text-[11px] text-stone-400 text-center mt-1.5">
                  * 제조/배달 확정 전까지 홈페이지에서 직접 견적을 취소하실 수 있습니다.
                </p>
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="p-3 bg-stone-100 text-stone-600 rounded-2xl text-center text-xs font-medium border border-stone-200">
                취소 처리된 견적입니다.
              </div>
            )}
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
