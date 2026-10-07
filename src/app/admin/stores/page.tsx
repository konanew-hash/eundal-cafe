'use client';

import React, { useState, useEffect } from 'react';
import {
  Store as StoreIcon,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Search,
  X,
  Save,
  RefreshCw,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import DaumPostcode from 'react-daum-postcode';
import { Store } from '@/lib/types';

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 폼 상태
  const [form, setForm] = useState({
    name: '',
    branch_name: '',
    address: '',
    address_detail: '',
    postal_code: '',
    phone: '',
    operating_hours: '',
    description: '',
    is_active: true,
    sort_order: 1,
  });

  const loadStores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stores');
      const data = await res.json();
      if (data.stores) {
        setStores(data.stores);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const openAddModal = () => {
    setEditingStore(null);
    setForm({
      name: '',
      branch_name: '',
      address: '',
      address_detail: '',
      postal_code: '',
      phone: '',
      operating_hours: '09:00 ~ 21:00',
      description: '',
      is_active: true,
      sort_order: stores.length + 1,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      branch_name: store.branch_name || '',
      address: store.address,
      address_detail: store.address_detail || '',
      postal_code: store.postal_code || '',
      phone: store.phone || '',
      operating_hours: store.operating_hours || '',
      description: store.description || '',
      is_active: store.is_active,
      sort_order: store.sort_order,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // 다음 도로명 주소 선택 핸들러
  const handleCompletePostcode = (data: { roadAddress: string; jibunAddress: string; zonecode: string }) => {
    const fullAddress = data.roadAddress || data.jibunAddress;
    setForm((prev) => ({
      ...prev,
      address: fullAddress,
      postal_code: data.zonecode,
    }));
    setIsPostcodeOpen(false);
  };

  // 저장 (추가 / 수정)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('매장명을 입력해주세요.');
      return;
    }
    if (!form.address.trim()) {
      setErrorMsg('도로명 주소를 입력해주세요.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      if (editingStore) {
        // 수정
        const res = await fetch(`/api/admin/stores/${editingStore.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '매장 정보 수정 실패');
        }
      } else {
        // 신규 등록
        const res = await fetch('/api/admin/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '신규 매장 등록 실패');
        }
      }
      setIsModalOpen(false);
      loadStores();
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(err.message);
      else setErrorMsg('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 활성/비활성 토글
  const handleToggleActive = async (store: Store) => {
    try {
      const nextActive = !store.is_active;
      const res = await fetch(`/api/admin/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (res.ok) {
        setStores((prev) =>
          prev.map((s) => (s.id === store.id ? { ...s, is_active: nextActive } : s))
        );
      }
    } catch (err) {
      console.error(err);
      alert('상태 변경 실패');
    }
  };

  // 매장 삭제
  const handleDelete = async (store: Store) => {
    if (!confirm(`정말 '${store.name}' 매장을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/stores/${store.id}`, { method: 'DELETE' });
      if (res.ok) {
        setStores((prev) => prev.filter((s) => s.id !== store.id));
      } else {
        alert('삭제 실패');
      }
    } catch (err) {
      console.error(err);
      alert('오류 발생');
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* 상단 파트 타이틀 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
              <StoreIcon className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-stone-900">픽업 매장 관리 (은달 1호점 / 2호점 등)</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            고객 주문 시 선택 가능한 픽업 매장의 주소지, 우편번호, 영업시간 및 지도 연동을 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStores}
            className="p-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>신규 매장 등록</span>
          </button>
        </div>
      </div>

      {/* 매장 목록 그리드 */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs">매장 정보를 불러오는 중입니다...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
          <p className="text-sm font-bold text-stone-700">등록된 픽업 매장이 없습니다.</p>
          <p className="text-xs text-stone-400 mt-1">신규 매장 등록 버튼을 눌러 점포를 추가해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                store.is_active ? 'border-stone-200' : 'border-stone-200 bg-stone-50/70 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-stone-900">{store.name}</h3>
                      {store.branch_name && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {store.branch_name}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-amber-800 font-bold mt-0.5 inline-block">
                      우편번호: [{store.postal_code || '16298'}]
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleActive(store)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      store.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                  >
                    {store.is_active ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-700" />
                        <span>운영 중</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-stone-500" />
                        <span>숨김(비활성)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 text-xs text-stone-700">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{store.address}</p>
                      {store.address_detail && (
                        <p className="text-stone-500 text-[11px]">{store.address_detail}</p>
                      )}
                    </div>
                  </div>

                  {store.phone && (
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  )}

                  {store.operating_hours && (
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{store.operating_hours}</span>
                    </div>
                  )}

                  {store.description && (
                    <p className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-200">
                      {store.description}
                    </p>
                  )}
                </div>

                {/* 지도 연동 링크 버튼 */}
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-stone-400 font-medium">지도 미리보기:</span>
                  <a
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(store.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 border border-emerald-200"
                  >
                    네이버 지도 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={`https://map.kakao.com/link/search/${encodeURIComponent(store.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-900 text-[10px] font-bold flex items-center gap-0.5 border border-yellow-300"
                  >
                    카카오맵 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-0.5 border border-stone-200"
                  >
                    구글 지도 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* 하단 수정/삭제 버튼 */}
              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => openEditModal(store)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center gap-1 font-bold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>수정</span>
                </button>
                <button
                  onClick={() => handleDelete(store)}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 font-bold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 매장 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <StoreIcon className="w-4 h-4 text-amber-700" />
                {editingStore ? '픽업 매장 정보 수정' : '신규 픽업 매장 등록'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-3 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    매장명 (필수, 예: 은달 1호점 (조원))
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="은달 1호점 (조원)"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    지점명 (구분용, 예: 조원점)
                  </label>
                  <input
                    type="text"
                    value={form.branch_name}
                    onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                    placeholder="조원점"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* 도로명 주소 & 다음 API 검색 */}
              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  도로명 주소 (필수) & 우편번호
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    readOnly
                    value={form.address}
                    onClick={() => setIsPostcodeOpen(true)}
                    placeholder="우측 '주소 검색' 버튼을 클릭하세요"
                    className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-xl cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPostcodeOpen(true)}
                    className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center gap-1 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>주소 검색</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">상세 주소 (층, 호수 등)</label>
                  <input
                    type="text"
                    value={form.address_detail}
                    onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
                    placeholder="1층 은달 카페"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">우편번호</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    placeholder="16298"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">매장 전화번호</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="031-241-1234"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">운영 시간</label>
                  <input
                    type="text"
                    value={form.operating_hours}
                    onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
                    placeholder="09:00 ~ 21:00"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">매장 픽업 위치 안내 및 설명</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="예: 조원시장 맞은편 버스정류장 앞, 픽업 대기석 완비"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span className="font-bold text-stone-700">고객 주문 화면에 즉시 노출</span>
                </label>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-stone-500 font-medium">정렬 순서:</span>
                  <input
                    type="number"
                    min={1}
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-16 p-1.5 text-center bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? '저장 중...' : '매장 정보 저장'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 도로명 주소 검색 모달 */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-300">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">도로명 주소 검색</span>
              <button
                type="button"
                onClick={() => setIsPostcodeOpen(false)}
                className="text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <DaumPostcode onComplete={handleCompletePostcode} autoClose={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
