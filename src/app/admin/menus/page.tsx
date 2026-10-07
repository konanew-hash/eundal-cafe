'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FolderPlus,
  RefreshCw,
  Check,
  X,
  Upload,
  Video,
  Film,
} from 'lucide-react';
import { Category, MenuItem } from '@/lib/types';

export default function AdminMenusPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menus' | 'categories'>('menus');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAddImage, setUploadingAddImage] = useState(false);
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const addImageFileInputRef = useRef<HTMLInputElement>(null);

  // 메뉴 모달
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<{
    category_id: string;
    name: string;
    description: string;
    allergens: string;
    price: number;
    image_url: string;
    additional_images: string[];
    video_urls: string[];
    sort_order: number;
    packaging_type: 'box' | 'special' | null;
  }>({
    category_id: '',
    name: '',
    description: '',
    allergens: '',
    price: 0,
    image_url: '',
    additional_images: [],
    video_urls: [],
    sort_order: 0,
    packaging_type: null,
  });

  // 다중 이미지 및 비디오 추가 인풋 상태
  const [inputAddImageUrl, setInputAddImageUrl] = useState('');
  const [inputVideoUrl, setInputVideoUrl] = useState('');

  // 카테고리 모달
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    sort_order: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/menus');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
      if (data.menus) setMenus(data.menus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 품절 토글
  const handleToggleSoldOut = async (menu: MenuItem) => {
    try {
      const nextStatus = !menu.is_sold_out;
      const res = await fetch('/api/admin/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_sold_out',
          id: menu.id,
          is_sold_out: nextStatus,
        }),
      });
      if (res.ok) {
        setMenus((prev) =>
          prev.map((m) => (m.id === menu.id ? { ...m, is_sold_out: nextStatus } : m))
        );
      }
    } catch (e) {
      console.error(e);
      alert('품절 상태 변경 실패');
    }
  };

  // 메뉴 삭제
  const handleDeleteMenu = async (id: string) => {
    if (!confirm('정말 이 메뉴를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/menus?type=menu&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMenus((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (e) {
      console.error(e);
      alert('메뉴 삭제 실패');
    }
  };

  // 메뉴 모달 열기 (추가/수정)
  const openMenuModal = (menu?: MenuItem) => {
    setInputAddImageUrl('');
    setInputVideoUrl('');
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        category_id: menu.category_id,
        name: menu.name,
        description: menu.description || '',
        allergens: menu.allergens || '',
        price: menu.price,
        image_url: menu.image_url,
        additional_images: Array.isArray(menu.additional_images) ? [...menu.additional_images] : [],
        video_urls: Array.isArray(menu.video_urls) ? [...menu.video_urls] : [],
        sort_order: menu.sort_order,
        packaging_type: menu.packaging_type || null,
      });
    } else {
      setEditingMenu(null);
      setMenuForm({
        category_id: categories[0]?.id || '',
        name: '',
        description: '',
        allergens: '',
        price: 5000,
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        additional_images: [],
        video_urls: [],
        sort_order: (menus.length + 1),
        packaging_type: null,
      });
    }
    setIsMenuModalOpen(true);
  };

  const handleMenuImageUpload = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setMenuForm((prev) => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  // 추가 사진 파일 직접 업로드 핸들러
  const handleUploadAdditionalImage = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingAddImage(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setMenuForm((prev) => ({
          ...prev,
          additional_images: [...prev.additional_images, data.url],
        }));
      } else {
        alert(data.error || '추가 이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('추가 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingAddImage(false);
    }
  };

  // 추가 사진 URL 직접 입력 추가
  const handleAddAdditionalImageUrl = () => {
    const url = inputAddImageUrl.trim();
    if (!url) return;
    setMenuForm((prev) => ({
      ...prev,
      additional_images: [...prev.additional_images, url],
    }));
    setInputAddImageUrl('');
  };

  // 추가 사진 삭제
  const handleRemoveAdditionalImage = (index: number) => {
    setMenuForm((prev) => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, idx) => idx !== index),
    }));
  };

  // 설명 영상 URL 추가 (유튜브 등)
  const handleAddVideoUrl = () => {
    const url = inputVideoUrl.trim();
    if (!url) return;
    setMenuForm((prev) => ({
      ...prev,
      video_urls: [...prev.video_urls, url],
    }));
    setInputVideoUrl('');
  };

  // 설명 영상 삭제
  const handleRemoveVideoUrl = (index: number) => {
    setMenuForm((prev) => ({
      ...prev,
      video_urls: prev.video_urls.filter((_, idx) => idx !== index),
    }));
  };

  // 메뉴 저장
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        // 수정
        const res = await fetch('/api/admin/menus', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_menu',
            id: editingMenu.id,
            ...menuForm,
          }),
        });
        if (res.ok) {
          setIsMenuModalOpen(false);
          loadData();
        }
      } else {
        // 추가
        const res = await fetch('/api/admin/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_menu',
            ...menuForm,
          }),
        });
        if (res.ok) {
          setIsMenuModalOpen(false);
          loadData();
        }
      }
    } catch (e) {
      console.error(e);
      alert('메뉴 저장 실패');
    }
  };

  // 카테고리 모달 열기 (추가/수정)
  const openCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({
        name: cat.name,
        description: cat.description || '',
        sort_order: cat.sort_order,
      });
    } else {
      setEditingCat(null);
      setCatForm({
        name: '',
        description: '',
        sort_order: (categories.length + 1),
      });
    }
    setIsCatModalOpen(true);
  };

  // 카테고리 저장
  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        const res = await fetch('/api/admin/menus', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_category',
            id: editingCat.id,
            ...catForm,
          }),
        });
        if (res.ok) {
          setIsCatModalOpen(false);
          loadData();
        }
      } else {
        const res = await fetch('/api/admin/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_category',
            ...catForm,
          }),
        });
        if (res.ok) {
          setIsCatModalOpen(false);
          loadData();
        }
      }
    } catch (e) {
      console.error(e);
      alert('카테고리 저장 실패');
    }
  };

  // 카테고리 삭제
  const handleDeleteCat = async (id: string) => {
    if (!confirm('카테고리를 삭제하면 속한 메뉴도 함께 삭제될 수 있습니다. 진행하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/menus?type=category&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
      alert('카테고리 삭제 실패');
    }
  };

  return (
    <div className="space-y-5">
      {/* 타이틀 및 탭 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">메뉴 & 그룹(카테고리) 관리</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            메뉴 항목 추가, 가격 수정, 품절 처리 및 카테고리를 실시간으로 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'menus' ? (
            <button
              onClick={() => openMenuModal()}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>신규 메뉴 등록</span>
            </button>
          ) : (
            <button
              onClick={() => openCatModal()}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>새 카테고리 추가</span>
            </button>
          )}

          <button
            onClick={loadData}
            title="새로고침"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs border border-stone-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 탭 스위처 */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-1">
        <button
          onClick={() => setActiveTab('menus')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'menus'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
          }`}
        >
          메뉴 관리 ({menus.length}개)
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
          }`}
        >
          카테고리/그룹 관리 ({categories.length}개)
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      {activeTab === 'menus' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {menus.map((menu) => {
            const catName = categories.find((c) => c.id === menu.category_id)?.name || '미지정';
            return (
              <div
                key={menu.id}
                className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                  menu.is_sold_out ? 'border-red-200 bg-red-50/20' : 'border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={menu.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'}
                      alt={menu.name}
                      className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                          {catName}
                        </span>
                        {menu.packaging_type === 'box' && (
                          <span className="text-[10px] font-bold text-white bg-amber-800 px-2 py-0.5 rounded-full inline-block">
                            📦 포장용기
                          </span>
                        )}
                        {menu.packaging_type === 'special' && (
                          <span className="text-[10px] font-bold text-white bg-purple-800 px-2 py-0.5 rounded-full inline-block">
                            ✨ 특수포장
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{menu.name}</h4>
                      <p className="text-xs font-bold text-stone-700 mt-0.5">
                        {menu.price.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  {menu.description && (
                    <p className="text-xs text-stone-500 mt-2 line-clamp-2">{menu.description}</p>
                  )}
                  {menu.allergens && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded font-medium line-clamp-1">
                        알레르기: {menu.allergens}
                      </span>
                    </div>
                  )}

                  {/* 추가 사진 & 영상 등록 개수 뱃지 */}
                  {((menu.additional_images && menu.additional_images.length > 0) || (menu.video_urls && menu.video_urls.length > 0)) && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {menu.additional_images && menu.additional_images.length > 0 && (
                        <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                          추가사진 {menu.additional_images.length}장
                        </span>
                      )}
                      {menu.video_urls && menu.video_urls.length > 0 && (
                        <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                          <Video className="w-2.5 h-2.5" />
                          영상 {menu.video_urls.length}개
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 하단 컨트롤: 품절 토글 & 수정/삭제 */}
                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  {/* 품절 토글 버튼 */}
                  <button
                    onClick={() => handleToggleSoldOut(menu)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      menu.is_sold_out
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {menu.is_sold_out ? (
                      <>
                        <ToggleLeft className="w-4 h-4 text-red-600" />
                        <span>품절 상태</span>
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-700" />
                        <span>판매 중</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openMenuModal(menu)}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                      title="수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 카테고리 관리 테이블 */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
              <tr>
                <th className="p-3.5">순서</th>
                <th className="p-3.5">카테고리명</th>
                <th className="p-3.5">설명</th>
                <th className="p-3.5">포함 메뉴 수</th>
                <th className="p-3.5 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.map((cat) => {
                const count = menus.filter((m) => m.category_id === cat.id).length;
                return (
                  <tr key={cat.id} className="hover:bg-stone-50/50">
                    <td className="p-3.5 font-bold">{cat.sort_order}</td>
                    <td className="p-3.5 font-bold text-stone-900">{cat.name}</td>
                    <td className="p-3.5 text-stone-500">{cat.description || '-'}</td>
                    <td className="p-3.5 font-medium">{count}개</td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => openCatModal(cat)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteCat(cat.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 메뉴 등록/수정 모달 */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 text-xs max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingMenu ? '메뉴 정보 수정' : '신규 메뉴 등록'}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="py-3 space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-stone-700 font-medium mb-1">카테고리</label>
                <select
                  required
                  value={menuForm.category_id}
                  onChange={(e) => setMenuForm({ ...menuForm, category_id: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  맞춤 세트메뉴 포장/패키징 구분 (선택)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, packaging_type: null })}
                    className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-colors ${
                      !menuForm.packaging_type
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    일반 식음료 메뉴
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, packaging_type: 'box' })}
                    className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-colors ${
                      menuForm.packaging_type === 'box'
                        ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    📦 포장용기 (박스)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, packaging_type: 'special' })}
                    className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-colors ${
                      menuForm.packaging_type === 'special'
                        ? 'bg-purple-800 text-white border-purple-800 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ✨ 특수포장 (옵션)
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  * 포장용기(박스)나 특수포장으로 지정된 품목은 맞춤형 세트메뉴 빌더의 포장용기/특수옵션 선택지에 자동 연동되며, 세트 내 구성품 담기 목록에서는 제외됩니다.
                </p>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">메뉴 이름</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">가격 (원)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={100}
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({ ...menuForm, price: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">메뉴 상세 설명</label>
                <textarea
                  rows={3}
                  placeholder="메뉴의 특징, 원재료, 맛의 설명 등을 작성해주세요."
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  알레르기 유발 성분 표기 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="예: 우유, 밀, 대두, 계란, 견과류"
                  value={menuForm.allergens}
                  onChange={(e) => setMenuForm({ ...menuForm, allergens: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-700 font-medium">메뉴 대표 사진</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={menuFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleMenuImageUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => menuFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingImage ? '업로드 중...' : '파일 직접 업로드'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="https://... 또는 우측 상단 파일 업로드"
                  value={menuForm.image_url}
                  onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
                {/* 사진 미리보기 */}
                <div className="mt-2 h-32 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative">
                  <img
                    src={menuForm.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'}
                    alt="메뉴 사진 미리보기"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                    대표 사진 미리보기
                  </span>
                </div>
              </div>

              {/* 추가 사진 등록 (홈페이지 사진 롤링용) */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-stone-800 font-bold text-xs flex items-center gap-1">
                      <span>추가 사진 (홈페이지 사진 롤링/슬라이더)</span>
                      <span className="text-amber-800 bg-amber-100 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        {menuForm.additional_images.length}장
                      </span>
                    </label>
                    <p className="text-[10px] text-stone-500">
                      고객이 상세 모달에서 좌우로 넘겨볼 수 있는 추가 사진들입니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="file"
                      ref={addImageFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadAdditionalImage(file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingAddImage}
                      onClick={() => addImageFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-[10px] transition-colors"
                    >
                      <Upload className="w-2.5 h-2.5 text-amber-700" />
                      <span>{uploadingAddImage ? '업로드 중...' : '파일 추가'}</span>
                    </button>
                  </div>
                </div>

                {/* URL 직접 추가 입력창 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    placeholder="https://... 이미지 URL 입력 후 추가"
                    value={inputAddImageUrl}
                    onChange={(e) => setInputAddImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAdditionalImageUrl();
                      }
                    }}
                    className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdditionalImageUrl}
                    className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs shrink-0"
                  >
                    추가
                  </button>
                </div>

                {/* 등록된 추가 이미지 목록 썸네일 */}
                {menuForm.additional_images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {menuForm.additional_images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 border border-stone-300 group">
                        <img src={img} alt={`추가 사진 ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-bold">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xs"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 메뉴 설명 영상 등록 (다수 지원) */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div>
                  <label className="text-stone-800 font-bold text-xs flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    <span>메뉴 설명 영상 등록 (다수 지원)</span>
                    <span className="text-red-700 bg-red-50 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-200">
                      {menuForm.video_urls.length}개
                    </span>
                  </label>
                  <p className="text-[10px] text-stone-500">
                    YouTube 링크나 영상 URL을 여러 개 등록할 수 있습니다.
                  </p>
                </div>

                {/* 영상 URL 추가 인풋 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... 또는 shorts URL"
                    value={inputVideoUrl}
                    onChange={(e) => setInputVideoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVideoUrl();
                      }
                    }}
                    className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shrink-0"
                  >
                    영상 추가
                  </button>
                </div>

                {/* 등록된 영상 목록 */}
                {menuForm.video_urls.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {menuForm.video_urls.map((vUrl, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-200 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Film className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate text-stone-700 font-mono text-[11px]">{vUrl}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideoUrl(idx)}
                          className="text-stone-400 hover:text-red-600 p-1 shrink-0 ml-2"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카테고리 모달 */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingCat ? '카테고리 수정' : '새 카테고리 등록'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCat} className="py-4 space-y-3">
              <div>
                <label className="block text-stone-700 font-medium mb-1">카테고리명</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">설명</label>
                <input
                  type="text"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">표시 순서</label>
                <input
                  type="number"
                  value={catForm.sort_order}
                  onChange={(e) => setCatForm({ ...catForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
