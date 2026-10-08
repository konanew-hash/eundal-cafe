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
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Navigation,
  BarChart3,
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
  Info,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { Competitor, CompetitorMenu } from '@/lib/types';
import MiniMapPopup from '@/components/MiniMapPopup';
import CompetitorImage from '@/components/CompetitorImage';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS } from '@/lib/geoUtils';

export default function AdminCompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [eundalBenchmark, setEundalBenchmark] = useState({
    americanoPrice: 2500,
    lattePrice: 3500,
    store1: EUNDAL_STORE1_COORDS,
    store2: EUNDAL_STORE2_COORDS,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 뷰 모드: 'cards' | 'chart' | 'matrix'
  const [viewMode, setViewMode] = useState<'cards' | 'chart' | 'matrix'>('cards');

  // 필터 및 검색 상태
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'store1' | 'store2'>('all');
  const [sortBy, setSortBy] = useState<'distance1' | 'distance2' | 'rating' | 'reviews' | 'price' | 'popularity'>('popularity');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 지도 팝업 상태 (기존 픽업 매장관리와 동일 연동)
  const [mapTarget, setMapTarget] = useState<Competitor | null>(null);

  // 등록/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competitor | null>(null);

  // 네이버 플레이스 검색 상태
  const [searchPlaceQuery, setSearchPlaceQuery] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [placeSearchResults, setPlaceSearchResults] = useState<any[]>([]);

  // 폼 상태
  const [form, setForm] = useState({
    name: '',
    brand_type: 'independent',
    target_branch: 'both' as 'store1' | 'store2' | 'both',
    address: '',
    address_detail: '',
    phone: '',
    latitude: '' as string | number,
    longitude: '' as string | number,
    naver_place_id: '',
    naver_place_url: '',
    rating: 4.5,
    review_count: 0,
    blog_review_count: 0,
    image_url: '',
    description: '',
    representative_menu: '',
    avg_coffee_price: 4500,
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

  // 3. 통계 계산 (KPI 대시보드)
  const stats = useMemo(() => {
    if (competitors.length === 0) {
      return {
        count: 0,
        avgPrice: 4500,
        priceDiff: 2000,
        diffPercent: 44,
        avgRating: 4.6,
        totalReviews: 0,
      };
    }

    const prices = competitors.map((c) => c.avg_coffee_price || 4500).filter((p) => p > 0);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const priceDiff = avgPrice - eundalBenchmark.americanoPrice;
    const diffPercent = Math.round((priceDiff / avgPrice) * 100);

    const ratings = competitors.map((c) => Number(c.rating) || 4.5);
    const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);

    const totalReviews = competitors.reduce((acc, c) => acc + (c.review_count || 0), 0);

    return {
      count: competitors.length,
      avgPrice,
      priceDiff,
      diffPercent,
      avgRating,
      totalReviews,
    };
  }, [competitors, eundalBenchmark]);

  // 4. 필터링 및 정렬된 목록
  const filteredCompetitors = useMemo(() => {
    return competitors
      .filter((c) => {
        // 상권 필터
        if (selectedBranch === 'store1' && c.distance_store1 > 5.0 && c.target_branch === 'store2') return false;
        if (selectedBranch === 'store2' && c.distance_store2 > 5.0 && c.target_branch === 'store1') return false;

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
        if (sortBy === 'price') return a.avg_coffee_price - b.avg_coffee_price;
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      });
  }, [competitors, selectedBranch, sortBy, searchKeyword]);

  // 5. 신규 모달 열기
  const openAddModal = () => {
    setEditingComp(null);
    setSearchPlaceQuery('');
    setPlaceSearchResults([]);
    setForm({
      name: '',
      brand_type: 'independent',
      target_branch: 'both',
      address: '',
      address_detail: '',
      phone: '',
      latitude: '',
      longitude: '',
      naver_place_id: '',
      naver_place_url: '',
      rating: 4.5,
      review_count: 300,
      blog_review_count: 100,
      image_url: '',
      description: '',
      representative_menu: '아메리카노, 카페라떼, 디저트',
      avg_coffee_price: 4500,
      menus: [
        { name: '아메리카노', category: 'coffee', price: 4500, is_signature: false },
        { name: '카페라떼', category: 'coffee', price: 5000, is_signature: false },
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
      brand_type: comp.brand_type || 'independent',
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
      avg_coffee_price: comp.avg_coffee_price || 4500,
      menus: (comp.menus && comp.menus.length > 0)
        ? comp.menus.map((m) => ({
            name: m.name,
            category: m.category,
            price: m.price,
            is_signature: m.is_signature,
          }))
        : [
            { name: '아메리카노', category: 'coffee', price: comp.avg_coffee_price || 4500, is_signature: false },
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
      if (data.items) {
        setPlaceSearchResults(data.items);
      }
    } catch {
      alert('네이버 플레이스 검색 중 오류가 발생했습니다.');
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
      address: item.roadAddress || item.address,
      phone: item.phone || prev.phone,
      latitude: item.latitude,
      longitude: item.longitude,
      naver_place_id: item.naver_place_id,
      naver_place_url: item.naver_place_url,
      rating: item.rating || 4.5,
      review_count: item.review_count || 200,
      blog_review_count: item.blog_review_count || 50,
      representative_menu: item.representative_menu || prev.representative_menu,
      avg_coffee_price: item.avg_coffee_price || 4500,
      target_branch: item.distance_store1 <= item.distance_store2 ? 'store1' : 'store2',
    }));

    setPlaceSearchResults([]);
  };

  // 메뉴 행 추가
  const handleAddMenuRow = () => {
    setForm((prev) => ({
      ...prev,
      menus: [...prev.menus, { name: '', category: 'coffee', price: 4500, is_signature: false }],
    }));
  };

  // 메뉴 행 삭제
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
        // 수정
        const res = await fetch(`/api/admin/competitors/${editingComp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('수정 실패');
      } else {
        // 신규 등록
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
    <div className="space-y-6 max-w-7xl pb-12">
      {/* 1. 상단 글로벌 헤더 & 액션 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
              <TrendingUp className="w-5 h-5 text-amber-800" />
            </span>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              주변 카페 제품 및 가격 비교 분석
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              반경 5km 로컬 상권
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            은달 1호점(조원) 및 2호점(파장) 인근 5km 내 로컬 독립 스페셜티 카페의 메뉴, 가격, 평점, 댓글수를 실시간 분석합니다.
            <span className="text-amber-700 font-medium ml-1.5">* 프랜차이즈 체인점은 자동 제외됩니다.</span>
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

      {/* 2. 대시보드 KPI 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: 주변 5km 로컬 경쟁사 수 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-medium">분석 대상 로컬 카페</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {stats.count} <span className="text-sm font-semibold text-stone-500">개소</span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium">
            체인점 제외 · 1호/2호점 5km 이내
          </p>
        </div>

        {/* KPI 2: 아메리카노 가격 비교 (핵심 가치 제안) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-900 text-xs">
            <span className="font-bold">은달 아메리카노 가격 경쟁력</span>
            <Coffee className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">
            {stats.diffPercent}% <span className="text-sm font-semibold text-emerald-700">더 저렴!</span>
          </div>
          <p className="text-[11px] text-stone-600">
            은달 <strong>{eundalBenchmark.americanoPrice.toLocaleString()}원</strong> vs 주변평균 <strong>{stats.avgPrice.toLocaleString()}원</strong>
          </p>
        </div>

        {/* KPI 3: 평균 네이버 평점 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-medium">주변 카페 평균 평점</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            ★ {stats.avgRating} <span className="text-sm font-semibold text-stone-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium">
            네이버 플레이스 방문자 평점 기준
          </p>
        </div>

        {/* KPI 4: 누적 리뷰수 (인지도 총량) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-medium">상권 내 총 리뷰수</span>
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {stats.totalReviews.toLocaleString()} <span className="text-sm font-semibold text-stone-500">건</span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium">
            방문자 리뷰 및 영수증 인증 댓글
          </p>
        </div>
      </div>

      {/* 3. 5km 상권 레이더 맵 (픽업 매장관리 지도 기술 연동) */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>은달 5km 상권 레이더 맵 & 경쟁사 위치 분포</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              은달 1호점(조원동)과 2호점(파장동)을 기점으로 반경 5km 이내의 경쟁사 위치를 실시간 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]">
              ● 은달 매장 (1·2호점)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900 text-white font-bold text-[10px]">
              ● 로컬 경쟁사
            </span>
          </div>
        </div>

        {/* 인터랙티브 상권 타일맵 (오픈스트리트맵 타일 + 바운딩 박스) */}
        <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=126.9750,37.2750,127.0450,37.3350&layer=mapnik&marker=${EUNDAL_STORE1_COORDS.lat},${EUNDAL_STORE1_COORDS.lng}`}
            title="은달 5km 상권 레이더 지도"
            className="w-full h-full border-0"
            loading="lazy"
          />

          {/* 지도 위 상권 오버레이 핀 리스트 안내 */}
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 shadow-lg flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-stone-800">빠른 위치 확인:</span>
              <button
                type="button"
                onClick={() =>
                  setMapTarget({
                    id: 'store1',
                    name: '은달 1호점(조원)',
                    address: EUNDAL_STORE1_COORDS.name,
                    latitude: EUNDAL_STORE1_COORDS.lat,
                    longitude: EUNDAL_STORE1_COORDS.lng,
                    naver_place_id: '1245444726',
                    naver_place_url: 'https://m.place.naver.com/restaurant/1245444726/home',
                  } as any)
                }
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-[11px] hover:brightness-110 flex items-center gap-1 shadow-2xs"
              >
                <MapPin className="w-3 h-3" />
                <span>은달 1호점</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setMapTarget({
                    id: 'store2',
                    name: '은달 2호점(파장)',
                    address: EUNDAL_STORE2_COORDS.name,
                    latitude: EUNDAL_STORE2_COORDS.lat,
                    longitude: EUNDAL_STORE2_COORDS.lng,
                    naver_place_id: '1869537461',
                    naver_place_url: 'https://m.place.naver.com/restaurant/1869537461/home',
                  } as any)
                }
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-[11px] hover:brightness-110 flex items-center gap-1 shadow-2xs"
              >
                <MapPin className="w-3 h-3" />
                <span>은달 2호점</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
              {competitors.slice(0, 5).map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setMapTarget(comp)}
                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[10.5px] border border-stone-200 flex items-center gap-1 transition-colors"
                >
                  <Navigation className="w-2.5 h-2.5 text-stone-500" />
                  <span>{comp.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 컨트롤 바 (상권 필터 / 뷰 모드 전환 / 검색창 / 정렬) */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 상권 탭 */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setSelectedBranch('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedBranch === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              전체 5km 상권 ({competitors.length})
            </button>
            <button
              onClick={() => setSelectedBranch('store1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedBranch === 'store1'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              1호점(조원) 인근
            </button>
            <button
              onClick={() => setSelectedBranch('store2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedBranch === 'store2'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              2호점(파장) 인근
            </button>
          </div>

          {/* 뷰 모드 전환: 카드 뷰 / 가격 비교 차트 / 인지도 매트릭스 */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>상세 카드</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'chart'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>가격 비교 차트</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>인지도 포지셔닝 맵</span>
            </button>
          </div>
        </div>

        {/* 검색 및 정렬 드롭다운 */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-stone-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="상호명, 대표 메뉴(예: 아메리카노, 소금빵), 주소 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] text-stone-500 font-medium shrink-0">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 w-full sm:w-auto"
            >
              <option value="popularity">인지도 지수 순</option>
              <option value="distance1">1호점(조원) 가까운 순</option>
              <option value="distance2">2호점(파장) 가까운 순</option>
              <option value="rating">네이버 평점 높은 순</option>
              <option value="reviews">리뷰수(댓글) 많은 순</option>
              <option value="price">커피 가격 낮은 순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. 뷰 모드별 렌더링 */}

      {/* 모드 1: 가격 비교 차트 뷰 */}
      {viewMode === 'chart' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-700" />
              <span>은달 카페 vs 주변 5km 경쟁사 아메리카노 가격 비교 막대 차트</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              은달 카페(2,500원) 대비 각 로컬 경쟁사의 가격 차이와 가성비 경쟁력을 시각화합니다.
            </p>
          </div>

          {/* 차트 영역 */}
          <div className="space-y-3">
            {/* 은달 기준선 바 */}
            <div className="p-3 bg-amber-500 text-stone-950 rounded-2xl flex items-center justify-between font-black text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-stone-950 text-amber-300 text-[10px]">기준점</span>
                <span>★ 은달 카페 (1호점·2호점 공통)</span>
              </div>
              <div className="text-sm">
                {eundalBenchmark.americanoPrice.toLocaleString()}원
              </div>
            </div>

            {/* 경쟁사별 바 */}
            <div className="space-y-2 pt-2">
              {filteredCompetitors.map((comp) => {
                const compPrice = comp.avg_coffee_price || 4500;
                const diff = compPrice - eundalBenchmark.americanoPrice;
                const maxPrice = 7000;
                const barWidth = Math.min(100, Math.round((compPrice / maxPrice) * 100));

                return (
                  <div key={comp.id} className="p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors border border-stone-200/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{comp.name}</span>
                        <span className="text-[10px] text-stone-500">
                          (1호점 {comp.distance_store1}km · 2호점 {comp.distance_store2}km)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800">{compPrice.toLocaleString()}원</span>
                        <span className="text-[10.5px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          +{diff.toLocaleString()}원 ({Math.round((diff / eundalBenchmark.americanoPrice) * 100)}% 비쌈)
                        </span>
                      </div>
                    </div>

                    {/* 시각화 진행 바 */}
                    <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-stone-800 h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 모드 2: 인지도 포지셔닝 맵 (평점 vs 리뷰수 사분면) */}
      {viewMode === 'matrix' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-700" />
              <span>네이버 플레이스 인지도 포지셔닝 매트릭스 (평점 vs 리뷰수)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              상권 내 대중적 인기(리뷰 댓글수)와 고객 만족도(평점)를 기준으로 경쟁사를 4개 영역으로 분류합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 사분면 1: 최고 인기 & 고만족도 핫플레이스 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1">
                  <span>🏆</span> 상권 핫플레이스 (리뷰 1,500+ & 평점 4.65+)
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">높은 브랜드 파워</span>
              </div>
              <div className="space-y-1.5">
                {competitors
                  .filter((c) => c.review_count >= 1500 && Number(c.rating) >= 4.65)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-2xs">
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5 font-medium">
                        <span className="text-amber-700 font-bold">★ {c.rating}</span>
                        <span>·</span>
                        <span>리뷰 {c.review_count.toLocaleString()}개</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 사분면 2: 숨은 로컬 명소 (높은 평점 & 단골 중심) */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/80">
                <span className="font-bold text-xs text-emerald-950 flex items-center gap-1">
                  <span>💎</span> 숨은 로컬 명소 (평점 4.70+ & 충성도 높음)
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold">품질/원두 우수</span>
              </div>
              <div className="space-y-1.5">
                {competitors
                  .filter((c) => Number(c.rating) >= 4.70 && c.review_count < 1500)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs shadow-2xs">
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5 font-medium">
                        <span className="text-emerald-700 font-bold">★ {c.rating}</span>
                        <span>·</span>
                        <span>리뷰 {c.review_count.toLocaleString()}개</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 사분면 3: 안정적 대중형 카페 */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/80">
                <span className="font-bold text-xs text-blue-950 flex items-center gap-1">
                  <span>☕</span> 대중적 생활밀착 카페 (리뷰 1,000+)
                </span>
                <span className="text-[10px] text-blue-800 font-semibold">산책/생활권</span>
              </div>
              <div className="space-y-1.5">
                {competitors
                  .filter((c) => c.review_count >= 1000 && Number(c.rating) < 4.65)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-blue-200 flex items-center justify-between text-xs shadow-2xs">
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5 font-medium">
                        <span className="text-stone-700 font-bold">★ {c.rating}</span>
                        <span>·</span>
                        <span>리뷰 {c.review_count.toLocaleString()}개</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 사분면 4: 신흥 골목 로스터리 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                <span className="font-bold text-xs text-stone-800 flex items-center gap-1">
                  <span>🌱</span> 골목 로스터리 & 신흥 카페
                </span>
                <span className="text-[10px] text-stone-500 font-semibold">근거리 동네상권</span>
              </div>
              <div className="space-y-1.5">
                {competitors
                  .filter((c) => c.review_count < 1000 && Number(c.rating) < 4.70)
                  .map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-xl border border-stone-200 flex items-center justify-between text-xs shadow-2xs">
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1.5 font-medium">
                        <span className="text-stone-700 font-bold">★ {c.rating}</span>
                        <span>·</span>
                        <span>리뷰 {c.review_count.toLocaleString()}개</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모드 3: 상세 카드 뷰 (기본) */}
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
              {filteredCompetitors.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* 상단 썸네일 & 기본 프로필 */}
                    <div className="flex gap-3.5">
                      {/* 저작권 보호 변조 썸네일 */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                        <CompetitorImage
                          src={comp.image_url}
                          alt={comp.name}
                          className="w-full h-full"
                          showBadge={true}
                        />
                      </div>

                      {/* 정보 영역 */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-bold text-base text-stone-900 truncate">{comp.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold shrink-0 border border-stone-200">
                            로컬 독립
                          </span>
                        </div>

                        {/* 네이버 플레이스 링크 & 평점/리뷰수 */}
                        <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-amber-200/60">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{comp.rating}</span>
                          </span>

                          <span className="text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 text-stone-500" />
                            <span>방문자 {comp.review_count.toLocaleString()}</span>
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
                    <div className="p-3 bg-stone-50 rounded-2xl text-xs text-stone-600 space-y-1 border border-stone-100">
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

                    {/* 노출 메뉴 및 가격 비교 테이블 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-stone-700 flex items-center gap-1">
                          <Coffee className="w-3.5 h-3.5 text-amber-700" />
                          <span>네이버 노출 메뉴 및 가격</span>
                        </span>
                        <span className="text-[10px] text-stone-400">
                          아메리카노 평균 {comp.avg_coffee_price.toLocaleString()}원
                        </span>
                      </div>

                      {comp.menus && comp.menus.length > 0 ? (
                        <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 overflow-hidden bg-white text-xs">
                          {comp.menus.map((m) => {
                            const isAmericano = m.name.includes('아메리카노');
                            const priceDiff = isAmericano ? m.price - eundalBenchmark.americanoPrice : null;

                            return (
                              <div key={m.id} className="p-2 px-3 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-bold text-stone-900 truncate">{m.name}</span>
                                  {m.is_signature && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black shrink-0">
                                      시그니처
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-bold text-stone-800">{m.price.toLocaleString()}원</span>
                                  {priceDiff !== null && (
                                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                                      + 은달보다 {priceDiff.toLocaleString()}원 高
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 p-2 bg-stone-50 rounded-lg">
                          대표 메뉴: {comp.representative_menu || '아메리카노, 라떼'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 하단 액션 버튼 바 */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setMapTarget(comp)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="픽업 매장관리와 동일한 미니 지도 팝업 확인"
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
              ))}
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
                <span>{editingComp ? `'${editingComp.name}' 정보 수정` : '신규 경쟁사 등록'}</span>
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

              {/* [네이버 플레이스 상호명 실시간 검색 섹션] */}
              {!editingComp && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-[#03C75A] text-white text-[10px] font-black flex items-center justify-center">N</span>
                      <span>네이버 플레이스 상호명 자동 검색</span>
                    </span>
                    <span className="text-[10.5px] text-emerald-800 font-semibold">
                      상호명 검색 시 정보 자동 완성
                    </span>
                  </div>

                  <form onSubmit={handleSearchPlace} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="상호명을 입력하세요 (예: 킵댓, 정지영커피, 카페 만석...)"
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
                        검색된 네이버 플레이스 매장 중 하나를 선택하세요 (클릭 시 폼 자동완성):
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
                              {item.isChain ? (
                                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9.5px] font-bold">
                                  체인점 감지(제외 권장)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-bold">
                                  로컬 카페
                                </span>
                              )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">상호명 (필수)</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="예: 정지영커피로스터즈 화홍문점"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">주요 상권 구분</label>
                    <select
                      value={form.target_branch}
                      onChange={(e) => setForm({ ...form, target_branch: e.target.value as any })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                    >
                      <option value="both">은달 1호점 & 2호점 공통 상권 (중간권역)</option>
                      <option value="store1">은달 1호점(조원동) 인근 상권</option>
                      <option value="store2">은달 2호점(파장동) 인근 상권</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">도로명 주소 (필수)</label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="경기 수원시 팔달구 수원천로 375"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">상세 주소 (선택)</label>
                    <input
                      type="text"
                      value={form.address_detail}
                      onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
                      placeholder="1~2층, 방화수류정 앞"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">매장 전화번호</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="031-247-0096"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* 위경도 좌표 및 네이버 플레이스 연동 */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 text-xs">지도 위치 좌표 & 네이버 플레이스</span>
                    <span className="text-[10px] text-stone-500">거리 자동 계산용</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">위도 (Lat)</label>
                      <input
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        placeholder="37.288214"
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">경도 (Lng)</label>
                      <input
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        placeholder="127.018952"
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">네이버 평점</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={form.rating}
                        onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">방문자 리뷰수</label>
                      <input
                        type="number"
                        min="0"
                        value={form.review_count}
                        onChange={(e) => setForm({ ...form, review_count: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">네이버 플레이스 링크 URL</label>
                    <input
                      type="url"
                      value={form.naver_place_url}
                      onChange={(e) => setForm({ ...form, naver_place_url: e.target.value })}
                      placeholder="https://m.place.naver.com/restaurant/..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* 이미지 URL & 저작권 변조 주의 안내 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-stone-700 font-bold">대표 썸네일 이미지 URL</label>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      ★ 저작권 보호 변조 필터 자동 적용됨
                    </span>
                  </div>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://... (비워둘 시 안전한 모노톤 일러스트가 자동 생성됩니다)"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                  />
                  <p className="text-[10.5px] text-stone-500 mt-1">
                    * 등록된 이미지는 저작권 공정이용 준수를 위해 썸네일 색조/명암/필터 변조 및 안내 워터마크가 적용되어 노출됩니다.
                  </p>
                </div>

                {/* 노출 메뉴 및 가격 설정 */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 text-xs">대표 메뉴 및 가격 리스트</span>
                    <button
                      type="button"
                      onClick={handleAddMenuRow}
                      className="px-2 py-1 rounded-lg bg-stone-900 text-white font-bold text-[10.5px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>메뉴 추가</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.menus.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-stone-200">
                        <input
                          type="text"
                          placeholder="메뉴명 (예: 아메리카노)"
                          value={m.name}
                          onChange={(e) => {
                            const next = [...form.menus];
                            next[idx].name = e.target.value;
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
                            next[idx].price = parseInt(e.target.value, 10) || 0;
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
                              next[idx].is_signature = e.target.checked;
                              setForm({ ...form, menus: next });
                            }}
                            className="rounded border-stone-300 text-amber-600"
                          />
                          <span>시그니처</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveMenuRow(idx)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
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

      {/* 7. 위치 지도 확인 팝업 (픽업 매장관리와 100% 동일한 MiniMapPopup 연동) */}
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
