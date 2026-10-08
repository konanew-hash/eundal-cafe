'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Store,
  MapPin,
  Star,
  MessageSquare,
  Coffee,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Save,
  Navigation,
  BarChart3,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Cake,
  Package,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Competitor } from '@/lib/types';
import MiniMapPopup from '@/components/MiniMapPopup';
import CompetitorImage from '@/components/CompetitorImage';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS } from '@/lib/geoUtils';

export default function AdminCompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [eundalBenchmark, setEundalBenchmark] = useState({
    americanoPrice: 2500,
    lattePrice: 3500,
    avgDrinkPrice: 3200,
    avgDessertPrice: 3100,
    avgSetPrice: 7500,
    store1: EUNDAL_STORE1_COORDS,
    store2: EUNDAL_STORE2_COORDS,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 뷰 모드: 'cards' | 'chart' | 'matrix'
  const [viewMode, setViewMode] = useState<'cards' | 'chart' | 'matrix'>('cards');

  // 차트 비교 카테고리: 'drink' | 'dessert' | 'set'
  const [chartCategory, setChartCategory] = useState<'drink' | 'dessert' | 'set'>('drink');

  // 필터 상태
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'store1' | 'store2'>('all');
  const [selectedBrandType, setSelectedBrandType] = useState<'all' | 'small_coffee' | 'dessert_cafe' | 'specialty'>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(5.0);
  const [sortBy, setSortBy] = useState<'popularity' | 'distance1' | 'distance2' | 'rating' | 'reviews' | 'drink_price' | 'dessert_price'>('popularity');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 상권 레이더 맵 펼침/접힘 토글 (칸 차지 최소화)
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // 지도 팝업 상태 (기존 픽업 매장관리와 동일 연동)
  const [mapTarget, setMapTarget] = useState<Competitor | null>(null);

  // 등록/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competitor | null>(null);

  // 네이버 플레이스 검색 상태
  const [searchPlaceQuery, setSearchPlaceQuery] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [placeSearchResults, setPlaceSearchResults] = useState<any[]>([]);

  // 신규 등록 폼 내 메뉴 카테고리 탭: 'drink' | 'dessert' | 'set'
  const [menuFormTab, setMenuFormTab] = useState<'drink' | 'dessert' | 'set'>('drink');

  // 각 경쟁사 카드별 메뉴 카테고리 탭 상태 ('all' | 'drink' | 'dessert' | 'set')
  const [compMenuCategoryTab, setCompMenuCategoryTab] = useState<Record<string, 'all' | 'drink' | 'dessert' | 'set'>>({});

  // 폼 상태
  const [form, setForm] = useState({
    name: '',
    brand_type: 'small_coffee',
    target_branch: 'both' as 'store1' | 'store2' | 'both',
    address: '',
    address_detail: '',
    phone: '',
    latitude: '' as string | number,
    longitude: '' as string | number,
    naver_place_id: '',
    naver_place_url: '',
    rating: 4.6,
    review_count: 350,
    blog_review_count: 90,
    image_url: '',
    description: '',
    representative_menu: '',
    avg_coffee_price: 3200,
    avg_drink_price: 3800,
    avg_dessert_price: 3600,
    avg_set_price: 7500,
    menus: [] as { name: string; category: string; price: number; is_signature: boolean }[],
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. 경쟁사 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/competitors');
      const data = await res.json();
      if (data.competitors) {
        setCompetitors(data.competitors);
      }
      if (data.eundalBenchmark) {
        setEundalBenchmark(data.eundalBenchmark);
      }
    } catch (err) {
      console.error('Failed to load competitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. 수동 일일 동기화 트리거
  const handleDailySync = async () => {
    if (!confirm('네이버 플레이스 기준 평점과 리뷰수를 일일 업데이트하시겠습니까?')) return;
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await fetch('/api/admin/competitors/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.message || '일일 업데이트가 성공적으로 완료되었습니다.');
        loadData();
      } else {
        alert(data.error || '동기화 중 오류가 발생했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  // 3. 통계 계산 (음료류, 디저트류, 세트류 3대 카테고리 평균 비교)
  const stats = useMemo(() => {
    if (competitors.length === 0) {
      return {
        count: 0,
        avgDrinkPrice: 4200,
        avgDessertPrice: 4500,
        avgSetPrice: 8900,
        drinkDiffPercent: 24,
        dessertDiffPercent: 31,
        setDiffPercent: 16,
        avgRating: 4.67,
        totalReviews: 0,
      };
    }

    const drinkPrices = competitors.map((c) => c.avg_drink_price || c.avg_coffee_price || 4200).filter((p) => p > 0);
    const avgDrinkPrice = Math.round(drinkPrices.reduce((a, b) => a + b, 0) / drinkPrices.length);
    const drinkDiff = avgDrinkPrice - eundalBenchmark.avgDrinkPrice;
    const drinkDiffPercent = Math.round((drinkDiff / avgDrinkPrice) * 100);

    const dessertPrices = competitors.map((c) => c.avg_dessert_price || 4200).filter((p) => p > 0);
    const avgDessertPrice = Math.round(dessertPrices.reduce((a, b) => a + b, 0) / dessertPrices.length);
    const dessertDiff = avgDessertPrice - eundalBenchmark.avgDessertPrice;
    const dessertDiffPercent = Math.round((dessertDiff / avgDessertPrice) * 100);

    const setPrices = competitors.map((c) => c.avg_set_price || 8500).filter((p) => p > 0);
    const avgSetPrice = Math.round(setPrices.reduce((a, b) => a + b, 0) / setPrices.length);
    const setDiff = avgSetPrice - eundalBenchmark.avgSetPrice;
    const setDiffPercent = Math.round((setDiff / avgSetPrice) * 100);

    const ratings = competitors.map((c) => Number(c.rating) || 4.5);
    const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
    const totalReviews = competitors.reduce((acc, c) => acc + (c.review_count || 0), 0);

    return {
      count: competitors.length,
      avgDrinkPrice,
      avgDessertPrice,
      avgSetPrice,
      drinkDiffPercent,
      dessertDiffPercent,
      setDiffPercent,
      avgRating,
      totalReviews,
    };
  }, [competitors, eundalBenchmark]);

  // 4. 필터링 및 정렬된 목록
  const filteredCompetitors = useMemo(() => {
    return competitors
      .filter((c) => {
        // 상권 필터
        if (selectedBranch === 'store1' && c.distance_store1 > maxDistanceKm) return false;
        if (selectedBranch === 'store2' && c.distance_store2 > maxDistanceKm) return false;
        if (selectedBranch === 'all' && c.distance_store1 > maxDistanceKm && c.distance_store2 > maxDistanceKm) return false;

        // 카페 규모/타입 필터 (소규모 커피점 / 디저트카페 / 스페셜티)
        if (selectedBrandType !== 'all') {
          if (c.brand_type !== selectedBrandType) return false;
        }

        // 검색어 필터
        if (searchKeyword.trim()) {
          const kw = searchKeyword.toLowerCase();
          const matchName = c.name.toLowerCase().includes(kw);
          const matchAddress = c.address.toLowerCase().includes(kw);
          const matchMenu = (c.representative_menu || '').toLowerCase().includes(kw) ||
            (c.menus || []).some((m) => m.name.toLowerCase().includes(kw));
          return matchName || matchAddress || matchMenu;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance1') return a.distance_store1 - b.distance_store1;
        if (sortBy === 'distance2') return a.distance_store2 - b.distance_store2;
        if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
        if (sortBy === 'reviews') return b.review_count - a.review_count;
        if (sortBy === 'drink_price') return (a.avg_drink_price || a.avg_coffee_price || 0) - (b.avg_drink_price || b.avg_coffee_price || 0);
        if (sortBy === 'dessert_price') return (a.avg_dessert_price || 0) - (b.avg_dessert_price || 0);
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      });
  }, [competitors, selectedBranch, selectedBrandType, maxDistanceKm, sortBy, searchKeyword]);

  // 5. 신규 모달 열기
  const openAddModal = () => {
    setEditingComp(null);
    setSearchPlaceQuery('');
    setPlaceSearchResults([]);
    setForm({
      name: '',
      brand_type: 'small_coffee',
      target_branch: 'both',
      address: '',
      address_detail: '',
      phone: '',
      latitude: EUNDAL_STORE1_COORDS.lat + 0.002,
      longitude: EUNDAL_STORE1_COORDS.lng + 0.001,
      naver_place_id: '',
      naver_place_url: '',
      rating: 4.6,
      review_count: 320,
      blog_review_count: 70,
      image_url: '',
      description: '',
      representative_menu: '아메리카노, 카페라떼, 수제쿠키, 디저트세트',
      avg_coffee_price: 3200,
      avg_drink_price: 3800,
      avg_dessert_price: 3500,
      avg_set_price: 7200,
      menus: [
        { name: '아메리카노', category: 'drink', price: 3000, is_signature: false },
        { name: '카페라떼', category: 'drink', price: 3800, is_signature: false },
        { name: '시그니처 크림라떼', category: 'drink', price: 4800, is_signature: true },
        { name: '수제 르뱅쿠키', category: 'dessert', price: 3500, is_signature: false },
        { name: '소금빵', category: 'dessert', price: 3200, is_signature: true },
        { name: '1인 커피&쿠키 세트', category: 'set', price: 6200, is_signature: false },
        { name: '단체 다과 10인 세트', category: 'set', price: 55000, is_signature: true },
      ],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // 6. 수정 모달 열기
  const openEditModal = (comp: Competitor) => {
    setEditingComp(comp);
    setSearchPlaceQuery('');
    setPlaceSearchResults([]);
    setForm({
      name: comp.name,
      brand_type: comp.brand_type || 'small_coffee',
      target_branch: comp.target_branch || 'both',
      address: comp.address,
      address_detail: comp.address_detail || '',
      phone: comp.phone || '',
      latitude: comp.latitude,
      longitude: comp.longitude,
      naver_place_id: comp.naver_place_id || '',
      naver_place_url: comp.naver_place_url || '',
      rating: Number(comp.rating) || 4.5,
      review_count: comp.review_count || 0,
      blog_review_count: comp.blog_review_count || 0,
      image_url: comp.image_url || '',
      description: comp.description || '',
      representative_menu: comp.representative_menu || '',
      avg_coffee_price: comp.avg_coffee_price || 3500,
      avg_drink_price: comp.avg_drink_price || 4000,
      avg_dessert_price: comp.avg_dessert_price || 3800,
      avg_set_price: comp.avg_set_price || 7800,
      menus: (comp.menus && comp.menus.length > 0)
        ? comp.menus.map((m) => ({
            name: m.name,
            category: m.category || 'drink',
            price: m.price,
            is_signature: m.is_signature,
          }))
        : [
            { name: '아메리카노', category: 'drink', price: comp.avg_coffee_price || 3500, is_signature: false },
          ],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // 7. 네이버 플레이스 검색 실행
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlaceQuery.trim()) return;

    try {
      setSearchingPlace(true);
      const res = await fetch(`/api/admin/competitors/search-place?query=${encodeURIComponent(searchPlaceQuery.trim())}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setPlaceSearchResults(data.items);
      } else {
        alert('검색 결과가 없습니다. 아래 직접 입력 폼에서 상호명과 주소를 입력해주세요.');
      }
    } catch {
      alert('검색 중 오류가 발생했습니다. 직접 입력 폼을 이용해주세요.');
    } finally {
      setSearchingPlace(false);
    }
  };

  // 8. 검색 결과에서 매장 선택 시 폼에 자동 채우기
  const handleSelectSearchResult = (item: any) => {
    if (item.isChain) {
      if (!confirm(`'${item.name}'은 체인점(프랜차이즈)으로 감지되었습니다.\n체인점은 비교 대상에서 제외하는 것이 권장됩니다. 그래도 등록하시겠습니까?`)) {
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      name: item.name,
      brand_type: item.brand_type || prev.brand_type,
      address: item.roadAddress || item.address,
      phone: item.phone || prev.phone,
      latitude: item.latitude,
      longitude: item.longitude,
      naver_place_id: item.naver_place_id || '',
      naver_place_url: item.naver_place_url || '',
      rating: item.rating || 4.6,
      review_count: item.review_count || 320,
      blog_review_count: item.blog_review_count || 80,
      representative_menu: item.representative_menu || prev.representative_menu,
      avg_coffee_price: item.avg_coffee_price || 3500,
      avg_drink_price: item.avg_drink_price || 4000,
      avg_dessert_price: item.avg_dessert_price || 3800,
      avg_set_price: item.avg_set_price || 7800,
      target_branch: item.distance_store1 <= item.distance_store2 ? 'store1' : 'store2',
    }));

    setPlaceSearchResults([]);
  };

  // 메뉴 추가
  const handleAddMenuRow = (category: 'drink' | 'dessert' | 'set') => {
    const currentCount = form.menus.filter((m) => m.category === category).length;
    if (currentCount >= 20) {
      alert(`${category === 'drink' ? '음료' : category === 'dessert' ? '디저트' : '세트'} 메뉴는 최대 20개까지만 등록 가능합니다.`);
      return;
    }

    const defaultPrice = category === 'drink' ? 3800 : category === 'dessert' ? 3500 : 7500;
    setForm((prev) => ({
      ...prev,
      menus: [...prev.menus, { name: '', category, price: defaultPrice, is_signature: false }],
    }));
  };

  // 메뉴 삭제
  const handleRemoveMenuRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      menus: prev.menus.filter((_, i) => i !== idx),
    }));
  };

  // 9. 경쟁사 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('상호명을 입력해주세요.');
      return;
    }
    if (!form.address.trim()) {
      setFormError('도로명 주소를 입력해주세요.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingComp) {
        const res = await fetch(`/api/admin/competitors/${editingComp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('수정 실패');
      } else {
        const res = await fetch('/api/admin/competitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('등록 실패');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 10. 경쟁사 삭제
  const handleDelete = async (comp: Competitor) => {
    if (!confirm(`정말 '${comp.name}' 경쟁사를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/competitors/${comp.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCompetitors((prev) => prev.filter((c) => c.id !== comp.id));
      } else {
        alert('삭제 실패');
      }
    } catch {
      alert('오류 발생');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl pb-16">
      {/* 1. 상단 글로벌 헤더 & 액션 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
              <TrendingUp className="w-5 h-5 text-amber-800" />
            </span>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              주변 카페 제품 및 가격 비교 분석
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              반경 5km 로컬 상권 ({competitors.length}곳)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            은달 1호점(조원) 및 2호점(파장) 인근 5km 내 **소규모 커피점, 디저트카페, 스페셜티 카페**의 메뉴(최대 60종)와 음료·디저트·세트 평균 가격을 비교합니다.
            <span className="text-amber-700 font-medium ml-1.5">* 프랜차이즈 체인점 및 제과점은 제외됩니다.</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDailySync}
            disabled={syncing}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            title="네이버 플레이스 평점/리뷰수 최신 일일 동기화"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{syncing ? '일일 동기화 중...' : '일일 네이버 정보 업데이트'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>신규 경쟁사 등록</span>
          </button>
        </div>
      </div>

      {/* 동기화 완료 알림 */}
      {syncMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* 2. 대시보드 KPI 카드 그리드 (음료류, 디저트류, 세트류 3대 카테고리 평균 비교) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: 음료류 평균 가격 비교 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-900 text-xs">
            <span className="font-bold">☕ 음료류 평균 가격</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">은달 {stats.drinkDiffPercent}% 저렴</span>
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {stats.avgDrinkPrice.toLocaleString()} <span className="text-sm font-semibold text-stone-500">원</span>
          </div>
          <p className="text-[11px] text-stone-600 font-medium">
            은달 <strong>{eundalBenchmark.avgDrinkPrice.toLocaleString()}원</strong> vs 주변평균 {stats.avgDrinkPrice.toLocaleString()}원
          </p>
        </div>

        {/* KPI 2: 디저트류 평균 가격 비교 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/40 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-900 text-xs">
            <span className="font-bold">🍰 디저트류 평균 가격</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">은달 {stats.dessertDiffPercent}% 저렴</span>
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {stats.avgDessertPrice.toLocaleString()} <span className="text-sm font-semibold text-stone-500">원</span>
          </div>
          <p className="text-[11px] text-stone-600 font-medium">
            은달 <strong>{eundalBenchmark.avgDessertPrice.toLocaleString()}원</strong> vs 주변평균 {stats.avgDessertPrice.toLocaleString()}원
          </p>
        </div>

        {/* KPI 3: 세트/단체구성 평균 가격 비교 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-900 text-xs">
            <span className="font-bold">🎁 세트/단체구성 평균 가격</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">은달 {stats.setDiffPercent}% 저렴</span>
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {stats.avgSetPrice.toLocaleString()} <span className="text-sm font-semibold text-stone-500">원</span>
          </div>
          <p className="text-[11px] text-stone-600 font-medium">
            은달 <strong>{eundalBenchmark.avgSetPrice.toLocaleString()}원</strong> vs 주변평균 {stats.avgSetPrice.toLocaleString()}원
          </p>
        </div>

        {/* KPI 4: 인지도 & 리뷰 모수 총량 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-medium">상권 인지도 모수</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            ★ {stats.avgRating} <span className="text-xs font-semibold text-stone-400">({stats.totalReviews.toLocaleString()}건)</span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium">
            22개 분석 매장 누적 방문자 리뷰
          </p>
        </div>
      </div>

      {/* 3. [공간 효율 극대화] 접이식 상권 레이더 맵 & 빠른 거리 칩 */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* 상단 컴팩트 컨트롤 바 */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/80 border-b border-stone-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>상권 거리 필터:</span>
            </span>
            <button
              onClick={() => setMaxDistanceKm(1.5)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                maxDistanceKm === 1.5 ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              1.5km 이내 (도보권)
            </button>
            <button
              onClick={() => setMaxDistanceKm(3.0)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                maxDistanceKm === 3.0 ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              3.0km 이내
            </button>
            <button
              onClick={() => setMaxDistanceKm(5.0)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                maxDistanceKm === 5.0 ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              5.0km 전체
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMapExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 transition-colors self-start sm:self-auto shadow-2xs"
          >
            <span>{isMapExpanded ? '상권 레이더 맵 접기' : '상권 레이더 맵 펼쳐보기'}</span>
            {isMapExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* 접이식 지도 (펼쳤을 때만 렌더링되어 공간 및 로딩 최적화) */}
        {isMapExpanded && (
          <div className="relative w-full h-[280px] bg-stone-100 animate-in fade-in duration-200">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=126.9750,37.2750,127.0450,37.3350&layer=mapnik&marker=${EUNDAL_STORE1_COORDS.lat},${EUNDAL_STORE1_COORDS.lng}`}
              title="은달 5km 상권 레이더 지도"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* 4. 컨트롤 바 (카페 규모/유형 탭 / 상권 필터 / 뷰 모드 / 검색) */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        {/* 상단 필터 행 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 규모/유형별 필터 (소규모 커피점, 디저트카페, 스페셜티) */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedBrandType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedBrandType === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              전체 매장 ({competitors.length})
            </button>
            <button
              onClick={() => setSelectedBrandType('small_coffee')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedBrandType === 'small_coffee' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>소규모 커피점 (은달 유사규모)</span>
            </button>
            <button
              onClick={() => setSelectedBrandType('dessert_cafe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedBrandType === 'dessert_cafe' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Cake className="w-3.5 h-3.5 text-rose-500" />
              <span>디저트 카페</span>
            </button>
            <button
              onClick={() => setSelectedBrandType('specialty')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedBrandType === 'specialty' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-800" />
              <span>스페셜티 카페</span>
            </button>
          </div>

          {/* 뷰 모드 전환 (상세 카드 / 가격 비교 차트 / 인지도 매트릭스) */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl self-start lg:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'cards' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>상세 카드</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'chart' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>가격 비교 차트</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'matrix' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>인지도 포지셔닝 맵</span>
            </button>
          </div>
        </div>

        {/* 하단 검색창 및 지점/정렬 바 */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1 p-1 bg-stone-50 rounded-xl border border-stone-200">
            <button
              onClick={() => setSelectedBranch('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedBranch === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
            >
              전체 지점
            </button>
            <button
              onClick={() => setSelectedBranch('store1')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedBranch === 'store1' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
            >
              1호점(조원) 중심
            </button>
            <button
              onClick={() => setSelectedBranch('store2')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedBranch === 'store2' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
            >
              2호점(파장) 중심
            </button>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="상호명, 메뉴명(소금빵, 마카롱, 라떼 등), 주소 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 shrink-0 w-full sm:w-auto"
          >
            <option value="popularity">인지도 순</option>
            <option value="distance1">1호점 가까운 순</option>
            <option value="distance2">2호점 가까운 순</option>
            <option value="rating">네이버 평점 높은 순</option>
            <option value="reviews">리뷰 많은 순</option>
            <option value="drink_price">음료 가격 낮은 순</option>
            <option value="dessert_price">디저트 가격 낮은 순</option>
          </select>
        </div>
      </div>

      {/* 5. 뷰 모드별 렌더링 */}

      {/* 모드 1: 음료류/디저트류/세트류 3대 카테고리 가격 비교 차트 */}
      {viewMode === 'chart' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-700" />
                <span>은달 카페 vs 주변 경쟁사 카테고리별 평균 가격 비교</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                음료류(20종), 디저트류(20종), 세트류(10종) 각각의 평균 가격 경쟁력을 비교 분석합니다.
              </p>
            </div>

            {/* 카테고리 탭 (음료 / 디저트 / 세트) */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
              <button
                onClick={() => setChartCategory('drink')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  chartCategory === 'drink' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>음료류 평균</span>
              </button>
              <button
                onClick={() => setChartCategory('dessert')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  chartCategory === 'dessert' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Cake className="w-3.5 h-3.5" />
                <span>디저트류 평균</span>
              </button>
              <button
                onClick={() => setChartCategory('set')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  chartCategory === 'set' ? 'bg-purple-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>세트/단체구성 평균</span>
              </button>
            </div>
          </div>

          {/* 은달 기준선 바 */}
          <div className="p-3.5 bg-stone-900 text-white rounded-2xl flex items-center justify-between font-black text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px]">기준점</span>
              <span>
                ★ 은달 카페 (
                {chartCategory === 'drink' ? '음료 평균 3,200원' : chartCategory === 'dessert' ? '디저트 평균 3,100원' : '추천세트 평균 7,500원'}
                )
              </span>
            </div>
            <div className="text-amber-300 text-sm font-bold">
              {chartCategory === 'drink'
                ? eundalBenchmark.avgDrinkPrice.toLocaleString()
                : chartCategory === 'dessert'
                ? eundalBenchmark.avgDessertPrice.toLocaleString()
                : eundalBenchmark.avgSetPrice.toLocaleString()}원
            </div>
          </div>

          {/* 경쟁사별 바 */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCompetitors.map((comp) => {
              const compPrice = chartCategory === 'drink'
                ? (comp.avg_drink_price || comp.avg_coffee_price || 4200)
                : chartCategory === 'dessert'
                ? (comp.avg_dessert_price || 4500)
                : (comp.avg_set_price || 8500);

              const benchmarkPrice = chartCategory === 'drink'
                ? eundalBenchmark.avgDrinkPrice
                : chartCategory === 'dessert'
                ? eundalBenchmark.avgDessertPrice
                : eundalBenchmark.avgSetPrice;

              const diff = compPrice - benchmarkPrice;
              const maxScale = chartCategory === 'set' ? 16000 : 8000;
              const barWidth = Math.min(100, Math.round((compPrice / maxScale) * 100));

              return (
                <div key={comp.id} className="p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors border border-stone-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-stone-900 truncate">{comp.name}</span>
                      <span className="text-[10px] text-stone-500 shrink-0">
                        ({comp.brand_type === 'small_coffee' ? '소규모' : comp.brand_type === 'dessert_cafe' ? '디저트' : '스페셜티'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-stone-800">{compPrice.toLocaleString()}원</span>
                      {diff > 0 ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          +{diff.toLocaleString()}원 ({Math.round((diff / benchmarkPrice) * 100)}% 高)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {diff.toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        chartCategory === 'drink' ? 'bg-amber-700' : chartCategory === 'dessert' ? 'bg-rose-600' : 'bg-purple-700'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 모드 2: 인지도 포지셔닝 매트릭스 (22곳 대폭 확장 비교) */}
      {viewMode === 'matrix' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-700" />
              <span>네이버 플레이스 인지도 포지셔닝 매트릭스 (평점 vs 리뷰 댓글수)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              상권 내 대중적 인기(리뷰 댓글수)와 고객 만족도(평점)를 기준으로 22개 매장을 4개 영역으로 분류합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 핫플레이스 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                <span className="font-bold text-xs text-amber-950">🏆 상권 핫플레이스 (리뷰 1,000+ & 평점 4.65+)</span>
                <span className="text-[10px] text-amber-800 font-bold">브랜드 파워</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {competitors
                  .filter((c) => c.review_count >= 1000 && Number(c.rating) >= 4.65)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 truncate">{c.name}</span>
                      <div className="text-[11px] text-stone-600 shrink-0 font-medium">
                        <span className="text-amber-700 font-bold">★ {c.rating}</span> · 리뷰 {c.review_count}개
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 숨은 로컬 명소 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                <span className="font-bold text-xs text-emerald-950">💎 숨은 로컬 명소 (평점 4.70+ & 단골 중심)</span>
                <span className="text-[10px] text-emerald-800 font-bold">만족도 최우수</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {competitors
                  .filter((c) => Number(c.rating) >= 4.70 && c.review_count < 1000)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 truncate">{c.name}</span>
                      <div className="text-[11px] text-stone-600 shrink-0 font-medium">
                        <span className="text-emerald-700 font-bold">★ {c.rating}</span> · 리뷰 {c.review_count}개
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 대중적 생활밀착 카페 */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
                <span className="font-bold text-xs text-blue-950">☕ 대중적 생활밀착 카페 (리뷰 500+)</span>
                <span className="text-[10px] text-blue-800 font-bold">생활권 밀착</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {competitors
                  .filter((c) => c.review_count >= 500 && Number(c.rating) < 4.70)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 truncate">{c.name}</span>
                      <div className="text-[11px] text-stone-600 shrink-0 font-medium">
                        <span className="text-stone-700 font-bold">★ {c.rating}</span> · 리뷰 {c.review_count}개
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 소규모 골목 커피점 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                <span className="font-bold text-xs text-stone-800">🌱 소규모 골목 커피점 (은달 유사규모)</span>
                <span className="text-[10px] text-stone-500 font-bold">동네 단골</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {competitors
                  .filter((c) => c.review_count < 500 && Number(c.rating) < 4.70)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 truncate">{c.name}</span>
                      <div className="text-[11px] text-stone-600 shrink-0 font-medium">
                        <span className="text-stone-700 font-bold">★ {c.rating}</span> · 리뷰 {c.review_count}개
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모드 3: 상세 카드 뷰 */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-16 rounded-3xl border border-stone-200 text-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
              <p className="text-xs">주변 5km 경쟁사 및 메뉴 정보를 불러오는 중입니다...</p>
            </div>
          ) : filteredCompetitors.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-stone-200 text-center text-stone-500">
              <p className="text-sm font-bold text-stone-700">해당 조건의 경쟁사가 없습니다.</p>
              <p className="text-xs text-stone-400 mt-1">상단의 필터를 조정하거나 '신규 경쟁사 등록'을 진행해주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompetitors.map((comp) => {
                const drinkMenus = (comp.menus || []).filter((m) => m.category === 'drink' || m.category === 'coffee');
                const dessertMenus = (comp.menus || []).filter((m) => m.category === 'dessert');
                const setMenus = (comp.menus || []).filter((m) => m.category === 'set');

                return (
                  <div
                    key={comp.id}
                    className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all space-y-4"
                  >
                    <div className="space-y-3.5">
                      {/* 상단 썸네일 & 기본 프로필 */}
                      <div className="flex gap-3.5">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                          <CompetitorImage
                            src={comp.image_url}
                            alt={comp.name}
                            className="w-full h-full"
                            showBadge={true}
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-bold text-base text-stone-900 truncate">{comp.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              comp.brand_type === 'small_coffee'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : comp.brand_type === 'dessert_cafe'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}>
                              {comp.brand_type === 'small_coffee' ? '소규모 커피점' : comp.brand_type === 'dessert_cafe' ? '디저트 카페' : '스페셜티'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-amber-200/60">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{comp.rating}</span>
                            </span>

                            <span className="text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                              <MessageSquare className="w-2.5 h-2.5 text-stone-500" />
                              <span>리뷰 {comp.review_count.toLocaleString()}</span>
                            </span>

                            {comp.naver_place_url && (
                              <a
                                href={comp.naver_place_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 underline ml-auto"
                              >
                                <span>네이버 플레이스</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* 은달 1호점 / 2호점 거리 뱃지 */}
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-900 text-amber-300 font-bold flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>1호점(조원) {comp.distance_store1}km</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 font-bold flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>2호점(파장) {comp.distance_store2}km</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 주소 및 설명 */}
                      <div className="p-2.5 bg-stone-50 rounded-2xl text-xs text-stone-600 space-y-1 border border-stone-100">
                        <p className="font-semibold text-stone-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate">{comp.address} {comp.address_detail}</span>
                        </p>
                        {comp.description && (
                          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                            {comp.description}
                          </p>
                        )}
                      </div>

                      {/* 3대 카테고리별 평균 가격 요약 바 (원클릭 카테고리 전환 가능) */}
                      <div className="grid grid-cols-3 gap-2 p-2 bg-stone-50/70 rounded-xl border border-stone-200 text-center text-xs">
                        <button
                          type="button"
                          onClick={() => setCompMenuCategoryTab(prev => ({ ...prev, [comp.id]: 'drink' }))}
                          className="hover:bg-amber-100/50 p-1 rounded-lg transition-colors text-center"
                          title="클릭 시 커피·음료 메뉴 목록으로 전환"
                        >
                          <span className="text-[10px] text-stone-500 block">☕ 음료 평균</span>
                          <span className="font-bold text-stone-900">{(comp.avg_drink_price || comp.avg_coffee_price || 3800).toLocaleString()}원</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompMenuCategoryTab(prev => ({ ...prev, [comp.id]: 'dessert' }))}
                          className="border-x border-stone-200 hover:bg-rose-100/50 p-1 rounded-lg transition-colors text-center"
                          title="클릭 시 디저트 메뉴 목록으로 전환"
                        >
                          <span className="text-[10px] text-stone-500 block">🍰 디저트 평균</span>
                          <span className="font-bold text-stone-900">{(comp.avg_dessert_price || 3500).toLocaleString()}원</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompMenuCategoryTab(prev => ({ ...prev, [comp.id]: 'set' }))}
                          className="hover:bg-purple-100/50 p-1 rounded-lg transition-colors text-center"
                          title="클릭 시 세트 메뉴 목록으로 전환"
                        >
                          <span className="text-[10px] text-stone-500 block">🎁 세트 평균</span>
                          <span className="font-bold text-stone-900">{(comp.avg_set_price || 7500).toLocaleString()}원</span>
                        </button>
                      </div>

                      {/* 메뉴 리스트 (스크롤바 구성 및 커피/디저트/세트 버튼 구분 비교) */}
                      <div className="space-y-2">
                        {/* 카테고리 필터 버튼 탭 */}
                        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto no-scrollbar">
                          {(() => {
                            const currentTab = compMenuCategoryTab[comp.id] || 'all';
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setCompMenuCategoryTab(prev => ({ ...prev, [comp.id]: 'all' }))}
                                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all shrink-0 ${
                                    currentTab === 'all'
                                      ? 'bg-stone-900 text-white shadow-2xs'
                                      : 'text-stone-600 hover:text-stone-900'
                                  }`}
                                >
                                  전체 ({(comp.menus || []).length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCompMenuCategoryTab(prev => ({ ...prev, [comp.id]: 'drink' }))}
                                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                                    currentTab === 'drink'
                                      ? 'bg-amber-600 text-white shadow-2xs'
                                      : 'text-stone-600 hover:text-amber-800'
                                  }`}
                                >
                                  <Coffee className="w-3 h-3" />
                                  <span>음료 ({drinkMenus.length})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCompMenuCategoryTab(prev => ({ ...prev, [comp.id]: 'dessert' }))}
                                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                                    currentTab === 'dessert'
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : 'text-stone-600 hover:text-rose-800'
                                  }`}
                                >
                                  <Cake className="w-3 h-3" />
                                  <span>디저트 ({dessertMenus.length})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCompMenuCategoryTab(prev => ({ ...prev, [comp.id]: 'set' }))}
                                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                                    currentTab === 'set'
                                      ? 'bg-purple-600 text-white shadow-2xs'
                                      : 'text-stone-600 hover:text-purple-800'
                                  }`}
                                >
                                  <Package className="w-3 h-3" />
                                  <span>세트 ({setMenus.length})</span>
                                </button>
                              </>
                            );
                          })()}
                        </div>

                        {/* 스크롤바가 적용된 메뉴 리스트 */}
                        {(() => {
                          const currentTab = compMenuCategoryTab[comp.id] || 'all';
                          const filteredMenuList = (comp.menus || []).filter((m) => {
                            if (currentTab === 'drink') return m.category === 'drink' || m.category === 'coffee';
                            if (currentTab === 'dessert') return m.category === 'dessert';
                            if (currentTab === 'set') return m.category === 'set';
                            return true;
                          });

                          return filteredMenuList.length > 0 ? (
                            <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 overflow-hidden bg-white text-xs max-h-52 sm:max-h-60 overflow-y-auto pr-0.5">
                              {filteredMenuList.map((m) => (
                                <div key={m.id} className="p-2 px-3 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                      m.category === 'drink' || m.category === 'coffee'
                                        ? 'bg-amber-100 text-amber-800'
                                        : m.category === 'dessert'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}>
                                      {m.category === 'drink' || m.category === 'coffee' ? '음료' : m.category === 'dessert' ? '디저트' : '세트'}
                                    </span>
                                    <span className="font-bold text-stone-900 truncate">{m.name}</span>
                                    {m.is_signature && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-stone-950 text-[8.5px] font-black shrink-0">
                                        시그니처
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-stone-900 shrink-0 ml-2">{m.price.toLocaleString()}원</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-[11px] text-stone-400 bg-stone-50 rounded-xl border border-stone-200/60">
                              {currentTab === 'all'
                                ? (comp.representative_menu || '등록된 메뉴가 없습니다.')
                                : '해당 카테고리에 등록된 메뉴가 없습니다.'}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 하단 액션 버튼 바 */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setMapTarget(comp)}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>위치 지도 확인</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(comp)}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => handleDelete(comp)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. 신규 경쟁사 등록 & 수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 text-xs max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-700" />
                <span>{editingComp ? `'${editingComp.name}' 정보 수정` : '신규 경쟁사 등록 (소규모/디저트/스페셜티)'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
                  {formError}
                </div>
              )}

              {/* [네이버 플레이스 상호명 자동 검색 섹션 - 다중 폴백 적용] */}
              {!editingComp && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-[#03C75A] text-white text-[10px] font-black flex items-center justify-center">N</span>
                      <span>네이버 플레이스 상호명 자동 검색</span>
                    </span>
                    <span className="text-[10.5px] text-emerald-800 font-semibold">
                      검색 시 정보 자동 완성
                    </span>
                  </div>

                  <form onSubmit={handleSearchPlace} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="상호명을 입력하세요 (예: 조원동 커피, 골목커피, 디저트, 킵댓...)"
                      value={searchPlaceQuery}
                      onChange={(e) => setSearchPlaceQuery(e.target.value)}
                      className="flex-1 p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                    />
                    <button
                      type="submit"
                      disabled={searchingPlace}
                      className="px-4 py-2.5 bg-[#03C75A] hover:bg-[#02b150] text-white font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{searchingPlace ? '검색 중...' : '플레이스 검색'}</span>
                    </button>
                  </form>

                  {/* 검색 결과 목록 */}
                  {placeSearchResults.length > 0 && (
                    <div className="p-2 bg-white rounded-xl border border-emerald-200 space-y-1.5 max-h-48 overflow-y-auto">
                      <p className="text-[10px] text-stone-500 font-medium px-1">
                        검색된 매장을 클릭하면 아래 폼에 정보가 자동 채워집니다:
                      </p>
                      {placeSearchResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSearchResult(item)}
                          className="p-2 rounded-lg hover:bg-emerald-50 cursor-pointer border border-transparent hover:border-emerald-200 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900 text-xs truncate">{item.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 text-[9.5px] font-bold">
                                {item.category || '로컬 카페'}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">{item.address}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10.5px] font-bold text-amber-800">
                              1호점 {item.distance_store1}km · 2호점 {item.distance_store2}km
                            </span>
                            <div className="text-[10px] text-stone-400">
                              ★ {item.rating} (리뷰 {item.review_count}개)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 기본 폼 필드 */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-stone-700 font-bold mb-1">상호명 (필수)</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="예: 조원동 커피창고"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">카페 규모/유형</label>
                    <select
                      value={form.brand_type}
                      onChange={(e) => setForm({ ...form, brand_type: e.target.value as any })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                    >
                      <option value="small_coffee">소규모 커피점 (은달 유사규모)</option>
                      <option value="dessert_cafe">디저트 카페 (구움과자/케이크)</option>
                      <option value="specialty">스페셜티 카페</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">도로명 주소 (필수)</label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="경기 수원시 장안구 조원로 28"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">상세 주소 (선택)</label>
                    <input
                      type="text"
                      value={form.address_detail}
                      onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
                      placeholder="1층 102호"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* 카테고리별 평균 가격 입력창 */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-800 text-xs block">카테고리별 평균 가격대 설정</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">☕ 음료류 평균</label>
                      <input
                        type="number"
                        step="100"
                        value={form.avg_drink_price}
                        onChange={(e) => setForm({ ...form, avg_drink_price: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">🍰 디저트류 평균</label>
                      <input
                        type="number"
                        step="100"
                        value={form.avg_dessert_price}
                        onChange={(e) => setForm({ ...form, avg_dessert_price: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">🎁 세트류 평균</label>
                      <input
                        type="number"
                        step="100"
                        value={form.avg_set_price}
                        onChange={(e) => setForm({ ...form, avg_set_price: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 메뉴 상세 등록 (음료 최대 20개 / 디저트 최대 20개 / 세트 최대 20개 탭) */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-stone-800 text-xs">
                      메뉴 등록 (음료 최대 20개 / 디저트 최대 20개 / 세트 최대 20개)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddMenuRow(menuFormTab)}
                      className="px-2.5 py-1 rounded-xl bg-stone-900 text-white font-bold text-[10.5px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>{menuFormTab === 'drink' ? '음료' : menuFormTab === 'dessert' ? '디저트' : '세트'} 메뉴 추가</span>
                    </button>
                  </div>

                  {/* 메뉴 카테고리 전환 탭 */}
                  <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMenuFormTab('drink')}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        menuFormTab === 'drink' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      음료류 ({form.menus.filter((m) => m.category === 'drink').length}/20)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuFormTab('dessert')}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        menuFormTab === 'dessert' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      디저트류 ({form.menus.filter((m) => m.category === 'dessert').length}/20)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuFormTab('set')}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        menuFormTab === 'set' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      세트류 ({form.menus.filter((m) => m.category === 'set').length}/20)
                    </button>
                  </div>

                  {/* 메뉴 행 목록 */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {form.menus
                      .map((m, idx) => ({ ...m, originalIndex: idx }))
                      .filter((m) => m.category === menuFormTab)
                      .map((m) => (
                        <div key={m.originalIndex} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-stone-200">
                          <input
                            type="text"
                            placeholder="메뉴명"
                            value={m.name}
                            onChange={(e) => {
                              const next = [...form.menus];
                              next[m.originalIndex].name = e.target.value;
                              setForm({ ...form, menus: next });
                            }}
                            className="flex-1 p-1.5 border border-stone-200 rounded-lg text-xs font-bold"
                          />
                          <input
                            type="number"
                            step="100"
                            placeholder="가격"
                            value={m.price}
                            onChange={(e) => {
                              const next = [...form.menus];
                              next[m.originalIndex].price = parseInt(e.target.value, 10) || 0;
                              setForm({ ...form, menus: next });
                            }}
                            className="w-24 p-1.5 border border-stone-200 rounded-lg text-xs font-mono text-right"
                          />
                          <span className="text-xs text-stone-500">원</span>

                          <label className="flex items-center gap-1 text-[11px] font-bold text-amber-900 cursor-pointer ml-1">
                            <input
                              type="checkbox"
                              checked={m.is_signature}
                              onChange={(e) => {
                                const next = [...form.menus];
                                next[m.originalIndex].is_signature = e.target.checked;
                                setForm({ ...form, menus: next });
                              }}
                              className="rounded border-stone-300 text-amber-600"
                            />
                            <span>시그니처</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveMenuRow(m.originalIndex)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    {form.menus.filter((m) => m.category === menuFormTab).length === 0 && (
                      <p className="text-center text-[11px] text-stone-400 py-3">
                        등록된 메뉴가 없습니다. 우측 상단의 추가 버튼을 눌러주세요.
                      </p>
                    )}
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
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>{saving ? '저장 중...' : '경쟁사 정보 저장'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 7. 위치 지도 확인 팝업 */}
      {mapTarget && (
        <MiniMapPopup
          isOpen={Boolean(mapTarget)}
          onClose={() => setMapTarget(null)}
          title={`${mapTarget.name} 위치 지도`}
          storeName={mapTarget.name}
          address={mapTarget.address}
          detailAddress={mapTarget.address_detail}
          naverPlaceUrl={mapTarget.naver_place_url}
          naverPlaceId={mapTarget.naver_place_id}
          latitude={mapTarget.latitude}
          longitude={mapTarget.longitude}
          phone={mapTarget.phone}
          distanceLabel={`은달 1호점 ${mapTarget.distance_store1}km · 2호점 ${mapTarget.distance_store2}km`}
        />
      )}
    </div>
  );
}
