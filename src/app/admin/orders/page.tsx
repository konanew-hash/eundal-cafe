'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Bike,
  PackageCheck,
  XCircle,
  MapPin,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Order } from '@/lib/types';
import { exportOrdersToExcel } from '@/lib/excel';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrderCountRef = useRef(0);

  // 주문 목록 로드
  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      const data = await res.json();
      if (data.orders) {
        // 새 주문 발생 시 사운드 알림
        if (!isInitial && previousOrderCountRef.current > 0 && data.orders.length > previousOrderCountRef.current) {
          playOrderSound();
        }
        previousOrderCountRef.current = data.orders.length;
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Fetch orders failed:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [statusFilter]);

  // 주기적 자동 폴링 (8초마다 갱신)
  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // 주문 알림음 (Web Audio API로 감미로운 챠임 사운드 생성)
  const playOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio play prevented:', e);
    }
  };

  // 주문 상태 변경
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as Order['status'] } : o))
        );
      } else {
        alert('주문 상태 변경에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  // 엑셀 내보내기 핸들러
  const handleExportExcel = () => {
    if (orders.length === 0) {
      alert('내보낼 주문 데이터가 없습니다.');
      return;
    }
    exportOrdersToExcel(filteredOrders, '은달카페_주문목록');
  };

  // 검색 및 필터링 적용된 목록
  const filteredOrders = orders.filter((o) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(kw) ||
      o.customer_name.toLowerCase().includes(kw) ||
      o.customer_phone.includes(kw) ||
      o.delivery_address.toLowerCase().includes(kw)
    );
  });

  const statusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300 flex items-center gap-1"><Clock className="w-3 h-3" /> 접수대기</span>;
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-[11px] border border-blue-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 접수완료</span>;
      case 'brewing':
        return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-[11px] border border-purple-300 flex items-center gap-1"><Clock className="w-3 h-3" /> 제조중</span>;
      case 'delivering':
        return <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[11px] border border-indigo-300 flex items-center gap-1"><Bike className="w-3 h-3" /> 배달중</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300 flex items-center gap-1"><PackageCheck className="w-3 h-3" /> 완료</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-bold text-[11px] border border-stone-300 flex items-center gap-1"><XCircle className="w-3 h-3" /> 취소</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* 타이틀 및 상단 툴바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <span>주문 실시간 대시보드</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
              총 {orders.length}건
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            고객의 주문 및 24시간제 배달 일정을 확인하고 상태를 변경합니다.
          </p>
        </div>

        {/* 엑셀 다운로드 & 사운드 & 새로고침 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="새 주문 알림음 토글"
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              soundEnabled
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-stone-100 text-stone-400 border-stone-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? '알림음 ON' : '알림음 OFF'}</span>
          </button>

          <button
            onClick={() => fetchOrders(true)}
            title="새로고침"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 border border-stone-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>

          {/* 요구사항: 엑셀 다운로드 */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="현재 주문 내역을 엑셀(.xlsx) 파일로 내보냅니다."
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>주문 내역 엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200">
        {/* 상태 필터 탭 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {[
            { key: 'all', label: '전체' },
            { key: 'pending', label: '접수대기' },
            { key: 'accepted', label: '접수완료' },
            { key: 'brewing', label: '제조중' },
            { key: 'delivering', label: '배달중' },
            { key: 'completed', label: '완료' },
            { key: 'cancelled', label: '취소' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st.key
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* 검색 인풋 */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="주문번호, 고객명, 연락처 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 주문 목록 카드 그리드 */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-stone-500 border border-stone-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs">주문 데이터를 불러오는 중입니다...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-stone-400 border border-stone-200">
          <Filter className="w-8 h-8 mx-auto text-stone-300 mb-2" />
          <p className="text-sm font-semibold text-stone-600">조건에 일치하는 주문이 없습니다.</p>
          <p className="text-xs text-stone-400 mt-1">새로운 주문이 접수되면 실시간으로 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-2xl p-4 border transition-all shadow-sm flex flex-col justify-between ${
                order.status === 'pending'
                  ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/20'
                  : 'border-stone-200'
              }`}
            >
              <div>
                {/* 상단 주문번호 & 상태 */}
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase font-mono">
                      {new Date(order.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 접수
                    </span>
                    <span className="text-xs font-black text-amber-950 font-mono tracking-tight">
                      {order.order_number}
                    </span>
                  </div>
                  <div>{statusBadge(order.status)}</div>
                </div>

                {/* 고객 정보 & 배달일시 (24시간제) */}
                <div className="py-3 space-y-1.5 text-xs text-stone-700 border-b border-stone-100">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      {order.customer_name} 님
                    </span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="flex items-center gap-1 text-amber-800 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {order.customer_phone}
                    </a>
                  </div>

                  {/* 배달 희망 일시 (24시간제/00,30분 강조) */}
                  <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{order.delivery_date} {order.delivery_time} (24시간제)</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {order.delivery_address} {order.delivery_address_detail || ''}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 pt-0.5">
                      거리구간: <strong className="text-stone-700">{order.selected_distance_label}</strong>
                    </div>
                  </div>

                  {order.order_memo && (
                    <div className="p-2 bg-amber-50/50 rounded-xl text-[11px] text-amber-900 border border-amber-100">
                      <strong>요청사항:</strong> {order.order_memo}
                    </div>
                  )}
                </div>

                {/* 품목 상세 */}
                <div className="py-2.5 space-y-1 text-xs border-b border-stone-100">
                  <span className="text-[11px] font-bold text-stone-500 block mb-1">주문 메뉴 내역</span>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span className="line-clamp-1">{item.menu_name} x {item.quantity}</span>
                      <span className="font-semibold text-stone-900 shrink-0 ml-2">{item.subtotal.toLocaleString()}원</span>
                    </div>
                  ))}
                  <div className="pt-1.5 flex justify-between text-[11px] text-stone-500">
                    <span>배달비 ({order.selected_distance_label})</span>
                    <span>{order.delivery_fee.toLocaleString()}원</span>
                  </div>
                  <div className="pt-1 flex justify-between font-bold text-stone-900">
                    <span>총 결제금액</span>
                    <span className="text-sm font-black text-amber-900">{order.total_amount.toLocaleString()}원</span>
                  </div>
                </div>

                {/* 개인정보보호 동의 확인 표기 */}
                <div className="py-2 flex items-center justify-between text-[10px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    개인정보 수집 동의 완료
                  </span>
                  <span>{new Date(order.privacy_agreed_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>

              {/* 하단 상태 변경 액션 버튼들 */}
              <div className="pt-3 border-t border-stone-100 flex items-center gap-1.5">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'accepted')}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                  >
                    주문 접수
                  </button>
                )}
                {order.status === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'brewing')}
                    className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    제조 시작
                  </button>
                )}
                {order.status === 'brewing' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'delivering')}
                    className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    배달 출발
                  </button>
                )}
                {order.status === 'delivering' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    배달 완료 처리
                  </button>
                )}

                {/* 상태 임의 지정 셀렉트 드롭다운 */}
                <div className="relative">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="appearance-none bg-stone-100 border border-stone-300 text-stone-700 text-xs py-2 pl-2.5 pr-6 rounded-xl font-medium focus:outline-none"
                  >
                    <option value="pending">접수대기</option>
                    <option value="accepted">접수완료</option>
                    <option value="brewing">제조중</option>
                    <option value="delivering">배달중</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
