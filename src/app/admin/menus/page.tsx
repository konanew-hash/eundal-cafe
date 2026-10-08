'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  Filter,
  Layers,
  LayoutGrid,
  AlertTriangle,
  Sparkles,
  Package,
  CheckCircle2,
  HelpCircle,
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

  // 세부 구분자 및 스마트 필터링 상태
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<
    'all' | 'sandwich_whole' | 'sandwich_half' | 'set_only' | 'has_allergen' | 'no_allergen' | 'sold_out' | 'packaging'
  >('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'sort_order' | 'name' | 'price_asc' | 'price_desc' | 'newest'>('sort_order');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');

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
    is_available_for_set: boolean;
    max_items_count: number;
    is_set_only: boolean;
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
    is_available_for_set: true,
    max_items_count: 4,
    is_set_only: false,
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

  // 통계 집계
  const stats = useMemo(() => {
    const total = menus.length;
    const soldOut = menus.filter((m) => m.is_sold_out).length;
    const available = total - soldOut;
    const wholeSandwiches = menus.filter((m) => m.name.includes('샌드위치') && !m.name.includes('1/2') && !m.is_set_only).length;
    const halfSandwiches = menus.filter((m) => m.name.includes('1/2') || m.is_set_only).length;
    const withAllergens = menus.filter((m) => m.allergens && m.allergens.trim().length > 0).length;
    const withoutAllergens = total - withAllergens;
    const packagingCount = menus.filter((m) => m.packaging_type === 'box' || m.packaging_type === 'special').length;
    return {
      total,
      soldOut,
      available,
      wholeSandwiches,
      halfSandwiches,
      withAllergens,
      withoutAllergens,
      packagingCount,
    };
  }, [menus]);

  // 세부 구분자 필터링 및 정렬된 메뉴 목록
  const filteredAndSortedMenus = useMemo(() => {
    return menus
      .filter((m) => {
        // 1. 카테고리 필터
        if (selectedCategoryFilter !== 'all' && m.category_id !== selectedCategoryFilter) {
          return false;
        }

        // 2. 세부 구분자(유형) 필터
        if (selectedTypeFilter === 'sandwich_whole') {
          if (!m.name.includes('샌드위치') || m.name.includes('1/2') || m.is_set_only) return false;
        } else if (selectedTypeFilter === 'sandwich_half') {
          if (!m.name.includes('1/2') && !m.is_set_only) return false;
        } else if (selectedTypeFilter === 'set_only') {
          if (!m.is_set_only && !m.is_available_for_set) return false;
        } else if (selectedTypeFilter === 'has_allergen') {
          if (!m.allergens || !m.allergens.trim()) return false;
        } else if (selectedTypeFilter === 'no_allergen') {
          if (m.allergens && m.allergens.trim()) return false;
        } else if (selectedTypeFilter === 'sold_out') {
          if (!m.is_sold_out) return false;
        } else if (selectedTypeFilter === 'packaging') {
          if (m.packaging_type !== 'box' && m.packaging_type !== 'special') return false;
        }

        // 3. 검색어 필터
        if (searchKeyword.trim()) {
          const kw = searchKeyword.trim().toLowerCase();
          const matchName = m.name.toLowerCase().includes(kw);
          const matchDesc = m.description?.toLowerCase().includes(kw);
          const matchAllergen = m.allergens?.toLowerCase().includes(kw);
          if (!matchName && !matchDesc && !matchAllergen) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko');
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.created_at || '').localeCompare(a.created_at || '');
        return a.sort_order - b.sort_order;
      });
  }, [menus, selectedCategoryFilter, selectedTypeFilter, searchKeyword, sortBy]);

  // 카테고리별 그룹화
  const groupedMenus = useMemo(() => {
    const groups: { category: Category; items: MenuItem[] }[] = [];
    categories.forEach((cat) => {
      const items = filteredAndSortedMenus.filter((m) => m.category_id === cat.id);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    });
    // 카테고리 미지정 메뉴
    const unassigned = filteredAndSortedMenus.filter((m) => !categories.some((c) => c.id === m.category_id));
    if (unassigned.length > 0) {
      groups.push({
        category: { id: 'unassigned', name: '기타 (카테고리 미지정)', sort_order: 999, is_active: true },
        items: unassigned,
      });
    }
    return groups;
  }, [categories, filteredAndSortedMenus]);

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

  // 맞춤 세트 구성품 허용 여부 토글 (원클릭 가감)
  const handleToggleSetAvailable = async (menu: MenuItem) => {
    try {
      const nextStatus = menu.is_available_for_set === false ? true : false;
      const res = await fetch('/api/admin/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_set_available',
          id: menu.id,
          is_available_for_set: nextStatus,
        }),
      });
      if (res.ok) {
        setMenus((prev) =>
          prev.map((m) => (m.id === menu.id ? { ...m, is_available_for_set: nextStatus } : m))
        );
      }
    } catch (e) {
      console.error(e);
      alert('세트메뉴 품목 설정 변경 실패');
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
        is_available_for_set: menu.is_available_for_set !== false,
        max_items_count: menu.max_items_count || 4,
        is_set_only: menu.is_set_only || false,
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
        is_available_for_set: true,
        max_items_count: 4,
        is_set_only: false,
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
        <div className="space-y-4">
          {/* 1. 상단 통계 요약 칩 바 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryFilter('all');
                setSelectedTypeFilter('all');
                setSearchKeyword('');
              }}
              className="p-2.5 rounded-xl bg-white border border-stone-200 text-left hover:border-amber-400 transition-colors shadow-2xs"
            >
              <p className="text-[10px] text-stone-500 font-medium">전체 등록</p>
              <p className="text-sm font-extrabold text-stone-900">{stats.total}개</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-left hover:bg-emerald-50 transition-colors shadow-2xs"
            >
              <p className="text-[10px] text-emerald-700 font-medium">판매 중</p>
              <p className="text-sm font-extrabold text-emerald-900">{stats.available}개</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('sold_out')}
              className={`p-2.5 rounded-xl border text-left transition-colors shadow-2xs ${
                selectedTypeFilter === 'sold_out'
                  ? 'bg-red-100 border-red-400 ring-2 ring-red-400'
                  : 'bg-red-50/60 border-red-200 hover:bg-red-50'
              }`}
            >
              <p className="text-[10px] text-red-700 font-medium">🔴 품절 품목</p>
              <p className="text-sm font-extrabold text-red-900">{stats.soldOut}개</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('sandwich_half')}
              className={`p-2.5 rounded-xl border text-left transition-colors shadow-2xs ${
                selectedTypeFilter === 'sandwich_half'
                  ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                  : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <p className="text-[10px] text-amber-800 font-medium">🥪 1/2 샌드위치</p>
              <p className="text-sm font-extrabold text-amber-950">{stats.halfSandwiches}개</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('has_allergen')}
              className={`p-2.5 rounded-xl border text-left transition-colors shadow-2xs ${
                selectedTypeFilter === 'has_allergen'
                  ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-400'
                  : 'bg-orange-50/60 border-orange-200 hover:bg-orange-50'
              }`}
            >
              <p className="text-[10px] text-orange-700 font-medium">⚠️ 알러지 등록</p>
              <p className="text-sm font-extrabold text-orange-950">{stats.withAllergens}개</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('no_allergen')}
              className={`p-2.5 rounded-xl border text-left transition-colors shadow-2xs ${
                selectedTypeFilter === 'no_allergen'
                  ? 'bg-stone-200 border-stone-400 ring-2 ring-stone-400'
                  : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <p className="text-[10px] text-stone-500 font-medium">❔ 알러지 미등록</p>
              <p className="text-sm font-extrabold text-stone-700">{stats.withoutAllergens}개</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('packaging')}
              className={`p-2.5 rounded-xl border text-left transition-colors shadow-2xs ${
                selectedTypeFilter === 'packaging'
                  ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-400'
                  : 'bg-purple-50/60 border-purple-200 hover:bg-purple-50'
              }`}
            >
              <p className="text-[10px] text-purple-700 font-medium">📦 포장재·옵션</p>
              <p className="text-sm font-extrabold text-purple-950">{stats.packagingCount}개</p>
            </button>
          </div>

          {/* 2. 대구분 (카테고리 필터 탭 바) */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                <span>1차 대구분 (카테고리 선택)</span>
              </span>
              <span className="text-[11px] text-stone-500">
                카테고리별 클릭 시 해당 그룹만 즉시 필터링
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                전체 카테고리 ({menus.length})
              </button>
              {categories.map((cat) => {
                const count = menus.filter((m) => m.category_id === cat.id).length;
                const isSelected = selectedCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-600 text-stone-950 font-black shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-amber-800 text-white' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 요구사항: 2차 세부 구분자 (유형 & 알러지 세부 필터 바) */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-700" />
                <span>2차 세부 구분자 (품목 유형 / 샌드위치 / 알러지 구분)</span>
              </span>
              <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                선택된 메뉴: {filteredAndSortedMenus.length}건
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'all', label: '전체 보기', count: menus.length },
                { key: 'sandwich_half', label: '🥪 1/2개 샌드위치 (세트전용)', count: stats.halfSandwiches },
                { key: 'sandwich_whole', label: '🥪 일반 샌드위치 (단품)', count: stats.wholeSandwiches },
                { key: 'has_allergen', label: '⚠️ 알러지 유발물질 등록', count: stats.withAllergens },
                { key: 'no_allergen', label: '❔ 알러지 미등록 (점검)', count: stats.withoutAllergens },
                { key: 'set_only', label: '🎁 세트구성 가능 품목', count: menus.filter((m) => m.is_available_for_set !== false).length },
                { key: 'packaging', label: '📦 포장용기 & 특수옵션', count: stats.packagingCount },
                { key: 'sold_out', label: '🔴 품절 메뉴만', count: stats.soldOut },
              ].map((item) => {
                const isSelected = selectedTypeFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedTypeFilter(item.key as any)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 검색창, 정렬, 뷰 모드 전환 컨트롤러 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs">
            {/* 검색창 */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="메뉴명, 설명, 알레르기 유발물질(예: 난류, 우유, 대두 등) 실시간 검색..."
                className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* 정렬 드롭다운 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
              >
                <option value="sort_order">정렬순서 (기본)</option>
                <option value="name">이름 가나다순</option>
                <option value="price_asc">가격 낮은순</option>
                <option value="price_desc">가격 높은순</option>
                <option value="newest">최신 등록순</option>
              </select>

              {/* 뷰 모드 토글 (카테고리별 묶어보기 vs 전체 그리드) */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'grouped'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="카테고리별로 묶어서 보기"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">그룹별</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="전체 카드 그리드로 보기"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">그리드</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. 메뉴 목록 렌더링 (결과가 없을 때 vs 있을 때) */}
          {filteredAndSortedMenus.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-stone-800 text-sm">해당 조건에 맞는 메뉴가 없습니다.</p>
                <p className="text-xs text-stone-500 mt-1">
                  선택하신 카테고리나 세부 구분자, 검색어를 변경해 보세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setSelectedTypeFilter('all');
                  setSearchKeyword('');
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-stone-800 transition-colors"
              >
                필터 전체 초기화
              </button>
            </div>
          ) : viewMode === 'grouped' ? (
            /* 그룹별 묶어보기 모드 */
            <div className="space-y-6">
              {groupedMenus.map((group) => (
                <div key={group.category.id} className="space-y-3">
                  {/* 카테고리 헤더 바 */}
                  <div className="flex items-center justify-between bg-stone-100/80 px-3.5 py-2.5 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                        {group.category.name}
                      </h3>
                      <span className="text-[11px] text-stone-500 font-medium">
                        ({group.items.length}개 메뉴)
                      </span>
                    </div>
                    {group.category.description && (
                      <span className="text-[11px] text-stone-500 hidden md:inline">
                        {group.category.description}
                      </span>
                    )}
                  </div>

                  {/* 카테고리 내 메뉴 그리드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {group.items.map((menu) => {
                      const catName = categories.find((c) => c.id === menu.category_id)?.name || '미지정';
                      const isHalfSandwich = menu.name.includes('1/2') || (menu.name.includes('샌드위치') && menu.is_set_only);

                      return (
                        <div
                          key={menu.id}
                          className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between hover:shadow-sm ${
                            menu.is_sold_out ? 'border-red-200 bg-red-50/20' : 'border-stone-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-start gap-3">
                              <img
                                src={
                                  menu.image_url ||
                                  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
                                }
                                alt={menu.name}
                                className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap mb-1">
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                                    {catName}
                                  </span>

                                  {/* 샌드위치 1/2개 세부 구분 뱃지 */}
                                  {isHalfSandwich && (
                                    <span className="text-[10px] font-black text-amber-950 bg-amber-300 border border-amber-400 px-2 py-0.5 rounded-full inline-block shadow-2xs">
                                      🥪 1/2개 (맞춤세트)
                                    </span>
                                  )}

                                  {menu.packaging_type === 'box' && (
                                    <>
                                      <span className="text-[10px] font-bold text-white bg-amber-800 px-2 py-0.5 rounded-full inline-block">
                                        📦 포장용기
                                      </span>
                                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-block">
                                        최대 {menu.max_items_count || 4}가지
                                      </span>
                                    </>
                                  )}
                                  {menu.packaging_type === 'special' && (
                                    <span className="text-[10px] font-bold text-white bg-purple-800 px-2 py-0.5 rounded-full inline-block">
                                      ✨ 특수포장
                                    </span>
                                  )}
                                  {!menu.packaging_type && !isHalfSandwich && (
                                    <>
                                      {menu.is_set_only && (
                                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block">
                                          세트전용
                                        </span>
                                      )}
                                      {menu.is_available_for_set !== false ? (
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                                          🎁 세트포함
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full inline-block">
                                          ⛔ 세트제외
                                        </span>
                                      )}
                                    </>
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

                            {/* 알러지 유발물질 시각적 강조 뱃지 */}
                            <div className="mt-2">
                              {menu.allergens && menu.allergens.trim() ? (
                                <div className="p-1.5 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-1.5 text-[10.5px] text-orange-900">
                                  <AlertTriangle className="w-3 h-3 text-orange-600 shrink-0" />
                                  <span className="font-bold shrink-0">알레르기:</span>
                                  <span className="font-medium truncate">{menu.allergens}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                                  <span>알레르기 미등록</span>
                                </span>
                              )}
                            </div>

                            {/* 추가 사진 & 영상 등록 개수 뱃지 */}
                            {((menu.additional_images && menu.additional_images.length > 0) ||
                              (menu.video_urls && menu.video_urls.length > 0)) && (
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

                          {/* 하단 컨트롤: 품절 토글 & 세트 가감 & 수정/삭제 */}
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

                            <div className="flex items-center gap-1.5">
                              {!menu.packaging_type && !isHalfSandwich && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSetAvailable(menu)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                                    menu.is_available_for_set !== false
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                      : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                  }`}
                                  title="클릭하여 맞춤 세트메뉴 1단계(품목) 포함/제외를 전환합니다"
                                >
                                  <span>{menu.is_available_for_set !== false ? '🎁 세트포함' : '⛔ 세트제외'}</span>
                                </button>
                              )}

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
                </div>
              ))}
            </div>
          ) : (
            /* 전체 카드 그리드 뷰 모드 */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAndSortedMenus.map((menu) => {
                const catName = categories.find((c) => c.id === menu.category_id)?.name || '미지정';
                const isHalfSandwich = menu.name.includes('1/2') || (menu.name.includes('샌드위치') && menu.is_set_only);

                return (
                  <div
                    key={menu.id}
                    className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between hover:shadow-sm ${
                      menu.is_sold_out ? 'border-red-200 bg-red-50/20' : 'border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            menu.image_url ||
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={menu.name}
                          className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap mb-1">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                              {catName}
                            </span>

                            {isHalfSandwich && (
                              <span className="text-[10px] font-black text-amber-950 bg-amber-300 border border-amber-400 px-2 py-0.5 rounded-full inline-block shadow-2xs">
                                🥪 1/2개 (맞춤세트)
                              </span>
                            )}

                            {menu.packaging_type === 'box' && (
                              <>
                                <span className="text-[10px] font-bold text-white bg-amber-800 px-2 py-0.5 rounded-full inline-block">
                                  📦 포장용기
                                </span>
                                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-block">
                                  최대 {menu.max_items_count || 4}가지
                                </span>
                              </>
                            )}
                            {menu.packaging_type === 'special' && (
                              <span className="text-[10px] font-bold text-white bg-purple-800 px-2 py-0.5 rounded-full inline-block">
                                ✨ 특수포장
                              </span>
                            )}
                            {!menu.packaging_type && !isHalfSandwich && (
                              <>
                                {menu.is_set_only && (
                                  <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block">
                                    세트전용
                                  </span>
                                )}
                                {menu.is_available_for_set !== false ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                                    🎁 세트포함
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full inline-block">
                                    ⛔ 세트제외
                                  </span>
                                )}
                              </>
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

                      {/* 알러지 유발물질 시각적 강조 뱃지 */}
                      <div className="mt-2">
                        {menu.allergens && menu.allergens.trim() ? (
                          <div className="p-1.5 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-1.5 text-[10.5px] text-orange-900">
                            <AlertTriangle className="w-3 h-3 text-orange-600 shrink-0" />
                            <span className="font-bold shrink-0">알레르기:</span>
                            <span className="font-medium truncate">{menu.allergens}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                            <span>알레르기 미등록</span>
                          </span>
                        )}
                      </div>

                      {/* 추가 사진 & 영상 등록 개수 뱃지 */}
                      {((menu.additional_images && menu.additional_images.length > 0) ||
                        (menu.video_urls && menu.video_urls.length > 0)) && (
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

                    {/* 하단 컨트롤: 품절 토글 & 세트 가감 & 수정/삭제 */}
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

                      <div className="flex items-center gap-1.5">
                        {!menu.packaging_type && !isHalfSandwich && (
                          <button
                            type="button"
                            onClick={() => handleToggleSetAvailable(menu)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                              menu.is_available_for_set !== false
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                            }`}
                            title="클릭하여 맞춤 세트메뉴 1단계(품목) 포함/제외를 전환합니다"
                          >
                            <span>{menu.is_available_for_set !== false ? '🎁 세트포함' : '⛔ 세트제외'}</span>
                          </button>
                        )}

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
          )}
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

                {/* 포장용기(박스)일 경우 최대 담을 수 있는 가지수 설정 */}
                {menuForm.packaging_type === 'box' && (
                  <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1.5">
                    <label className="block text-xs font-bold text-amber-950">
                      📦 포장용기에 담을 수 있는 최대 품목 가지수 설정
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={menuForm.max_items_count || 4}
                        onChange={(e) =>
                          setMenuForm({
                            ...menuForm,
                            max_items_count: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-24 p-2 bg-white border border-stone-300 rounded-lg text-center font-bold text-sm"
                      />
                      <span className="text-xs text-stone-700 font-medium">가지 (예: 크라프트 3가지, 하드케이스 4가지)</span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      * 고객이 맞춤 세트메뉴 구성 시, 이 포장용기를 선택하면 여기서 지정한 품목 가지수를 초과하여 담을 수 없습니다.
                    </p>
                  </div>
                )}

                {/* 일반 식음료 메뉴일 경우 맞춤 세트메뉴 포함 및 맞춤세트 전용 여부 설정 */}
                {!menuForm.packaging_type && (
                  <div className="mt-2.5 space-y-2">
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.is_available_for_set}
                          onChange={(e) =>
                            setMenuForm({ ...menuForm, is_available_for_set: e.target.checked })
                          }
                          className="mt-0.5 w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-stone-900">
                            은달 맞춤 세트메뉴 1단계(세트 담을 품목) 목록에 포함
                          </span>
                          <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                            체크 해제 시 고객이 홈페이지에서 맞춤 세트메뉴를 구성할 때 담을 품목 목록에서 제외됩니다.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={menuForm.is_set_only}
                          onChange={(e) =>
                            setMenuForm({ ...menuForm, is_set_only: e.target.checked })
                          }
                          className="mt-0.5 w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-stone-900">
                            맞춤 세트메뉴 전용 (일반 홈페이지 메뉴 비노출)
                          </span>
                          <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                            체크 시 일반 홈페이지 메뉴판에는 비노출되며, 맞춤 세트메뉴 만들기에서만 선택 가능합니다 (예: 샌드위치 1/2개 품목 등).
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
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
