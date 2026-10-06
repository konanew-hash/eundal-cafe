'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Save, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { DeliveryPolicy, DistanceRule } from '@/lib/types';

export default function AdminDeliveryPage() {
  const [policy, setPolicy] = useState<DeliveryPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 폼 필드
  const [baseFee, setBaseFee] = useState(3000);
  const [freeThreshold, setFreeThreshold] = useState(35000);
  const [minOrderAmount, setMinOrderAmount] = useState(10000);
  const [distanceRules, setDistanceRules] = useState<DistanceRule[]>([
    { label: '1km 이내 (도보권)', extra_fee: 0 },
    { label: '1km ~ 2km (인근 지역)', extra_fee: 1000 },
    { label: '2km ~ 3km (외곽 지역)', extra_fee: 2000 },
    { label: '3km 초과 (할증 구역)', extra_fee: 3500 },
  ]);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/delivery');
      const data = await res.json();
      if (data.policy) {
        setPolicy(data.policy);
        setBaseFee(data.policy.base_fee);
        setFreeThreshold(data.policy.free_threshold);
        setMinOrderAmount(data.policy.min_order_amount);
        if (data.policy.distance_rules) {
          setDistanceRules(data.policy.distance_rules);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  // 거리 규칙 추가
  const handleAddRule = () => {
    setDistanceRules([...distanceRules, { label: '새 거리 구간', extra_fee: 1000 }]);
  };

  // 거리 규칙 수정
  const handleUpdateRule = (index: number, field: keyof DistanceRule, val: string | number) => {
    const updated = [...distanceRules];
    if (field === 'extra_fee') {
      updated[index].extra_fee = parseInt(val as string, 10) || 0;
    } else {
      updated[index].label = val as string;
    }
    setDistanceRules(updated);
  };

  // 거리 규칙 삭제
  const handleRemoveRule = (index: number) => {
    if (distanceRules.length <= 1) {
      alert('최소 1개 이상의 거리 구간이 필요합니다.');
      return;
    }
    setDistanceRules(distanceRules.filter((_, i) => i !== index));
  };

  // 저장 처리
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_fee: baseFee,
          free_threshold: freeThreshold,
          min_order_amount: minOrderAmount,
          distance_rules: distanceRules,
        }),
      });

      if (res.ok) {
        setSuccessMsg('배달비 정책이 성공적으로 저장되었습니다. 고객 홈페이지의 실시간 견적에 즉시 반영됩니다.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert('저장 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
        <p className="text-xs">배달비 정책을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-700" />
            <span>배달비 책정 & 정책 메뉴</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            거리 항목과 주문 금액 항목을 조절하여 배달비 정책을 설정하고, 고객 주문 견적과 즉시 연동합니다.
          </p>
        </div>

        <button
          onClick={loadPolicy}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs border border-stone-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 안내 카드 */}
      <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">배달비 정책 연동 규칙</p>
          <p className="text-stone-600 mt-0.5 leading-relaxed">
            고객 주문 시 <strong>[상품 총액 &gt;= 무료 배달 기준 금액]</strong>이면 기본 배달비가 0원으로 감면되며,
            고객이 선택한 거리 구간에 따른 할증 요금만 합산되어 실시간 견적에 즉시 계산됩니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 1. 금액 항목 설정 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <span>💰</span> 금액 기준 설정 (기본료 / 무료 기준 / 최소 주문)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* 기본 배달비 */}
            <div>
              <label className="block text-stone-700 font-bold mb-1.5">
                기본 배달비 (원)
              </label>
              <input
                type="number"
                required
                min={0}
                step={500}
                value={baseFee}
                onChange={(e) => setBaseFee(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-stone-400 mt-1">도보권 기본 배달 요금입니다.</p>
            </div>

            {/* 무료 배달 기준 */}
            <div>
              <label className="block text-stone-700 font-bold mb-1.5">
                무료 배달 기준 금액 (원)
              </label>
              <input
                type="number"
                required
                min={0}
                step={1000}
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-bold text-amber-800 focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-stone-400 mt-1">해당 금액 이상 주문 시 기본 배달비 면제</p>
            </div>

            {/* 최소 주문 금액 */}
            <div>
              <label className="block text-stone-700 font-bold mb-1.5">
                최소 주문 금액 (원)
              </label>
              <input
                type="number"
                required
                min={0}
                step={1000}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-stone-400 mt-1">이 금액 미만 시 주문 접수가 제한됩니다.</p>
            </div>
          </div>
        </div>

        {/* 2. 거리 항목 조절 및 메뉴화 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>📍</span> 거리 구간 및 할증 요금 메뉴화 설정
            </h3>
            <button
              type="button"
              onClick={handleAddRule}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>구간 추가</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {distanceRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80"
              >
                <div className="flex-1">
                  <label className="block text-[11px] text-stone-500 mb-1">구간 명칭 (고객 선택용)</label>
                  <input
                    type="text"
                    required
                    value={rule.label}
                    onChange={(e) => handleUpdateRule(idx, 'label', e.target.value)}
                    placeholder="예: 1km 이내 (도보권)"
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                  />
                </div>

                <div className="w-36">
                  <label className="block text-[11px] text-stone-500 mb-1">추가 할증비 (원)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={rule.extra_fee}
                    onChange={(e) => handleUpdateRule(idx, 'extra_fee', e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="mt-4 p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '저장 처리 중...' : '배달비 정책 저장 및 실시간 반영'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
