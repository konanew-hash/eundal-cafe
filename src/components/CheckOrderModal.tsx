'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Clock,
  CheckCircle,
  PackageCheck,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  AlertCircle,
  Loader2,
  Trash2,
  Gift,
} from 'lucide-react';
import { Order } from '@/lib/types';

interface CheckOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckOrderModal({ isOpen, onClose }: CheckOrderModalProps) {
  // 조회 방식: 전화번호(기본) vs 주문번호
  const [searchMode, setSearchMode] = useState<'phone' | 'order_number'>('phone');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  if (!isOpen) return null;

  // 규격 외 문자 차단 핸들러
  const handleInputChange = (val: string) => {
    if (searchMode === 'phone') {
      const raw = val.replace(/[^0-9]/g, '').slice(0, 11);
      let formatted = raw;
      if (raw.length > 3 && raw.length <= 7) {
        formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
      } else if (raw.length > 7) {
        formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
      }
      setSearchInput(formatted);
    } else {
      const sanitized = val.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 30);
      setSearchInput(sanitized);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setErrorMsg(searchMode === 'phone' ? '전화번호를 입력해주세요.' : '주문번호를 입력해주세요.');
      return;
    }
    if (searchMode === 'phone' && trimmed.replace(/[^0-9]/g, '').length < 9) {
      setErrorMsg('정확한 전화번호를 입력해주세요 (예: 010-1234-5678).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setCancelSuccessMsg('');
    setOrder(null);
    setOrderList([]);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '해당 번호의 주문/견적을 찾을 수 없습니다.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col text-xs">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-bold text-stone-900 text-base">견적 및 주문 상태 조회</h3>
            <p className="text-stone-500 text-[11px] mt-0.5">
              주문번호 또는 등록하신 연락처(전화번호)로 실시간 상태를 조회하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 조회 방식 선택 라디오 버튼 (전화번호 기본값) */}
        <div className="pt-2 flex items-center gap-4 border-t border-stone-100">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-stone-800">
            <input
              type="radio"
              name="modalSearchMode"
              value="phone"
              checked={searchMode === 'phone'}
              onChange={() => {
                setSearchMode('phone');
                setSearchInput('');
                setErrorMsg('');
              }}
              className="text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <span>전화번호로 조회 (기본)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-stone-800">
            <input
              type="radio"
              name="modalSearchMode"
              value="order_number"
              checked={searchMode === 'order_number'}
              onChange={() => {
                setSearchMode('order_number');
                setSearchInput('');
                setErrorMsg('');
              }}
              className="text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <span>주문번호로 조회</span>
          </label>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="pt-1 pb-2 flex gap-2">
          <input
            type={searchMode === 'phone' ? 'tel' : 'text'}
            required
            placeholder={
              searchMode === 'phone'
                ? '휴대전화번호 입력 (예: 010-1234-5678)'
                : '주문번호 입력 (예: EUN-202610...)'
            }
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            maxLength={searchMode === 'phone' ? 13 : 30}
            className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>조회</span>
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-200 my-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {cancelSuccessMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 border border-emerald-200 my-1 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
        )}

        {/* 동일 전화번호로 여러 건의 주문이 검색된 경우 탭 표시 */}
        {orderList.length > 1 && (
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 my-1">
            <span className="text-[10px] font-bold text-stone-500 block">
              접수된 견적 내역 ({orderList.length}건)
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {orderList.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOrder(o)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all border ${
                    order?.id === o.id
                      ? 'bg-amber-900 text-white border-amber-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div>{o.order_number}</div>
                  <div className="text-[10px] opacity-80">{o.delivery_date}</div>
                </button>
              ))}
            </div>
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
              <div className="flex items-center justify-between">
                <span>주문자: <strong>{order.customer_name} 님</strong></span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Phone className="w-3 h-3 text-stone-400" />
                  {order.customer_phone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>배달 희망일: <strong>{order.delivery_date} {order.delivery_time}</strong></span>
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
                <div className="space-y-1.5">
                  {order.items.map((it, idx) => {
                    const isSet = !!it.set_details;
                    return (
                      <div key={idx} className="space-y-1 text-xs">
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

            {/* 금액 */}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-stone-900">
              <span>총 견적 금액</span>
              <span className="text-base text-amber-900 font-black">{order.total_amount.toLocaleString()}원</span>
            </div>

            {/* 견적 취소 버튼 */}
            {canCancel && (
              <div className="pt-2 border-t border-stone-200">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {cancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{cancelling ? '취소 중...' : '이 견적 요청 취소하기'}</span>
                </button>
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="p-2 bg-stone-100 text-stone-600 rounded-xl text-center text-xs font-medium border border-stone-200">
                취소 처리된 견적입니다.
              </div>
            )}
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
