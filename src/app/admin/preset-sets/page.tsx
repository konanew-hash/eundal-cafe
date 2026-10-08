'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Gift,
  Package,
  Check,
  X,
  Upload,
  Search,
  CheckCircle,
} from 'lucide-react';
import { MenuItem, PresetSet, SetComponentItem } from '@/lib/types';

export default function AdminPresetSetsPage() {
  const [presetSets, setPresetSets] = useState<PresetSet[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 모달 제어
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<PresetSet | null>(null);

  // 폼 상태
  const [form, setForm] = useState<{
    name: string;
    description: string;
    badge_text: string;
    image_url: string;
    components: SetComponentItem[];
    package_box_id: string;
    package_box_name: string;
    package_box_price: number;
    packaging_options: { id: string; name: string; price: number }[];
    price: number;
    is_active: boolean;
    sort_order: number;
  }>({
    name: '',
    description: '',
    badge_text: '👑 인기 꿀조합',
    image_url: '',
    components: [],
    package_box_id: 'none',
    package_box_name: '기본 포장',
    package_box_price: 0,
    packaging_options: [],
    price: 0,
    is_active: true,
    sort_order: 1,
  });

  const [menuSearch, setMenuSearch] = useState('');

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      const [presetsRes, menusRes] = await Promise.all([
        fetch('/api/admin/preset-sets'),
        fetch('/api/admin/menus'),
      ]);
      const presetsData = await presetsRes.json();
      const menusData = await menusRes.json();

      if (presetsData.presetSets) setPresetSets(presetsData.presetSets);
      if (menusData.menus) setMenus(menusData.menus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 박스 목록 및 특수포장 목록 필터링
  const boxMenus = menus.filter((m) => m.packaging_type === 'box');
  const specialMenus = menus.filter((m) => m.packaging_type === 'special');
  const selectableMenus = menus.filter((m) => !m.packaging_type && m.is_available_for_set !== false);

  // 자동 단가 계산
  useEffect(() => {
    const compTotal = form.components.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const boxTotal = form.package_box_price;
    const optTotal = form.packaging_options.reduce((sum, o) => sum + o.price, 0);
    const calculated = compTotal + boxTotal + optTotal;
    setForm((prev) => ({ ...prev, price: calculated }));
  }, [form.components, form.package_box_price, form.packaging_options]);

  const openAddModal = () => {
    setEditingSet(null);
    setForm({
      name: '',
      description: '',
      badge_text: '👑 MD 추천',
      image_url: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80',
      components: [],
      package_box_id: 'none',
      package_box_name: '기본 포장 (선물박스 없음)',
      package_box_price: 0,
      packaging_options: [],
      price: 0,
      is_active: true,
      sort_order: presetSets.length + 1,
    });
    setMenuSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (preset: PresetSet) => {
    setEditingSet(preset);
    setForm({
      name: preset.name,
      description: preset.description || '',
      badge_text: preset.badge_text || '인기 꿀조합',
      image_url: preset.image_url || '',
      components: Array.isArray(preset.components) ? [...preset.components] : [],
      package_box_id: preset.package_box_id || 'none',
      package_box_name: preset.package_box_name || '기본 포장',
      package_box_price: preset.package_box_price || 0,
      packaging_options: Array.isArray(preset.packaging_options) ? [...preset.packaging_options] : [],
      price: preset.price,
      is_active: preset.is_active,
      sort_order: preset.sort_order,
    });
    setMenuSearch('');
    setIsModalOpen(true);
  };

  // 이미지 업로드
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingImage(true);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || '이미지 업로드 실패');
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  // 구성 품목 추가/수량 조절
  const handleUpdateComponentQty = (menu: MenuItem, delta: number) => {
    setForm((prev) => {
      const idx = prev.components.findIndex((c) => c.menu_id === menu.id);
      if (idx > -1) {
        const nextQty = prev.components[idx].quantity + delta;
        if (nextQty <= 0) {
          return {
            ...prev,
            components: prev.components.filter((c) => c.menu_id !== menu.id),
          };
        }
        const updated = [...prev.components];
        updated[idx] = { ...updated[idx], quantity: nextQty };
        return { ...prev, components: updated };
      }
      if (delta > 0) {
        return {
          ...prev,
          components: [
            ...prev.components,
            { menu_id: menu.id, menu_name: menu.name, price: menu.price, quantity: 1 },
          ],
        };
      }
      return prev;
    });
  };

  // 포장용기 변경
  const handleSelectBox = (boxId: string) => {
    if (boxId === 'none') {
      setForm((prev) => ({
        ...prev,
        package_box_id: 'none',
        package_box_name: '기본 포장',
        package_box_price: 0,
      }));
      return;
    }
    const box = boxMenus.find((b) => b.id === boxId);
    if (box) {
      setForm((prev) => ({
        ...prev,
        package_box_id: box.id,
        package_box_name: box.name,
        package_box_price: box.price,
      }));
    }
  };

  // 특수포장 토글
  const handleToggleOption = (opt: MenuItem) => {
    setForm((prev) => {
      const exists = prev.packaging_options.some((o) => o.id === opt.id);
      if (exists) {
        return {
          ...prev,
          packaging_options: prev.packaging_options.filter((o) => o.id !== opt.id),
        };
      }
      return {
        ...prev,
        packaging_options: [
          ...prev.packaging_options,
          { id: opt.id, name: opt.name, price: opt.price },
        ],
      };
    });
  };

  // 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('세트 이름을 입력해주세요.');
      return;
    }
    if (form.components.length === 0) {
      alert('구성 품목을 최소 1개 이상 추가해주세요.');
      return;
    }

    try {
      setSaving(true);
      if (editingSet) {
        const res = await fetch('/api/admin/preset-sets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSet.id, ...form }),
        });
        if (!res.ok) throw new Error('수정 실패');
      } else {
        const res = await fetch('/api/admin/preset-sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('등록 실패');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 활성/비활성 토글
  const handleToggleActive = async (preset: PresetSet) => {
    try {
      const nextActive = !preset.is_active;
      const res = await fetch('/api/admin/preset-sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: preset.id, is_active: nextActive }),
      });
      if (res.ok) {
        setPresetSets((prev) =>
          prev.map((p) => (p.id === preset.id ? { ...p, is_active: nextActive } : p))
        );
      }
    } catch {
      alert('상태 변경 실패');
    }
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 추천 세트 조합을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/preset-sets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPresetSets((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('삭제 실패');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* 상단 타이틀 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </span>
            <h1 className="text-lg font-bold text-stone-900">추천 세트 조합 관리 (서픽 / 은달 꿀조합)</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            서브웨이의 &apos;썹픽&apos;처럼 고객이 맞춤 세트 만들기에서 원클릭으로 선택해 견적서에 바로 담을 수 있는 추천 조합 세트를 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>새 추천 조합 등록</span>
          </button>
        </div>
      </div>

      {/* 추천 세트 목록 그리드 */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs">추천 세트 목록을 불러오는 중입니다...</p>
        </div>
      ) : presetSets.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
          <p className="text-sm font-bold text-stone-700">등록된 추천 세트가 없습니다.</p>
          <p className="text-xs text-stone-400 mt-1">상단 &apos;새 추천 조합 등록&apos; 버튼을 눌러 추가해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presetSets.map((preset) => (
            <div
              key={preset.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm flex flex-col justify-between transition-all ${
                preset.is_active ? 'border-amber-300/80 bg-amber-50/10' : 'border-stone-200 opacity-60 bg-stone-50'
              }`}
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img
                    src={preset.image_url || 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-extrabold text-[10px] shadow-sm">
                      {preset.badge_text || '꿀조합'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-stone-900 leading-snug">{preset.name}</h3>
                    <span className="font-mono font-black text-amber-950 text-base shrink-0">
                      {preset.price.toLocaleString()}원
                    </span>
                  </div>
                  {preset.description && (
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>
                  )}
                </div>

                {/* 구성 품목 리스트 */}
                <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 text-[11px] border border-stone-200/80">
                  <div>
                    <span className="font-bold text-stone-800">포함 품목:</span>{' '}
                    <span className="text-stone-600">
                      {preset.components.map((c) => `${c.menu_name}(${c.quantity}개)`).join(', ')}
                    </span>
                  </div>
                  <div className="text-stone-600">
                    <span className="font-bold text-stone-800">포장용기:</span> {preset.package_box_name || '기본 포장'}
                    {preset.package_box_price ? ` (+${preset.package_box_price.toLocaleString()}원)` : ''}
                  </div>
                  {Array.isArray(preset.packaging_options) && preset.packaging_options.length > 0 && (
                    <div className="text-stone-600">
                      <span className="font-bold text-stone-800">옵션:</span>{' '}
                      {preset.packaging_options.map((o) => `${o.name}(+${o.price.toLocaleString()}원)`).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 컨트롤 */}
              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(preset)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    preset.is_active
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }`}
                >
                  {preset.is_active ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-700" />
                      <span>노출 중</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-stone-500" />
                      <span>숨김</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(preset)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                    title="수정"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-stone-900">
                  {editingSet ? '추천 세트 조합 수정' : '새 추천 세트 조합 등록'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3.5 space-y-4 text-xs pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">세트 조합 이름 (필수)</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 은달 시그니처 든든 세트"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">강조 뱃지 문구</label>
                  <input
                    type="text"
                    value={form.badge_text}
                    onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                    placeholder="예: 👑 인기 1위 꿀조합, ✨ 가성비 최고, 🎁 단체 추천"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">세트 설명 문구</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="추천하는 이유 및 세트의 특징을 간단히 기재해주세요."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              {/* 대표 사진 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-700 font-bold">대표 이미지 URL</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px]"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingImage ? '업로드 중...' : '파일 업로드'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs"
                />
              </div>

              {/* 1. 구성 품목 담기 (서브웨이 썹픽 핵심) */}
              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-300/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1">
                      <span>1. 구성 품목 담기 ({form.components.length}종류)</span>
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      1/2 샌드위치, 음료, 디저트 등 세트에 기본 포함될 품목들을 선택해주세요.
                    </p>
                  </div>
                  <div className="relative w-36">
                    <Search className="w-3 h-3 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="메뉴 검색"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* 현재 담긴 품목 태그 */}
                {form.components.length > 0 && (
                  <div className="p-2 bg-white rounded-xl border border-amber-200 flex flex-wrap gap-1.5">
                    {form.components.map((c) => (
                      <span
                        key={c.menu_id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-950 rounded-lg text-xs font-bold"
                      >
                        <span>{c.menu_name} x {c.quantity}</span>
                        <span className="text-[10px] text-stone-500">({(c.price * c.quantity).toLocaleString()}원)</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateComponentQty({ id: c.menu_id } as MenuItem, -c.quantity)}
                          className="hover:text-red-600 ml-0.5"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 메뉴 선택 목록 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                  {selectableMenus
                    .filter((m) => !menuSearch || m.name.includes(menuSearch))
                    .map((menu) => {
                      const comp = form.components.find((c) => c.menu_id === menu.id);
                      const qty = comp ? comp.quantity : 0;
                      return (
                        <div
                          key={menu.id}
                          className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                            qty > 0 ? 'bg-amber-50/60 border-amber-400 font-bold' : 'bg-stone-50/50 border-stone-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-bold text-stone-900">{menu.name}</p>
                            <p className="text-[10px] text-amber-900">{menu.price.toLocaleString()}원</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {qty > 0 && (
                              <button
                                type="button"
                                onClick={() => handleUpdateComponentQty(menu, -1)}
                                className="w-5 h-5 rounded bg-stone-200 hover:bg-stone-300 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                            )}
                            <span className="w-5 text-center font-bold text-xs">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateComponentQty(menu, 1)}
                              className="w-5 h-5 rounded bg-stone-900 text-white hover:bg-amber-600 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 2. 포장용기 선택 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <h4 className="font-bold text-stone-900 text-xs">2. 포장용기 (박스) 지정</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectBox('none')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      form.package_box_id === 'none'
                        ? 'bg-stone-900 text-white border-stone-900 font-bold'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <p className="text-xs">기본 포장</p>
                    <p className="text-[10px] text-stone-400">0원</p>
                  </button>
                  {boxMenus.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBox(b.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        form.package_box_id === b.id
                          ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <p className="text-xs truncate">{b.name}</p>
                      <p className="text-[10px] opacity-80">+{b.price.toLocaleString()}원</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 특수포장 옵션 선택 */}
              {specialMenus.length > 0 && (
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <h4 className="font-bold text-stone-900 text-xs">3. 특수포장 & 선물 옵션 지정</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {specialMenus.map((opt) => {
                      const isChecked = form.packaging_options.some((o) => o.id === opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-purple-50 border-purple-400 font-bold text-purple-950'
                              : 'bg-white border-stone-200 text-stone-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleOption(opt)}
                              className="text-purple-600 rounded"
                            />
                            <span className="text-xs truncate">{opt.name}</span>
                          </div>
                          <span className="text-[10px] text-purple-800 shrink-0">+{opt.price.toLocaleString()}원</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. 세트 판매 단가 */}
              <div className="p-3.5 bg-stone-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-300">최종 세트 판매 단가:</span>
                  <p className="text-[10px] text-stone-400 mt-0.5">선택한 구성품 + 박스 + 옵션 자동 합산</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-28 p-2 bg-stone-800 border border-stone-700 rounded-xl text-right font-mono font-black text-amber-300 text-base"
                  />
                  <span className="font-bold text-sm">원</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">정렬 순서</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="is_active_check"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="is_active_check" className="font-bold text-xs text-stone-900 cursor-pointer">
                    홈페이지 세트메뉴 추천 노출 활성화
                  </label>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? '저장 중...' : editingSet ? '수정 완료' : '등록 완료'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
