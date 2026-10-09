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
  Table,
  LayoutGrid,
  ChevronsUpDown,
  Check,
  Info,
} from 'lucide-react';
import { Competitor, MenuSubcategory } from '@/lib/types';
import MiniMapPopup from '@/components/MiniMapPopup';
import CompetitorImage from '@/components/CompetitorImage';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS } from '@/lib/geoUtils';
import { SUBCATEGORIES, SubcategoryMeta, categorizeMenuDetailed } from '@/lib/competitorUtils';

export default function AdminCompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [eundalMenus, setEundalMenus] = useState<any[]>([]);
  const [eundalBenchmark, setEundalBenchmark] = useState<any>({
    americanoPrice: 3000,
    lattePrice: 4000,
    avgDrinkPrice: 5000,
    avgDessertPrice: 4400,
    avgSetPrice: 7500,
    subcategories: {
      coffee: 3800,
      juice: 5200,
      tea: 4600,
      dessert: 3500,
      sandwich: 6200,
      set: 7500,
    },
    store1: EUNDAL_STORE1_COORDS,
    store2: EUNDAL_STORE2_COORDS,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 뷰 모드: 'similarity' | 'radar' | 'cards' | 'chart' | 'matrix'
  const [viewMode, setViewMode] = useState<'similarity' | 'radar' | 'cards' | 'chart' | 'matrix'>('similarity');

  // 차트 비교 카테고리: 6대 세부분류 ('coffee' | 'juice' | 'tea' | 'dessert' | 'sandwich' | 'set')
  const [chartCategory, setChartCategory] = useState<MenuSubcategory>('coffee');

  // 유사도 비교 필터: 'all' | 6대 세부분류
  const [similarityCategoryFilter, setSimilarityCategoryFilter] = useState<'all' | MenuSubcategory>('all');
  const [similaritySearch, setSimilaritySearch] = useState('');
  const [similarityViewType, setSimilarityViewType] = useState<'table' | 'cards'>('table'); // 📋 요약 표 뷰 vs 📑 상세 카드 뷰
  const [similarityQuickChip, setSimilarityQuickChip] = useState<string>('all'); // 대표 메뉴 퀵 필터
  const [expandedMenuIds, setExpandedMenuIds] = useState<Record<string, boolean>>({}); // 표 뷰 아코디언 토글

  // 상권 레이더 (네이버 플레이스 5km 탐색 및 비교 등록 관리) 상태
  const [radarPlaces, setRadarPlaces] = useState<any[]>([]);
  const [radarSummary, setRadarSummary] = useState<any>(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarBranchFilter, setRadarBranchFilter] = useState<'all' | 'store1' | 'store2'>('all');
  const [radarStatusFilter, setRadarStatusFilter] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [radarSearch, setRadarSearch] = useState('');
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);
  const [quickAddInput, setQuickAddInput] = useState('');
  const [quickAddMessage, setQuickAddMessage] = useState('');

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
      if (data.eundalMenus) {
        setEundalMenus(data.eundalMenus);
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

  // 1-1. 상권 레이더 (네이버 플레이스 5km 카페 후보 목록 및 등록 여부) 로드
  const loadRadarPlaces = async () => {
    try {
      setRadarLoading(true);
      const params = new URLSearchParams({
        branch: radarBranchFilter,
        status: radarStatusFilter,
        search: radarSearch,
      });
      const res = await fetch(`/api/admin/competitors/radar?${params.toString()}`);
      const data = await res.json();
      if (data.places) {
        setRadarPlaces(data.places);
      }
      if (data.summary) {
        setRadarSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load radar places:', err);
    } finally {
      setRadarLoading(false);
    }
  };

  // 원터치 비교 분석에 추가 핸들러
  const handleQuickAdd = async (placeId: string, placeName?: string) => {
    if (!placeId) return;
    try {
      setQuickAddingId(placeId);
      setQuickAddMessage('');
      const res = await fetch('/api/admin/competitors/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naver_place_id: placeId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuickAddMessage(data.message || `'${placeName || placeId}'(이)가 성공적으로 비교 분석에 추가되었습니다.`);
        await Promise.all([loadData(), loadRadarPlaces()]);
      } else {
        alert(data.error || data.message || '원터치 추가 처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setQuickAddingId(null);
      setTimeout(() => setQuickAddMessage(''), 6000);
    }
  };

  // 직접 입력창을 통한 원터치 추가 핸들러
  const handleCustomQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddInput.trim()) return;
    await handleQuickAdd(quickAddInput.trim());
    setQuickAddInput('');
  };

  useEffect(() => {
    loadData();
    loadRadarPlaces();
  }, []);

  useEffect(() => {
    if (viewMode === 'radar') {
      loadRadarPlaces();
    }
  }, [radarBranchFilter, radarStatusFilter, radarSearch, viewMode]);

  // 메뉴명 텍스트 정규화 (공백, 괄호, 불용어 제거)
  const normalizeMenuName = (name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\{.*?\}/g, '')
      .replace(/수제|은달|시그니처|프리미엄|스페셜|유기농|클래식|오리지널|아이스|핫|ice|hot/gi, '');
  };

  // 2글자 묶음(Bigram) 기반 Jaccard 유사도 + 포함관계 가중치
  const calculateMenuSimilarity = (name1: string, name2: string): number => {
    const n1 = normalizeMenuName(name1);
    const n2 = normalizeMenuName(name2);

    if (!n1 || !n2) return 0;
    if (n1 === n2) return 1.0;

    // 한쪽이 다른 쪽에 완전히 포함되어 있고 길이 비율이 65% 이상인 경우
    if (n1.includes(n2) || n2.includes(n1)) {
      const minLen = Math.min(n1.length, n2.length);
      const maxLen = Math.max(n1.length, n2.length);
      const ratio = minLen / maxLen;
      if (minLen >= 3 && ratio >= 0.65) {
        return Math.max(0.85, Math.round(ratio * 100) / 100);
      }
    }

    // 2-gram (Bigram) 생성
    const getBigrams = (str: string) => {
      const set = new Set<string>();
      for (let i = 0; i < str.length - 1; i++) {
        set.add(str.slice(i, i + 2));
      }
      return set;
    };

    const b1 = getBigrams(n1);
    const b2 = getBigrams(n2);
    if (b1.size === 0 || b2.size === 0) return 0;

    let common = 0;
    b1.forEach((item) => {
      if (b2.has(item)) common++;
    });
    const union = b1.size + b2.size - common;
    const score = union > 0 ? common / union : 0;
    return Math.round(score * 100) / 100;
  };

  // 은달 메뉴 vs 주변 경쟁사 메뉴 1:1 유사도 (80% 이상) 비교 매칭 결과
  const similarMenuComparison = useMemo(() => {
    if (eundalMenus.length === 0 || competitors.length === 0) return [];

    // 모든 경쟁사 메뉴 수집
    const allCompMenus: Array<{
      competitorId: string;
      competitorName: string;
      brandType: string;
      distance1: number;
      distance2: number;
      name: string;
      price: number;
      category: string;
      subcategory?: string;
      naverPlaceId: string;
      naverPlaceUrl: string;
    }> = [];

    competitors.forEach((c) => {
      (c.menus || []).forEach((m) => {
        if (m.name && m.price > 0) {
          const { mainCategory, subcategory } = categorizeMenuDetailed(m.name, m.category);
          allCompMenus.push({
            competitorId: c.id,
            competitorName: c.name,
            brandType: c.brand_type || 'small_coffee',
            distance1: c.distance_store1,
            distance2: c.distance_store2,
            name: m.name,
            price: m.price,
            category: mainCategory,
            subcategory,
            naverPlaceId: c.naver_place_id || '',
            naverPlaceUrl: c.naver_place_url || '',
          });
        }
      });
    });

    return eundalMenus.map((eMenu) => {
      // 동일 경쟁사 내 중복 매칭 방지 위해 경쟁사별 최고 유사도 1건만 선택
      const compBestMap = new Map<string, any>();

      allCompMenus.forEach((cMenu) => {
        const sim = calculateMenuSimilarity(eMenu.name, cMenu.name);
        if (sim >= 0.8) {
          const priceDiff = cMenu.price - eMenu.price;
          const priceDiffPercent = eMenu.price > 0 ? Math.round((priceDiff / eMenu.price) * 100) : 0;
          const entry = {
            competitorId: cMenu.competitorId,
            competitorName: cMenu.competitorName,
            brandType: cMenu.brandType,
            distance1: cMenu.distance1,
            distance2: cMenu.distance2,
            menuName: cMenu.name,
            price: cMenu.price,
            similarity: sim,
            priceDiff,
            priceDiffPercent,
            subcategory: cMenu.subcategory,
            naverPlaceId: cMenu.naverPlaceId,
            naverPlaceUrl: cMenu.naverPlaceUrl,
          };

          const existing = compBestMap.get(cMenu.competitorId);
          if (!existing || sim > existing.similarity) {
            compBestMap.set(cMenu.competitorId, entry);
          }
        }
      });

      const compMatches = Array.from(compBestMap.values()).sort((a, b) => b.similarity - a.similarity);

      const prices = compMatches.map((m) => m.price);
      const avgCompPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
      const minCompPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxCompPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const minCompMatch = compMatches.find((m) => m.price === minCompPrice) || null;
      const maxCompMatch = compMatches.find((m) => m.price === maxCompPrice) || null;
      const overallDiff = avgCompPrice > 0 ? avgCompPrice - eMenu.price : 0;
      const overallDiffPercent = eMenu.price > 0 && avgCompPrice > 0 ? Math.round((overallDiff / eMenu.price) * 100) : 0;

      return {
        eundalMenu: eMenu,
        compMatches,
        matchCount: compMatches.length,
        avgCompPrice,
        minCompPrice,
        maxCompPrice,
        minCompMatch,
        maxCompMatch,
        overallDiff,
        overallDiffPercent,
      };
    });
  }, [eundalMenus, competitors]);

  // 1:1 비교를 위한 대표 메뉴 퀵 칩 정의 (상위 앵커 메뉴)
  const QUICK_CHIPS = [
    { id: 'all', label: '전체 메뉴' },
    { id: 'americano', label: '☕ 아메리카노', keyword: '아메리카노' },
    { id: 'latte', label: '🥛 카페라떼', keyword: '카페라떼|라떼' },
    { id: 'vanilla', label: '🍯 바닐라라떼', keyword: '바닐라' },
    { id: 'strawberry', label: '🍓 딸기/에이드', keyword: '딸기|에이드|주스|스무디' },
    { id: 'tea', label: '🍵 티/밀크티', keyword: '밀크티|홍차|녹차|얼그레이|캐모마일' },
    { id: 'sandwich', label: '🥪 샌드위치', keyword: '샌드위치' },
    { id: 'bakery', label: '🥐 소금빵/베이커리', keyword: '소금빵|크루아상|식빵|베이글' },
    { id: 'cookie', label: '🍪 쿠키/구움과자', keyword: '쿠키|스콘|휘낭시에|마들렌|마카롱' },
  ];

  // 1:1 비교 필터링 결과 (6대 세부분류 + 퀵 칩 + 검색어)
  const filteredSimilarMenus = useMemo(() => {
    return similarMenuComparison.filter((item) => {
      // 1. 6대 세부분류 필터 (coffee, juice, tea, dessert, sandwich, set)
      if (similarityCategoryFilter !== 'all') {
        const eSub = item.eundalMenu.subcategory || categorizeMenuDetailed(item.eundalMenu.name, item.eundalMenu.category_name).subcategory;
        if (eSub !== similarityCategoryFilter) return false;
      }

      // 2. 퀵 칩 필터
      if (similarityQuickChip !== 'all') {
        const chip = QUICK_CHIPS.find((c) => c.id === similarityQuickChip);
        if (chip && chip.keyword) {
          const regex = new RegExp(chip.keyword, 'i');
          const matchEundal = regex.test(item.eundalMenu.name);
          const matchComp = item.compMatches.some((m: any) => regex.test(m.menuName));
          if (!matchEundal && !matchComp) return false;
        }
      }

      // 3. 검색어 필터
      if (similaritySearch.trim()) {
        const kw = similaritySearch.toLowerCase();
        const matchEundal = item.eundalMenu.name.toLowerCase().includes(kw);
        const matchComp = item.compMatches.some(
          (m: any) => m.menuName.toLowerCase().includes(kw) || m.competitorName.toLowerCase().includes(kw)
        );
        if (!matchEundal && !matchComp) return false;
      }

      return true;
    });
  }, [similarMenuComparison, similarityCategoryFilter, similarityQuickChip, similaritySearch]);

  // 1:1 비교 통계 요약 (미니 대시보드용)
  const similarityStats = useMemo(() => {
    const total = similarMenuComparison.length;
    const matched = similarMenuComparison.filter((m) => m.matchCount > 0).length;
    const eundalCheaper = similarMenuComparison.filter((m) => m.matchCount > 0 && m.overallDiff > 0).length;
    const eundalEqual = similarMenuComparison.filter((m) => m.matchCount > 0 && m.overallDiff === 0).length;
    const eundalExpensive = similarMenuComparison.filter((m) => m.matchCount > 0 && m.overallDiff < 0).length;
    const uniqueCount = total - matched;
    return { total, matched, eundalCheaper, eundalEqual, eundalExpensive, uniqueCount };
  }, [similarMenuComparison]);

  // 아코디언 토글 헬퍼
  const toggleMenuAccordion = (id: string) => {
    setExpandedMenuIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const nextState: Record<string, boolean> = {};
    filteredSimilarMenus.forEach((item) => {
      if (item.matchCount > 0) {
        nextState[item.eundalMenu.id] = true;
      }
    });
    setExpandedMenuIds(nextState);
  };

  const handleCollapseAll = () => {
    setExpandedMenuIds({});
  };

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
    const drinkDiffAbs = Math.abs(drinkDiff);
    const drinkDiffPercent = avgDrinkPrice > 0 ? Math.round((drinkDiffAbs / avgDrinkPrice) * 100) : 0;
    const drinkComparisonLabel = drinkDiff > 0 ? `은달 ${drinkDiffPercent}% 저렴` : drinkDiff < 0 ? `은달 ${drinkDiffPercent}% 비쌈` : '가격 동일 수준';
    const drinkBadgeColor = drinkDiff > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : drinkDiff < 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-stone-100 text-stone-700 border-stone-200';

    const dessertPrices = competitors.map((c) => c.avg_dessert_price || 4200).filter((p) => p > 0);
    const avgDessertPrice = Math.round(dessertPrices.reduce((a, b) => a + b, 0) / dessertPrices.length);
    const dessertDiff = avgDessertPrice - eundalBenchmark.avgDessertPrice;
    const dessertDiffAbs = Math.abs(dessertDiff);
    const dessertDiffPercent = avgDessertPrice > 0 ? Math.round((dessertDiffAbs / avgDessertPrice) * 100) : 0;
    const dessertComparisonLabel = dessertDiff > 0 ? `은달 ${dessertDiffPercent}% 저렴` : dessertDiff < 0 ? `은달 ${dessertDiffPercent}% 비쌈` : '가격 동일 수준';
    const dessertBadgeColor = dessertDiff > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : dessertDiff < 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-stone-100 text-stone-700 border-stone-200';

    const setPrices = competitors.map((c) => c.avg_set_price || 8500).filter((p) => p > 0);
    const avgSetPrice = Math.round(setPrices.reduce((a, b) => a + b, 0) / setPrices.length);
    const setDiff = avgSetPrice - eundalBenchmark.avgSetPrice;
    const setDiffAbs = Math.abs(setDiff);
    const setDiffPercent = avgSetPrice > 0 ? Math.round((setDiffAbs / avgSetPrice) * 100) : 0;
    const setComparisonLabel = setDiff > 0 ? `은달 ${setDiffPercent}% 저렴` : setDiff < 0 ? `은달 ${setDiffPercent}% 비쌈` : '가격 동일 수준';
    const setBadgeColor = setDiff > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : setDiff < 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-stone-100 text-stone-700 border-stone-200';

    const ratings = competitors.map((c) => Number(c.rating) || 4.5);
    const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
    const totalReviews = competitors.reduce((acc, c) => acc + (c.review_count || 0), 0);

    return {
      count: competitors.length,
      avgDrinkPrice,
      avgDessertPrice,
      avgSetPrice,
      drinkDiff,
      drinkDiffPercent,
      drinkComparisonLabel,
      drinkBadgeColor,
      dessertDiff,
      dessertDiffPercent,
      dessertComparisonLabel,
      dessertBadgeColor,
      setDiff,
      setDiffPercent,
      setComparisonLabel,
      setBadgeColor,
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

  // 7. 네이버 플레이스 검색 실행 (네이버 플레이스 ID 또는 URL 기반 실시간 정품 검증)
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlaceQuery.trim()) return;

    try {
      setSearchingPlace(true);
      setFormError('');
      const res = await fetch(`/api/admin/competitors/search-place?query=${encodeURIComponent(searchPlaceQuery.trim())}`);
      const data = await res.json();
      if (data.places && data.places.length > 0) {
        setPlaceSearchResults(data.places);
      } else {
        alert(data.message || data.error || '네이버 플레이스 연동 결과가 없습니다. 정확한 네이버 플레이스 ID(숫자) 또는 플레이스 주소 URL을 입력해주세요.');
      }
    } catch {
      alert('네이버 플레이스 정보 조회 중 네트워크 오류가 발생했습니다.');
    } finally {
      setSearchingPlace(false);
    }
  };

  // 8. 검색 결과에서 매장 선택 시 폼에 자동 채우기
  const handleSelectSearchResult = (item: any) => {
    if (item.is_already_registered) {
      alert(`이미 등록된 네이버 플레이스 매장입니다.\n상호: ${item.already_registered_name || item.name} (플레이스 ID: ${item.naver_place_id})`);
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: item.name,
      brand_type: item.brand_type || prev.brand_type,
      address: item.roadAddress || item.address,
      address_detail: '',
      phone: item.phone || '',
      latitude: item.latitude,
      longitude: item.longitude,
      naver_place_id: item.naver_place_id || '',
      naver_place_url: item.naver_place_url || '',
      rating: item.rating || 4.5,
      review_count: item.review_count || 0,
      blog_review_count: item.blog_review_count || 0,
      representative_menu: item.representative_menu || '',
      avg_coffee_price: item.avg_coffee_price || 3500,
      avg_drink_price: item.avg_drink_price || 4000,
      avg_dessert_price: item.avg_dessert_price || 4500,
      avg_set_price: item.avg_set_price || 8000,
      target_branch: item.distance_store1 <= item.distance_store2 ? 'store1' : 'store2',
      menus: item.menus && item.menus.length > 0 ? item.menus : prev.menus,
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
    if (!form.naver_place_id || !form.naver_place_id.trim()) {
      setFormError('픽업 매장 관리(은달 1호점, 2호점)와 동일하게 네이버 플레이스 ID 연동 정보가 필수입니다. 네이버 플레이스 ID를 먼저 검증하여 등록해주세요.');
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
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || '수정 실패');
        }
      } else {
        const res = await fetch('/api/admin/competitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || '등록 실패');
        }
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
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${stats.drinkBadgeColor}`}>
              {stats.drinkComparisonLabel}
            </span>
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
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${stats.dessertBadgeColor}`}>
              {stats.dessertComparisonLabel}
            </span>
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
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${stats.setBadgeColor}`}>
              {stats.setComparisonLabel}
            </span>
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

          {/* 뷰 모드 전환 (1:1 메뉴 유사도 비교 / 5km 상권 레이더 / 상세 카드 / 가격 비교 차트 / 인지도 매트릭스) */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl self-start lg:self-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setViewMode('similarity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'similarity' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-950" />
              <span>1:1 메뉴 유사도 비교</span>
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'radar' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-stone-950" />
              <span>📍 5km 상권 레이더 (발굴&원터치 추가)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                viewMode === 'cards' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>상세 카드</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                viewMode === 'chart' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>가격 비교 차트</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
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

      {/* 모드 0: 은달 메뉴 vs 주변 경쟁사 동일·유사 메뉴 (유사도 80% 이상) 1:1 가격 비교 */}
      {viewMode === 'similarity' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          {/* 상단 헤더 & 컨트롤 */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                </span>
                <h3 className="text-base font-black text-stone-900 tracking-tight">
                  은달 메뉴 vs 주변 매장 유사 메뉴 (유사율 80% 이상) 1:1 정밀 가격 비교
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                은달 메뉴와 유사한 주변 경쟁사 메뉴를 자동 매칭하여 가격 경쟁력과 시장 포지셔닝을 1:1로 비교합니다.
                <span className="text-stone-400 ml-1.5">
                  * <strong>빨간색 화살표(▲)</strong>는 주변 매장이 비쌈(은달 가성비 우위), <strong>파란색 화살표(▼)</strong>는 저렴함(은달 프리미엄)을 의미합니다.
                </span>
              </p>
            </div>

            {/* 뷰 전환 토글 (표 뷰 vs 카드 뷰) & 검색창 */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* 뷰 타입 스위치 */}
              <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/60">
                <button
                  onClick={() => setSimilarityViewType('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    similarityViewType === 'table'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="한눈에 보기 쉬운 요약 표 형태로 비교"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>요약 표 뷰</span>
                </button>
                <button
                  onClick={() => setSimilarityViewType('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    similarityViewType === 'cards'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="상세한 카드 목록 형태로 비교"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>상세 카드 뷰</span>
                </button>
              </div>

              {/* 검색 인풋 */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="은달 메뉴명, 경쟁사 매장 검색..."
                  value={similaritySearch}
                  onChange={(e) => setSimilaritySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white w-44 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* 미니 KPI 대시보드 (상권 가격 경쟁력 요약) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="text-[11px] font-medium text-stone-500">비교 대상 은달 메뉴</div>
              <div className="text-lg font-black text-stone-900 mt-0.5">
                {similarityStats.total}종
                <span className="text-xs font-bold text-stone-500 ml-1.5">
                  (매칭 {similarityStats.matched}종)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>은달 가성비 우위 (주변보다 저렴)</span>
              </div>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                {similarityStats.eundalCheaper}종
                <span className="text-xs font-medium text-emerald-600 ml-1.5">
                  ({similarityStats.total > 0 ? Math.round((similarityStats.eundalCheaper / similarityStats.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/60">
              <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>은달 프리미엄 라인 (고급/차별화)</span>
              </div>
              <div className="text-lg font-black text-rose-700 mt-0.5">
                {similarityStats.eundalExpensive}종
                <span className="text-xs font-medium text-rose-600 ml-1.5">
                  ({similarityStats.total > 0 ? Math.round((similarityStats.eundalExpensive / similarityStats.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/60">
              <div className="text-[11px] font-bold text-purple-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>은달 독점/단독 메뉴</span>
              </div>
              <div className="text-lg font-black text-purple-700 mt-0.5">
                {similarityStats.uniqueCount}종
                <span className="text-xs font-medium text-purple-600 ml-1.5">경쟁사 미출시</span>
              </div>
            </div>
          </div>

          {/* 필터 툴바: 퀵 칩 셀렉터 & 카테고리 필터 & 일괄 펼침 */}
          <div className="space-y-3 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/60">
            {/* 상단 줄: 카테고리 탭 + 일괄 토글 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-stone-500 mr-1">세부 분류:</span>
                <button
                  onClick={() => setSimilarityCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    similarityCategoryFilter === 'all'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  전체 ({similarMenuComparison.length})
                </button>
                <button
                  onClick={() => setSimilarityCategoryFilter('coffee')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    similarityCategoryFilter === 'coffee'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <Coffee className="w-3 h-3" />
                  <span>커피류</span>
                </button>
                <button
                  onClick={() => setSimilarityCategoryFilter('juice')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    similarityCategoryFilter === 'juice'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <span>🍹</span>
                  <span>주스·에이드·스무디</span>
                </button>
                <button
                  onClick={() => setSimilarityCategoryFilter('tea')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    similarityCategoryFilter === 'tea'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <span>🍵</span>
                  <span>차(Tea) & 밀크티</span>
                </button>
                <button
                  onClick={() => setSimilarityCategoryFilter('dessert')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    similarityCategoryFilter === 'dessert'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <Cake className="w-3 h-3" />
                  <span>디저트 & 구움과자</span>
                </button>
                <button
                  onClick={() => setSimilarityCategoryFilter('sandwich')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    similarityCategoryFilter === 'sandwich'
                      ? 'bg-lime-700 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <span>🥪</span>
                  <span>샌드위치 & 브런치</span>
                </button>
                <button
                  onClick={() => setSimilarityCategoryFilter('set')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    similarityCategoryFilter === 'set'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>세트 & 다과 패키지</span>
                </button>
              </div>

              {/* 표 뷰일 때 모두 펼치기 / 모두 접기 버튼 */}
              {similarityViewType === 'table' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExpandAll}
                    className="text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs"
                  >
                    모두 펼치기
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    className="text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs"
                  >
                    모두 접기
                  </button>
                </div>
              )}
            </div>

            {/* 하단 줄: 대표 메뉴 퀵 칩 셀렉터 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              <span className="text-xs font-bold text-stone-500 shrink-0 mr-1">대표 메뉴 퀵 필터:</span>
              {QUICK_CHIPS.map((chip) => {
                const isActive = similarityQuickChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setSimilarityQuickChip(chip.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      isActive
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-white text-stone-600 border border-stone-200/70 hover:bg-amber-50/50 hover:text-amber-900'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 안내 메시지 및 검색 결과 카운트 */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>
              선택된 조건의 비교 메뉴: <strong>{filteredSimilarMenus.length}종</strong>
            </span>
            <span className="text-[11px] text-stone-400">
              * 유사도 80% 이상 단어 형태소 기반 Jaccard 지수 적용
            </span>
          </div>

          {/* 뷰 렌더링 (요약 표 vs 상세 카드) */}
          {similarityViewType === 'table' ? (
            <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto max-h-[620px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100/90 text-stone-700 font-bold sticky top-0 z-10 border-b border-stone-200 backdrop-blur-xs">
                    <tr>
                      <th className="py-3 px-3.5">메뉴명 / 카테고리</th>
                      <th className="py-3 px-3.5 text-right">은달 판매가</th>
                      <th className="py-3 px-3.5 text-right">주변 평균가</th>
                      <th className="py-3 px-3.5 text-center">주변 차액(▲/▼)</th>
                      <th className="py-3 px-3.5 text-left">주변 최저가 매장</th>
                      <th className="py-3 px-3.5 text-left">주변 최고가 매장</th>
                      <th className="py-3 px-3.5 text-center">가격 경쟁력 진단</th>
                      <th className="py-3 px-3.5 text-center">유사 매장</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredSimilarMenus.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-stone-400">
                          검색 조건에 일치하는 비교 메뉴가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredSimilarMenus.map((item) => {
                        const {
                          eundalMenu,
                          compMatches,
                          matchCount,
                          avgCompPrice,
                          minCompPrice,
                          maxCompPrice,
                          minCompMatch,
                          maxCompMatch,
                          overallDiff,
                          overallDiffPercent,
                        } = item;

                        const isExpanded = !!expandedMenuIds[eundalMenu.id];

                        // 가격 경쟁력 진단 뱃지
                        let diagBadge = {
                          text: '시장 표준가',
                          color: 'bg-stone-100 text-stone-700 border-stone-200',
                        };
                        if (matchCount === 0) {
                          diagBadge = {
                            text: '은달 독점/단독',
                            color: 'bg-purple-50 text-purple-700 border-purple-200',
                          };
                        } else if (overallDiff >= 1000) {
                          diagBadge = {
                            text: '초가성비 우수 (▲)',
                            color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
                          };
                        } else if (overallDiff > 0) {
                          diagBadge = {
                            text: '가성비 양호',
                            color: 'bg-teal-50 text-teal-700 border-teal-200',
                          };
                        } else if (overallDiff < 0 && overallDiff >= -1000) {
                          diagBadge = {
                            text: '프리미엄 포지션',
                            color: 'bg-amber-50 text-amber-700 border-amber-200',
                          };
                        } else if (overallDiff < -1000) {
                          diagBadge = {
                            text: '스페셜티/고급',
                            color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
                          };
                        }

                        return (
                          <React.Fragment key={eundalMenu.id}>
                            <tr
                              onClick={() => matchCount > 0 && toggleMenuAccordion(eundalMenu.id)}
                              className={`hover:bg-amber-50/40 transition-colors ${
                                matchCount > 0 ? 'cursor-pointer' : ''
                              } ${isExpanded ? 'bg-amber-50/30' : ''}`}
                            >
                              {/* 메뉴명 / 카테고리 */}
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const subKey = (eundalMenu.subcategory || categorizeMenuDetailed(eundalMenu.name, eundalMenu.category_name).subcategory) as MenuSubcategory;
                                    const meta = SUBCATEGORIES[subKey] || SUBCATEGORIES.coffee;
                                    return (
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                                      >
                                        {meta.icon} {meta.label}
                                      </span>
                                    );
                                  })()}
                                  <span className="font-extrabold text-stone-900">
                                    {eundalMenu.name}
                                  </span>
                                  {eundalMenu.is_signature && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                                      시그니처
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 은달 판매가 */}
                              <td className="py-3 px-3.5 text-right font-extrabold text-stone-900">
                                {eundalMenu.price.toLocaleString()}원
                              </td>

                              {/* 주변 평균가 */}
                              <td className="py-3 px-3.5 text-right font-bold text-stone-700">
                                {matchCount > 0 ? `${avgCompPrice.toLocaleString()}원` : '-'}
                              </td>

                              {/* 주변 차액(▲/▼) */}
                              <td className="py-3 px-3.5 text-center">
                                {matchCount > 0 ? (
                                  overallDiff > 0 ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                                      <span className="font-black text-rose-600 text-xs">▲</span>
                                      <span>+{overallDiff.toLocaleString()}원 (+{overallDiffPercent}%)</span>
                                    </span>
                                  ) : overallDiff < 0 ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
                                      <span className="font-black text-blue-600 text-xs">▼</span>
                                      <span>{overallDiff.toLocaleString()}원 ({overallDiffPercent}%)</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10.5px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                                      가격 동일
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                    독점/단독
                                  </span>
                                )}
                              </td>

                              {/* 주변 최저가 매장 */}
                              <td className="py-3 px-3.5 text-left">
                                {minCompMatch ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9.5px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                                      최저
                                    </span>
                                    <div className="truncate">
                                      <span className="font-bold text-stone-800 truncate block max-w-[110px]">
                                        {minCompMatch.competitorName}
                                      </span>
                                      <span className="text-[10.5px] text-stone-500">
                                        {minCompPrice.toLocaleString()}원
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-stone-300">-</span>
                                )}
                              </td>

                              {/* 주변 최고가 매장 */}
                              <td className="py-3 px-3.5 text-left">
                                {maxCompMatch ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9.5px] px-1 py-0.2 rounded bg-rose-100 text-rose-800 font-bold shrink-0">
                                      최고
                                    </span>
                                    <div className="truncate">
                                      <span className="font-bold text-stone-800 truncate block max-w-[110px]">
                                        {maxCompMatch.competitorName}
                                      </span>
                                      <span className="text-[10.5px] text-stone-500">
                                        {maxCompPrice.toLocaleString()}원
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-stone-300">-</span>
                                )}
                              </td>

                              {/* 가격 경쟁력 진단 */}
                              <td className="py-3 px-3.5 text-center">
                                <span className={`text-[10.5px] px-2 py-0.5 rounded-full border ${diagBadge.color}`}>
                                  {diagBadge.text}
                                </span>
                              </td>

                              {/* 유사 매장 수 & 토글 버튼 */}
                              <td className="py-3 px-3.5 text-center">
                                {matchCount > 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMenuAccordion(eundalMenu.id);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <span>{matchCount}곳</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3 text-stone-500" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 text-stone-500" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-stone-400">매칭없음</span>
                                )}
                              </td>
                            </tr>

                            {/* 아코디언 상세 확장 (매칭된 주변 매장 리스트) */}
                            {isExpanded && matchCount > 0 && (
                              <tr className="bg-stone-50/80">
                                <td colSpan={8} className="p-4 border-t border-b border-amber-200/50">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        <h5 className="font-extrabold text-xs text-stone-900">
                                          &apos;{eundalMenu.name}&apos; 매칭 주변 매장 ({matchCount}곳) 실시간 상세 분석
                                        </h5>
                                        <span className="text-[11px] text-stone-500">
                                          (은달 판매가: {eundalMenu.price.toLocaleString()}원 | 주변 평균가: {avgCompPrice.toLocaleString()}원)
                                        </span>
                                      </div>
                                      <span className="text-[10.5px] text-stone-400">
                                        유사도 높은 순 정렬
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {compMatches.map((m: any, idx: number) => {
                                        const isLowest = m.price === minCompPrice;
                                        const isHighest = m.price === maxCompPrice;

                                        return (
                                          <div
                                            key={idx}
                                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all ${
                                              isLowest
                                                ? 'bg-blue-50/50 border-blue-200'
                                                : isHighest
                                                ? 'bg-rose-50/50 border-rose-200'
                                                : 'bg-white border-stone-200 hover:border-amber-300'
                                            }`}
                                          >
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-extrabold text-stone-900 text-xs truncate">
                                                  {m.competitorName}
                                                </span>
                                                {m.naverPlaceId && (
                                                  <span className="text-[9.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                                                    ID: {m.naverPlaceId}
                                                  </span>
                                                )}
                                                {m.naverPlaceUrl && (
                                                  <a
                                                    href={m.naverPlaceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[9.5px] text-emerald-700 hover:text-emerald-900 underline font-bold flex items-center gap-0.5"
                                                    title="네이버 플레이스 바로가기"
                                                  >
                                                    <span>플레이스</span>
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                  </a>
                                                )}
                                                <span className="text-[9px] px-1 py-0.2 rounded bg-stone-200/70 text-stone-600 shrink-0 font-medium">
                                                  유사도 {Math.round(m.similarity * 100)}%
                                                </span>
                                                {isLowest && (
                                                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-600 text-white font-bold shrink-0">
                                                    주변 최저가
                                                  </span>
                                                )}
                                                {isHighest && (
                                                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-600 text-white font-bold shrink-0">
                                                    주변 최고가
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[11px] text-stone-600 font-medium truncate mt-1">
                                                {m.menuName}
                                              </p>
                                              <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                                                <span>1호점 {m.distance1?.toFixed(1) || '?'}km</span>
                                                <span>•</span>
                                                <span>2호점 {m.distance2?.toFixed(1) || '?'}km</span>
                                              </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                              <div className="font-black text-stone-900 text-xs">
                                                {m.price.toLocaleString()}원
                                              </div>
                                              {m.priceDiff > 0 ? (
                                                <span className="text-[10.5px] font-bold text-rose-600 flex items-center justify-end gap-0.5 mt-0.5">
                                                  <span className="font-black text-rose-600 text-xs">▲</span>
                                                  <span>+{m.priceDiff.toLocaleString()}원</span>
                                                </span>
                                              ) : m.priceDiff < 0 ? (
                                                <span className="text-[10.5px] font-bold text-blue-600 flex items-center justify-end gap-0.5 mt-0.5">
                                                  <span className="font-black text-blue-600 text-xs">▼</span>
                                                  <span>{m.priceDiff.toLocaleString()}원</span>
                                                </span>
                                              ) : (
                                                <span className="text-[10px] text-stone-400 mt-0.5 block">동일</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 카드 뷰 (기존 카드 뷰의 고도화 버전) */
            <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
              {filteredSimilarMenus.map((item) => {
                const {
                  eundalMenu,
                  compMatches,
                  matchCount,
                  avgCompPrice,
                  minCompPrice,
                  maxCompPrice,
                  minCompMatch,
                  maxCompMatch,
                  overallDiff,
                  overallDiffPercent,
                } = item;

                return (
                  <div
                    key={eundalMenu.id}
                    className="p-4.5 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 shadow-2xs transition-all space-y-3.5"
                  >
                    {/* 상단: 은달 메뉴 요약 & 주변 평균 요약 바 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const subKey = (eundalMenu.subcategory || categorizeMenuDetailed(eundalMenu.name, eundalMenu.category_name).subcategory) as MenuSubcategory;
                          const meta = SUBCATEGORIES[subKey] || SUBCATEGORIES.coffee;
                          return (
                            <span
                              className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                            >
                              {meta.icon} {meta.label}
                            </span>
                          );
                        })()}
                        <h4 className="font-black text-sm text-stone-900">
                          {eundalMenu.name}
                        </h4>
                        <span className="font-extrabold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg text-xs border border-amber-200/60">
                          은달가 {eundalMenu.price.toLocaleString()}원
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        {matchCount > 0 ? (
                          <>
                            <span className="text-[11px] text-stone-500 font-medium">
                              주변 유사 메뉴 <strong>{matchCount}곳</strong> 매칭
                            </span>
                            <span className="text-stone-300">|</span>
                            <span className="font-bold text-stone-800">
                              주변 평균 {avgCompPrice.toLocaleString()}원
                            </span>
                            <span className="text-stone-400 text-[10.5px]">
                              ({minCompPrice.toLocaleString()} ~ {maxCompPrice.toLocaleString()}원)
                            </span>
                            {overallDiff > 0 ? (
                              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                                <span className="font-black text-rose-600 text-xs">▲</span>
                                <span>주변이 +{overallDiff.toLocaleString()}원 (+{overallDiffPercent}%)</span>
                              </span>
                            ) : overallDiff < 0 ? (
                              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                                <span className="font-black text-blue-600 text-xs">▼</span>
                                <span>주변이 {overallDiff.toLocaleString()}원 ({overallDiffPercent}%)</span>
                              </span>
                            ) : (
                              <span className="text-[10.5px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                                가격 동일
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 font-bold">
                            주변 5km 내 유사 메뉴 없음 (은달 차별화 시그니처)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 주변 매칭 하이라이트 (최저가 / 최고가 매장 안내) */}
                    {matchCount > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-stone-600 bg-stone-50/80 px-3 py-1.5 rounded-xl flex-wrap">
                        {minCompMatch && (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-blue-700">최저가 매장:</span>
                            <span className="font-extrabold text-stone-900">{minCompMatch.competitorName}</span>
                            <span className="text-stone-500">({minCompPrice.toLocaleString()}원)</span>
                          </div>
                        )}
                        {minCompMatch && maxCompMatch && <span className="text-stone-300">|</span>}
                        {maxCompMatch && (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-rose-700">최고가 매장:</span>
                            <span className="font-extrabold text-stone-900">{maxCompMatch.competitorName}</span>
                            <span className="text-stone-500">({maxCompPrice.toLocaleString()}원)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 매칭된 주변 매장 메뉴 목록 */}
                    {matchCount > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {compMatches.map((m: any, idx: number) => {
                          const isLowest = m.price === minCompPrice;
                          const isHighest = m.price === maxCompPrice;

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                                isLowest
                                  ? 'bg-blue-50/50 border-blue-200'
                                  : isHighest
                                  ? 'bg-rose-50/50 border-rose-200'
                                  : 'bg-stone-50/80 hover:bg-stone-100/90 border-stone-200/70'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-stone-900 truncate text-[11.5px]">
                                    {m.competitorName}
                                  </span>
                                  {m.naverPlaceId && (
                                    <span className="text-[9.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                                      ID: {m.naverPlaceId}
                                    </span>
                                  )}
                                  {m.naverPlaceUrl && (
                                    <a
                                      href={m.naverPlaceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9.5px] text-emerald-700 hover:text-emerald-900 underline font-bold flex items-center gap-0.5"
                                      title="네이버 플레이스 바로가기"
                                    >
                                      <span>플레이스</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-stone-200/70 text-stone-600 shrink-0 font-medium">
                                    유사도 {Math.round(m.similarity * 100)}%
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-stone-600 truncate mt-0.5">
                                  {m.menuName}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-black text-stone-900 text-xs">
                                  {m.price.toLocaleString()}원
                                </div>
                                {m.priceDiff > 0 ? (
                                  <span className="text-[10px] font-bold text-rose-600 flex items-center justify-end gap-0.5">
                                    <span className="font-black text-rose-600 text-[11px]">▲</span>
                                    <span>+{m.priceDiff.toLocaleString()}원</span>
                                  </span>
                                ) : m.priceDiff < 0 ? (
                                  <span className="text-[10px] font-bold text-blue-600 flex items-center justify-end gap-0.5">
                                    <span className="font-black text-blue-600 text-[11px]">▼</span>
                                    <span>{m.priceDiff.toLocaleString()}원</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-stone-400">동일</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-purple-50/40 rounded-xl text-xs text-purple-700 text-center font-medium">
                        유사 메뉴가 감지되지 않은 은달 고유의 시그니처 품목입니다.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 모드: 은달 1·2호점 5km 네이버 플레이스 상권 레이더 (탐색 & 등록 여부 & 원터치 추가) */}
      {viewMode === 'radar' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          {/* 1. 상단 타이틀 & 새로고침 & 안내 */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500 text-stone-950 font-black">
                  <Navigation className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-stone-900 tracking-tight">
                  은달 1·2호점 반경 5km 네이버 플레이스 상권 레이더
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                조원동 1호점 및 파장동 2호점 반경 5km 내의 검증된 네이버 플레이스 카페 목록입니다.
                현재 비교 시스템에 <strong>등록 여부</strong>를 확인하고, 미등록 매장은 <strong>원터치로 실시간 정보·메뉴를 수집하여 즉시 추가</strong>할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadRadarPlaces}
                disabled={radarLoading}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="상권 레이더 목록 새로고침"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${radarLoading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
            </div>
          </div>

          {/* 알림 메시지 배너 */}
          {quickAddMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{quickAddMessage}</span>
            </div>
          )}

          {/* 2. 네이버 플레이스 ID 직접 퀵 추가 폼 바 */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-md">
            <form onSubmit={handleCustomQuickAdd} className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black shrink-0">
                  ⚡
                </span>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-stone-100">
                    신규 매장 네이버 플레이스 ID로 원터치 즉시 등록
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    네이버 플레이스 고유 숫자 ID(예: 1601638464)를 입력하면 실시간으로 메뉴와 가격을 크롤링하여 등록합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <input
                  type="text"
                  placeholder="플레이스 ID (예: 1805614608)"
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  className="px-3 py-2 bg-stone-800/90 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 font-mono focus:outline-none focus:border-amber-400 flex-1 sm:w-56"
                />
                <button
                  type="submit"
                  disabled={!quickAddInput.trim() || !!quickAddingId}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
                >
                  {quickAddingId === quickAddInput.trim() ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>수집 중...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>원터치 추가</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 3. KPI 상권 통계 대시보드 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="text-[11px] font-medium text-stone-500">발굴 카페 총계</div>
              <div className="text-lg font-black text-stone-900 mt-0.5">
                {radarSummary?.totalCount || radarPlaces.length}곳
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">5km 반경 내 검증</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>비교 등록 완료</span>
              </div>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                {radarSummary?.registeredCount || 0}곳
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">
                점유율 {radarSummary?.totalCount ? Math.round(((radarSummary.registeredCount || 0) / radarSummary.totalCount) * 100) : 0}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60">
              <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>미등록 발굴 후보</span>
              </div>
              <div className="text-lg font-black text-amber-700 mt-0.5">
                {radarSummary?.unregisteredCount || 0}곳
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">원터치 추가 가능</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="text-[11px] font-medium text-stone-500">1호점(조원) 5km</div>
              <div className="text-lg font-black text-stone-900 mt-0.5">
                {radarSummary?.withinStore1 || 0}곳
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">북수원·조원·송죽 상권</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="text-[11px] font-medium text-stone-500">2호점(파장) 5km</div>
              <div className="text-lg font-black text-stone-900 mt-0.5">
                {radarSummary?.withinStore2 || 0}곳
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">파장·정자·이목 상권</div>
            </div>
          </div>

          {/* 4. 필터 및 검색 툴바 */}
          <div className="space-y-3 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* 등록 여부 필터 */}
              <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setRadarStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarStatusFilter === 'all'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  전체 ({radarPlaces.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRadarStatusFilter('unregistered')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    radarStatusFilter === 'unregistered'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-amber-700'
                  }`}
                >
                  <span>⚠️ 미등록 후보만</span>
                  <span className="text-[10px] opacity-80">({radarSummary?.unregisteredCount || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRadarStatusFilter('registered')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    radarStatusFilter === 'registered'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-emerald-700'
                  }`}
                >
                  <span>✅ 등록 완료만</span>
                  <span className="text-[10px] opacity-80">({radarSummary?.registeredCount || 0})</span>
                </button>
              </div>

              {/* 지점 중심 필터 */}
              <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setRadarBranchFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarBranchFilter === 'all'
                      ? 'bg-stone-800 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  전체 5km
                </button>
                <button
                  type="button"
                  onClick={() => setRadarBranchFilter('store1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarBranchFilter === 'store1'
                      ? 'bg-stone-800 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  1호점(조원동) 5km
                </button>
                <button
                  type="button"
                  onClick={() => setRadarBranchFilter('store2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarBranchFilter === 'store2'
                      ? 'bg-stone-800 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  2호점(파장동) 5km
                </button>
              </div>

              {/* 실시간 검색창 */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="카페 상호명, 주소, ID 검색..."
                  value={radarSearch}
                  onChange={(e) => setRadarSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 w-full sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* 5. 후보 매장 카드 그리드 리스트 */}
          {radarLoading ? (
            <div className="py-16 text-center text-xs text-stone-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600" />
              <p>5km 반경 네이버 플레이스 상권 데이터를 스캔하는 중입니다...</p>
            </div>
          ) : radarPlaces.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
              조건에 일치하는 5km 상권 카페가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[700px] overflow-y-auto pr-1">
              {radarPlaces.map((place) => {
                const isAdding = quickAddingId === place.naver_place_id;

                return (
                  <div
                    key={place.naver_place_id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                      place.is_registered
                        ? 'bg-white border-stone-200/90 hover:border-emerald-300 shadow-2xs'
                        : 'bg-amber-50/20 border-amber-200/70 hover:border-amber-400 shadow-xs'
                    }`}
                  >
                    {/* 상단: 상호명 & 등록 여부 뱃지 */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-sm text-stone-900 truncate">
                              {place.name}
                            </h4>
                            {place.brand_type === 'small_coffee' && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800">
                                소규모 커피
                              </span>
                            )}
                            {place.brand_type === 'dessert_cafe' && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-rose-100 text-rose-800">
                                디저트 카페
                              </span>
                            )}
                            {place.brand_type === 'specialty' && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-800">
                                스페셜티
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5" title={place.address}>
                            {place.address}
                          </p>
                        </div>

                        {/* 등록 상태 뱃지 */}
                        <div className="shrink-0">
                          {place.is_registered ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>비교 등록됨</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              <span>⚠️ 미등록 후보</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 네이버 플레이스 ID & 네이버 링크 & 거리 */}
                      <div className="flex items-center gap-2 text-[10.5px] text-stone-500 flex-wrap pt-1">
                        <span className="font-mono bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded border border-stone-200/70 font-bold">
                          ID: {place.naver_place_id}
                        </span>
                        {place.naver_place_url && (
                          <a
                            href={place.naver_place_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 underline font-bold flex items-center gap-0.5"
                            title="네이버 플레이스 바로가기"
                          >
                            <span>플레이스</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        <span className="text-stone-300">|</span>
                        <span>1호점 {place.distance_store1?.toFixed(1) || '?'}km</span>
                        <span>•</span>
                        <span>2호점 {place.distance_store2?.toFixed(1) || '?'}km</span>
                      </div>
                    </div>

                    {/* 중단: 네이버 평점 & 리뷰 & 대표메뉴 안내 */}
                    <div className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/60 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-extrabold text-stone-900">{place.rating || 4.5}</span>
                          <span className="text-stone-400 text-[10px]">
                            (리뷰 {(place.review_count || 0).toLocaleString()}개)
                          </span>
                        </div>
                        {place.blog_review_count > 0 && (
                          <span className="text-[10px] text-stone-400">
                            블로그 {place.blog_review_count}개
                          </span>
                        )}
                      </div>
                      {place.representative_menu && (
                        <p className="text-[11px] text-stone-600 truncate font-medium">
                          <span className="text-stone-400 mr-1">대표메뉴:</span>
                          {place.representative_menu}
                        </p>
                      )}
                    </div>

                    {/* 하단: 액션 버튼 바 (원터치 추가 버튼 or 등록완료 안내 + 4대 지도 확인 버튼) */}
                    <div className="space-y-2 pt-1 border-t border-stone-100">
                      {/* 원터치 추가 액션 */}
                      {!place.is_registered ? (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(place.naver_place_id, place.name)}
                          disabled={isAdding}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-stone-300 disabled:to-stone-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        >
                          {isAdding ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>실시간 메뉴 수집 및 추가 중...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ 원터치 비교 분석에 추가</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-bold text-center border border-emerald-200/80 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>비교 분석 등록 완료된 매장입니다</span>
                        </div>
                      )}

                      {/* 픽업 매장 관리와 동일한 4대 지도 확인 버튼 탑재 */}
                      <div className="flex items-center gap-1 justify-between text-[10px] pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            // 미니 지도 팝업을 위해 가상 Competitor 규격 전달
                            setMapTarget({
                              id: place.registered_competitor_id || place.naver_place_id,
                              name: place.name,
                              address: place.address,
                              brand_type: place.brand_type,
                              latitude: 37.3000,
                              longitude: 127.0100,
                              distance_store1: place.distance_store1,
                              distance_store2: place.distance_store2,
                              rating: place.rating,
                              review_count: place.review_count,
                              naver_place_id: place.naver_place_id,
                              naver_place_url: place.naver_place_url,
                            } as any);
                          }}
                          className="px-2 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-0.5 shadow-2xs"
                        >
                          <MapPin className="w-2.5 h-2.5 text-amber-400" />
                          <span>미니 지도</span>
                        </button>
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(place.address || place.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-0.5"
                        >
                          네이버 <ExternalLink className="w-2 h-2" />
                        </a>
                        <a
                          href={`https://map.kakao.com/link/search/${encodeURIComponent(place.address || place.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-900 font-bold border border-yellow-300 flex items-center gap-0.5"
                        >
                          카카오 <ExternalLink className="w-2 h-2" />
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address || place.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold border border-stone-200 flex items-center gap-0.5"
                        >
                          구글 <ExternalLink className="w-2 h-2" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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

            {/* 카테고리 탭 (6대 세부분류: 커피, 주스·에이드, 티·밀크티, 디저트, 샌드위치, 세트) */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto no-scrollbar">
              <button
                onClick={() => setChartCategory('coffee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  chartCategory === 'coffee' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>☕ 커피류</span>
              </button>
              <button
                onClick={() => setChartCategory('juice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  chartCategory === 'juice' ? 'bg-orange-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>🍹</span>
                <span>주스·에이드</span>
              </button>
              <button
                onClick={() => setChartCategory('tea')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  chartCategory === 'tea' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>🍵</span>
                <span>차(Tea)·밀크티</span>
              </button>
              <button
                onClick={() => setChartCategory('dessert')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  chartCategory === 'dessert' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Cake className="w-3.5 h-3.5" />
                <span>🍰 디저트</span>
              </button>
              <button
                onClick={() => setChartCategory('sandwich')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  chartCategory === 'sandwich' ? 'bg-lime-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>🥪</span>
                <span>샌드위치</span>
              </button>
              <button
                onClick={() => setChartCategory('set')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  chartCategory === 'set' ? 'bg-purple-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>🎁 세트구성</span>
              </button>
            </div>
          </div>

          {/* 은달 기준선 바 */}
          {(() => {
            const benchmarkPrice = eundalBenchmark.subcategories?.[chartCategory] || (
              chartCategory === 'coffee' ? eundalBenchmark.americanoPrice :
              chartCategory === 'set' ? eundalBenchmark.avgSetPrice :
              chartCategory === 'dessert' ? eundalBenchmark.avgDessertPrice : eundalBenchmark.avgDrinkPrice
            );
            const categoryLabel = SUBCATEGORIES[chartCategory]?.label || chartCategory;

            return (
              <div className="p-3.5 bg-stone-900 text-white rounded-2xl flex items-center justify-between font-black text-xs shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px]">기준점</span>
                  <span>
                    ★ 은달 카페 ({categoryLabel} 실시간 평균 {benchmarkPrice.toLocaleString()}원)
                  </span>
                </div>
                <div className="text-amber-300 text-sm font-bold">
                  {benchmarkPrice.toLocaleString()}원
                </div>
              </div>
            );
          })()}

          {/* 경쟁사별 바 */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCompetitors.map((comp) => {
              const compPrice =
                chartCategory === 'coffee'
                  ? (comp.avg_coffee_price || 3500)
                  : chartCategory === 'juice'
                  ? (comp.avg_juice_price || comp.avg_drink_price || 5000)
                  : chartCategory === 'tea'
                  ? (comp.avg_tea_price || comp.avg_drink_price || 4500)
                  : chartCategory === 'sandwich'
                  ? (comp.avg_sandwich_price || comp.avg_dessert_price || 6200)
                  : chartCategory === 'dessert'
                  ? (comp.avg_dessert_price || 3800)
                  : (comp.avg_set_price || 7500);

              const benchmarkPrice = eundalBenchmark.subcategories?.[chartCategory] || (
                chartCategory === 'coffee' ? eundalBenchmark.americanoPrice :
                chartCategory === 'set' ? eundalBenchmark.avgSetPrice :
                chartCategory === 'dessert' ? eundalBenchmark.avgDessertPrice : eundalBenchmark.avgDrinkPrice
              );

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
                        <span className="text-[10.5px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <span className="font-black text-rose-600 text-xs">▲</span>
                          <span>+{diff.toLocaleString()}원 (+{Math.round((diff / benchmarkPrice) * 100)}%)</span>
                        </span>
                      ) : diff < 0 ? (
                        <span className="text-[10.5px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                          <span className="font-black text-blue-600 text-xs">▼</span>
                          <span>{diff.toLocaleString()}원 ({Math.round((diff / benchmarkPrice) * 100)}%)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                          동일 (0원)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        chartCategory === 'coffee'
                          ? 'bg-amber-700'
                          : chartCategory === 'juice'
                          ? 'bg-orange-600'
                          : chartCategory === 'tea'
                          ? 'bg-emerald-600'
                          : chartCategory === 'dessert'
                          ? 'bg-rose-600'
                          : chartCategory === 'sandwich'
                          ? 'bg-amber-600'
                          : 'bg-purple-700'
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

                            {/* 네이버 플레이스 연동 확인 배지 & ID (픽업 매장 관리와 동일) */}
                            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>네이버 플레이스 연동</span>
                                {comp.naver_place_id && (
                                  <code className="text-emerald-900 bg-emerald-100/90 px-1 py-0.2 rounded text-[9.5px] font-mono">
                                    ID: {comp.naver_place_id}
                                  </code>
                                )}
                              </span>
                              {comp.naver_place_url && (
                                <a
                                  href={comp.naver_place_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10.5px] text-emerald-700 hover:text-emerald-900 underline font-bold flex items-center gap-0.5"
                                >
                                  <span>플레이스 확인</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
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

                    {/* 하단 액션 버튼 바 (픽업 매장 관리와 동일한 4대 지도 확인 버튼 탑재) */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      {/* 지도 연동 링크 버튼 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-stone-400 font-medium">지도 미리보기:</span>
                        <button
                          type="button"
                          onClick={() => setMapTarget(comp)}
                          className="px-2 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <MapPin className="w-2.5 h-2.5 text-amber-400" />
                          <span>미니 지도 팝업</span>
                        </button>
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(comp.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 border border-emerald-200"
                        >
                          네이버 지도 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={`https://map.kakao.com/link/search/${encodeURIComponent(comp.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-900 text-[10px] font-bold flex items-center gap-0.5 border border-yellow-300"
                        >
                          카카오맵 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comp.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-0.5 border border-stone-200"
                        >
                          구글 지도 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      {/* 수정 및 삭제 버튼 */}
                      <div className="flex items-center gap-1.5 justify-end shrink-0">
                        <button
                          onClick={() => openEditModal(comp)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold flex items-center gap-1 text-[11px] transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => handleDelete(comp)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1 text-[11px] transition-colors"
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

              {/* [네이버 플레이스 ID / URL 기반 실시간 정품 검증 섹션] */}
              {!editingComp && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-[#03C75A] text-white text-[10px] font-black flex items-center justify-center">N</span>
                      <span>네이버 플레이스 ID 기준 실시간 정품 검증</span>
                    </span>
                    <span className="text-[10.5px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      가짜/임의 데이터 원천 차단
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    은달 1·2호점 픽업 매장 관리와 동일하게 <strong>네이버 플레이스 고유 ID(숫자)</strong> 또는 <strong>플레이스 주소 URL</strong>을 입력하면, 네이버 공식 서버에서 실시간으로 정품 매장 정보와 실제 메뉴·가격을 직접 검증하여 자동 채워 넣습니다.
                  </p>

                  <form onSubmit={handleSearchPlace} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="네이버 플레이스 ID (숫자, 예: 1987515082) 또는 플레이스 URL 입력..."
                      value={searchPlaceQuery}
                      onChange={(e) => setSearchPlaceQuery(e.target.value)}
                      className="flex-1 p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={searchingPlace}
                      className="px-4 py-2.5 bg-[#03C75A] hover:bg-[#02b150] text-white font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-xs transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{searchingPlace ? '실시간 검증 중...' : '정품 플레이스 검증'}</span>
                    </button>
                  </form>

                  {/* 검색/검증 결과 목록 */}
                  {placeSearchResults.length > 0 && (
                    <div className="p-2 bg-white rounded-xl border border-emerald-200 space-y-1.5 max-h-48 overflow-y-auto">
                      <p className="text-[10px] text-emerald-800 font-bold px-1">
                        ✓ 검증된 정품 매장 목록 (클릭 시 아래 폼에 실제 메뉴 및 정보가 자동 적용됩니다):
                      </p>
                      {placeSearchResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSearchResult(item)}
                          className="p-2.5 rounded-lg hover:bg-emerald-50 cursor-pointer border border-emerald-100 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-stone-900 text-xs truncate">{item.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-mono font-bold">
                                ID: {item.naver_place_id}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 text-[9.5px] font-bold">
                                {item.category || '로컬 카페'}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">{item.address}</p>
                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              ✓ 실제 메뉴 {item.menus?.length || 0}종 확인 완료
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10.5px] font-bold text-amber-800 block">
                              1호점 {item.distance_store1}km · 2호점 {item.distance_store2}km
                            </span>
                            <div className="text-[10px] text-stone-500 mt-0.5">
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
                {/* 네이버 플레이스 연동 확인 상태 바 */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-700 text-xs">네이버 플레이스 연동 ID:</span>
                    {form.naver_place_id ? (
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{form.naver_place_id} (공식 연동 확인)</span>
                      </span>
                    ) : (
                      <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-bold">
                        미검증 (상단에서 정품 검증 필수)
                      </span>
                    )}
                  </div>
                  {form.naver_place_url && (
                    <a
                      href={form.naver_place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-700 hover:text-emerald-900 underline font-bold flex items-center gap-1"
                    >
                      <span>실제 플레이스 페이지 열기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-stone-700 font-bold mb-1">상호명 (필수)</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="예: 카페디아즈"
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
