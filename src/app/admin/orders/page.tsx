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
  Camera,
  Edit,
  Plus,
  Minus,
  Trash2,
  X,
  Save,
  Check,
  Download,
  Globe,
  Map,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Order, MenuItem, OrderItem } from '@/lib/types';
import { exportOrdersToExcel } from '@/lib/excel';
import { translateLocationToKorean } from '@/lib/location';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableMenus, setAvailableMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrderCountRef = useRef(0);

  // 지도 모달 상태 (요구사항: 우편번호/주소 클릭 시 구글지도/네이버지도 팝업 표시)
  const [mapModalData, setMapModalData] = useState<{ address: string; label: string } | null>(null);

  // 주문 수정 모달 상태
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editDeliveryFee, setEditDeliveryFee] = useState<number>(0);
  const [editOrderMemo, setEditOrderMemo] = useState<string>('');
  const [selectedAddMenuId, setSelectedAddMenuId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // 캡처 중 상태 (어떤 주문 ID가 캡처 중인지)
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 주문 목록 로드
  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      const data = await res.json();
      if (data.orders) {
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

  // 메뉴 목록 로드 (주문 수정 시 추가용)
  useEffect(() => {
    async function loadMenus() {
      try {
        const res = await fetch('/api/public/data');
        const data = await res.json();
        if (data.menus) setAvailableMenus(data.menus);
      } catch (err) {
        console.error(err);
      }
    }
    loadMenus();
  }, []);

  // 주기적 자동 폴링 (8초마다 갱신)
  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // 주문 알림음
  const playOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
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
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as Order['status'] } : o))
        );
      } else {
        alert(data.error || '주문 상태 변경에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  // 요구사항: 주문 내역에서 이미지를 캡처하여 고객 확인 문자에 첨부 가능하도록 조치
  const handleCaptureOrderImage = async (order: Order) => {
    const cardEl = cardRefs.current[order.id];
    if (!cardEl) return;

    try {
      setCapturingId(order.id);
      // html-to-image로 캡처
      const dataUrl = await toPng(cardEl, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });

      // 이미지 파일 다운로드 트리거
      const link = document.createElement('a');
      link.download = `은달카페_주문확인_${order.order_number}.png`;
      link.href = dataUrl;
      link.click();

      // 클립보드 복사 시도
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert(`주문확인 이미지가 다운로드되고 클립보드에 복사되었습니다!\n(문자/카카오톡 발송 시 붙여넣기(Ctrl+V)하여 첨부할 수 있습니다.)`);
      } catch {
        alert(`주문확인 이미지가 다운로드되었습니다: 은달카페_주문확인_${order.order_number}.png`);
      }
    } catch (err) {
      console.error('Capture error:', err);
      alert('이미지 캡처 중 오류가 발생했습니다.');
    } finally {
      setCapturingId(null);
    }
  };

  // 요구사항: 관리자가 주문 내역 메뉴 일부 수정 가능
  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
    setEditDeliveryFee(order.delivery_fee);
    setEditOrderMemo(order.order_memo || '');
    setSelectedAddMenuId(availableMenus[0]?.id || '');
  };

  const handleEditItemQty = (index: number, delta: number) => {
    setEditItems((prev) => {
      const next = [...prev];
      const nextQty = next[index].quantity + delta;
      if (nextQty > 0) {
        next[index].quantity = nextQty;
        next[index].subtotal = next[index].price * nextQty;
      }
      return next;
    });
  };

  const handleRemoveEditItem = (index: number) => {
    if (editItems.length <= 1) {
      alert('주문에 최소 1개 이상의 품목이 있어야 합니다.');
      return;
    }
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMenuToOrder = () => {
    const targetMenu = availableMenus.find((m) => m.id === selectedAddMenuId);
    if (!targetMenu) return;

    // 이미 있는 품목이면 수량만 증가
    const existingIdx = editItems.findIndex((it) => it.menu_id === targetMenu.id);
    if (existingIdx > -1) {
      handleEditItemQty(existingIdx, 1);
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          order_id: editingOrder?.id,
          menu_id: targetMenu.id,
          menu_name: targetMenu.name,
          price: targetMenu.price,
          quantity: 1,
          subtotal: targetMenu.price,
        },
      ]);
    }
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: editItems,
          delivery_fee: editDeliveryFee,
          order_memo: editOrderMemo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '수정 실패');

      // 주문 목록 업데이트
      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? data.order : o))
      );
      setEditingOrder(null);
      alert('주문 내역이 성공적으로 수정되었습니다.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('주문 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setSavingEdit(false);
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
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300 flex items-center gap-1"><Clock className="w-3 h-3" /> 견적대기</span>;
      case 'confirmed':
      case 'accepted':
      case 'brewing':
      case 'delivering':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-[11px] border border-blue-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 견적확정</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300 flex items-center gap-1"><PackageCheck className="w-3 h-3" /> 거래완료</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-bold text-[11px] border border-stone-300 flex items-center gap-1"><XCircle className="w-3 h-3" /> 취소</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-bold text-[11px]">{status}</span>;
    }
  };

  // 모달 안에서 계산되는 합계
  const editItemsTotal = editItems.reduce((s, it) => s + (it.price * it.quantity), 0);
  const editFinalTotal = editItemsTotal + (editDeliveryFee || 0);

  return (
    <div className="space-y-5">
      {/* 타이틀 및 상단 툴바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <span>주문 & 견적 실시간 대시보드</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
              총 {orders.length}건
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            접수된 견적 및 주문 확인, 메뉴 일부 수정, 문자 첨부용 영수증 이미지 캡처를 지원합니다.
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

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="현재 주문 내역을 엑셀(.xlsx) 파일로 내보냅니다."
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* 대시보드 파트별 요약 지표 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-bold text-stone-500">총 접수 건수</p>
          <p className="text-xl font-black text-stone-900 mt-0.5">{orders.length}건</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-800">견적 대기 (처리 필요)</p>
          <p className="text-xl font-black text-amber-900 mt-0.5">
            {orders.filter((o) => o.status === 'pending').length}건
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-bold text-stone-500">수령 방식 (픽업 / 배달)</p>
          <p className="text-sm font-black text-stone-900 mt-1">
            🏬 픽업 {orders.filter((o) => o.order_type === 'pickup').length}건 / 🛵 배달 {orders.filter((o) => o.order_type !== 'pickup').length}건
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <p className="text-[11px] font-bold text-stone-500">총 예상 견적 금액</p>
          <p className="text-base font-black text-amber-950 mt-1">
            {orders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200">
        {/* 상태 필터 탭 (견적대기 - 견적확정 - 거래완료 - 취소 4단계) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {[
            { key: 'all', label: '전체' },
            { key: 'pending', label: '견적대기' },
            { key: 'confirmed', label: '견적확정' },
            { key: 'completed', label: '거래완료' },
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
              {/* 이미지 캡처 대상 영역 Ref 지정: 총 결제금액까지만 포함 (접속위치/개인정보/관리자도구 제외) */}
              <div
                ref={(el) => { cardRefs.current[order.id] = el; }}
                className="bg-white rounded-xl p-3 border border-stone-100 shadow-2xs space-y-2"
              >
                {/* 상단 주문번호 & 상태 & 수령방식 */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-950 font-mono tracking-tight">
                        {order.order_number}
                      </span>
                      {order.order_type === 'pickup' ? (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md border border-amber-300">
                          🏬 픽업: {order.pickup_store_name || '매장'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-md border border-blue-200">
                          🛵 배달
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 block uppercase font-mono mt-0.5">
                      {new Date(order.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 접수
                    </span>
                  </div>
                  <div>{statusBadge(order.status)}</div>
                </div>

                {/* 고객 정보 & 배달일시 */}
                <div className="py-2 space-y-1.5 text-xs text-stone-700 border-b border-stone-100">
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

                  {/* 배달 희망 일시 */}
                  <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{order.delivery_date} {order.delivery_time}</span>
                    </div>
                    <div className="flex items-start justify-between gap-1.5 text-stone-600">
                      <div className="flex items-start gap-1.5 flex-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {order.delivery_address} {order.delivery_address_detail || ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setMapModalData({
                            address: order.delivery_address,
                            label: `${order.customer_name} 님 배달 목적지`,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded-lg border border-blue-200 transition-colors shrink-0"
                        title="구글/네이버 지도로 위치 확인"
                      >
                        <Map className="w-3 h-3" />
                        <span>지도</span>
                      </button>
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

                {/* 품목 상세 및 총 결제금액 (캡처 하단 마감선) */}
                <div className="pt-1 pb-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-stone-500">주문 메뉴 내역</span>
                    <span className="text-[10px] text-stone-400">총 {order.items?.length || 0}종</span>
                  </div>
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
                  <div className="pt-1.5 mt-1 border-t border-dashed border-stone-200 flex justify-between font-bold text-stone-900">
                    <span className="text-xs">총 결제금액</span>
                    <span className="text-sm font-black text-amber-900">{order.total_amount.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 캡처 제외 영역: 고객 접속 위치 및 개인정보 수집 동의 */}
              <div className="pt-2 space-y-1.5">
                {/* 주문자 접속 위치 및 IP (우편번호 클릭 시 지도 연동) */}
                {/* 주문자 접속/작성 위치 (GPS 우선 표기 및 지도 연동) */}
                <div className="py-2 px-2.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-[11px] text-stone-600">
                  <span className="flex items-center gap-1 font-medium shrink-0">
                    <Navigation className="w-3.5 h-3.5 text-amber-600" />
                    <span>작성자 위치</span>
                  </span>
                  <div className="flex items-center gap-1.5 text-right min-w-0">
                    <span className="font-bold text-stone-800 truncate">
                      {order.gps_lat && order.gps_lng
                        ? `GPS (${order.gps_lat.toFixed(4)}, ${order.gps_lng.toFixed(4)})`
                        : translateLocationToKorean(order.client_location || '확인 대기')}
                      {order.client_location && order.gps_lat ? ` · ${translateLocationToKorean(order.client_location)}` : ''}
                    </span>
                    {(order.gps_lat || order.client_location) && (
                      <button
                        type="button"
                        onClick={() =>
                          setMapModalData({
                            address:
                              order.gps_lat && order.gps_lng
                                ? `${order.gps_lat},${order.gps_lng}`
                                : translateLocationToKorean(order.client_location || ''),
                            label: order.gps_lat ? '주문 작성자 GPS 좌표 위치' : '고객 접속 위치 (우편구역)',
                          })
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded-lg border border-amber-300 transition-colors shrink-0"
                        title="GPS/우편번호 위치 지도 확인"
                      >
                        <Map className="w-2.5 h-2.5 text-amber-700" />
                        <span>지도</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 개인정보보호 동의 확인 표기 */}
                <div className="px-1 flex items-center justify-between text-[10px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    개인정보 수집 동의 완료 (완료 후 14일 보관)
                  </span>
                  <span>{new Date(order.privacy_agreed_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>

              {/* 하단 관리자 도구 바 (품목 수정 & 이미지 캡처 & 상태 변경) */}
              <div className="pt-3 border-t border-stone-100 space-y-2">
                {/* 상단 버튼: 품목 수정 및 이미지 캡처 */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(order)}
                    className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-stone-200"
                    title="주문 품목 및 수량 수정"
                  >
                    <Edit className="w-3.5 h-3.5 text-stone-600" />
                    <span>품목/수량 수정</span>
                  </button>

                  <button
                    onClick={() => handleCaptureOrderImage(order)}
                    disabled={capturingId === order.id}
                    className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-amber-300 shadow-2xs"
                    title="주문 내역 이미지를 캡처하여 다운로드 및 클립보드에 복사합니다"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                    <span>{capturingId === order.id ? '캡처 중...' : '문자용 이미지 캡처'}</span>
                  </button>
                </div>

                {/* 상태 변경 액션 버튼들 (4단계: 견적대기 - 견적확정 - 거래완료 - 취소) */}
                <div className="flex items-center gap-1.5">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                    >
                      견적 확정
                    </button>
                  )}
                  {(order.status === 'confirmed' || order.status === 'accepted' || order.status === 'brewing' || order.status === 'delivering') && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                    >
                      거래 완료
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <div className="flex-1 py-2 bg-stone-100 text-emerald-800 font-bold rounded-xl text-xs text-center border border-emerald-200">
                      거래 완료됨
                    </div>
                  )}
                  {order.status === 'cancelled' && (
                    <div className="flex-1 py-2 bg-stone-100 text-stone-500 font-bold rounded-xl text-xs text-center border border-stone-200">
                      취소된 견적
                    </div>
                  )}

                  {/* 상태 임의 지정 셀렉트 드롭다운 */}
                  <div className="relative">
                    <select
                      value={order.status === 'accepted' || order.status === 'brewing' || order.status === 'delivering' ? 'confirmed' : order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="appearance-none bg-stone-100 border border-stone-300 text-stone-700 text-xs py-2 pl-2.5 pr-6 rounded-xl font-medium focus:outline-none"
                    >
                      <option value="pending">견적대기</option>
                      <option value="confirmed">견적확정</option>
                      <option value="completed">거래완료</option>
                      <option value="cancelled">취소</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 주문 품목 수정 모달 (요구사항 3: 관리자 주문 내역 메뉴 일부 수정 기능) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  주문 품목 및 금액 수정 ({editingOrder.order_number})
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  고객: {editingOrder.customer_name}님 ({editingOrder.customer_phone})
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="flex-1 overflow-y-auto py-3 space-y-4">
              {/* 1. 현재 담긴 품목 리스트 및 수량 증감 */}
              <div className="space-y-2">
                <span className="font-bold text-stone-800 block">주문 품목 편집</span>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {editItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-900 truncate">{item.menu_name}</p>
                        <p className="text-stone-500 text-[11px]">단가 {item.price.toLocaleString()}원</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-white border border-stone-300 rounded-full px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleEditItemQty(idx, -1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEditItemQty(idx, 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="w-16 text-right font-bold text-stone-900">
                          {item.subtotal.toLocaleString()}원
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(idx)}
                          className="p-1 text-stone-400 hover:text-red-600"
                          title="품목 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 추가 메뉴 추가 셀렉트 */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/70 space-y-2">
                <span className="font-bold text-amber-950 block">새 메뉴 품목 추가</span>
                <div className="flex gap-2">
                  <select
                    value={selectedAddMenuId}
                    onChange={(e) => setSelectedAddMenuId(e.target.value)}
                    className="flex-1 p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900"
                  >
                    {availableMenus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.price.toLocaleString()}원)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMenuToOrder}
                    className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </div>
              </div>

              {/* 3. 배달비 및 요청사항 조절 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">배달비 (원)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={editDeliveryFee}
                    onChange={(e) => setEditDeliveryFee(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">관리자 메모/요청사항</label>
                  <input
                    type="text"
                    value={editOrderMemo}
                    onChange={(e) => setEditOrderMemo(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* 4. 최종 재계산 금액 확인 */}
              <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200 space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>상품 합계</span>
                  <span className="font-bold">{editItemsTotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>배달비</span>
                  <span className="font-bold">+{editDeliveryFee.toLocaleString()}원</span>
                </div>
                <div className="pt-1.5 border-t border-stone-300 flex justify-between items-baseline font-bold text-stone-900">
                  <span>최종 수정 결제액</span>
                  <span className="text-sm font-black text-amber-900">{editFinalTotal.toLocaleString()}원</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="pt-2 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? '저장 중...' : '수정 내역 저장'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 우편번호 및 주소 지도 확인 팝업 모달 (요구사항: 우편번호를 눌렀을 때 구글지도나 네이버지도로 해당 위치 표시) */}
      {mapModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Map className="w-4 h-4 text-amber-700" />
                  <span>위치 지도 확인</span>
                </div>
                <h3 className="font-bold text-stone-900 text-sm mt-0.5">
                  {mapModalData.label}
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5 line-clamp-1">
                  {mapModalData.address}
                </p>
              </div>
              <button
                onClick={() => setMapModalData(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 구글 지도 임베드 뷰어 */}
            <div className="w-full h-72 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative shadow-inner">
              <iframe
                title="Google Map Location Preview"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  mapModalData.address.replace(/\(우:[^)]+\)/g, '').trim()
                )}&z=15&output=embed`}
              />
            </div>

            {/* 외부 지도 바로가기 버튼 (네이버 지도, 구글 지도, 카카오 맵) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-stone-500">외부 지도 앱으로 상세 경로/거리 확인</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* 네이버 지도 버튼 */}
                <a
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(
                    mapModalData.address.replace(/\(우:[^)]+\)/g, '').trim()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-[#03C75A] hover:bg-[#02b150] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>네이버 지도</span>
                </a>

                {/* 구글 지도 버튼 */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    mapModalData.address.replace(/\(우:[^)]+\)/g, '').trim()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>구글 지도</span>
                </a>

                {/* 카카오 맵 버튼 */}
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(
                    mapModalData.address.replace(/\(우:[^)]+\)/g, '').trim()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-[#FEE500] hover:bg-[#ebd300] text-stone-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs col-span-2 sm:col-span-1"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-stone-700" />
                  <span>카카오 맵</span>
                </a>
              </div>
            </div>

            {/* 모달 하단 닫기 */}
            <div className="pt-2 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setMapModalData(null)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors"
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
