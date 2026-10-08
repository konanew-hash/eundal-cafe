'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Award,
  Plus,
  Search,
  Calendar,
  Users,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Upload,
  Loader2,
  Star,
  Eye,
  EyeOff,
  Building,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Portfolio } from '@/lib/types';

// 개인 실명 감지 및 안전 기관명/단체명 치환 함수 (개인정보보호 안심 필터)
function sanitizeClientName(name: string): string {
  if (!name) return '수원 단체 고객사';
  const trimmed = name.trim();
  // 1. 이미 기관/단체/회사/학교/모임 관련 키워드가 포함된 경우 안전
  const isOrg = /(회사|기업|센터|협회|학교|대학|병원|연구소|구청|시청|재단|복지관|학원|교회|성당|동호회|팀|본부|지점|학회|위원회|스튜디오|랩|lab|동아리|모임|과|부|청|회)/i.test(trimmed);
  if (isOrg) return trimmed;
  // 2. 한글 2~4글자 개인 이름 형태(예: 홍길동, 김은달 등)이거나 '님'이 붙은 경우
  if (/^[가-힣]{2,4}(님)?$/.test(trimmed)) {
    return '수원 세미나/모임 단체';
  }
  return trimmed;
}

function PortfolioAdminContent() {
  const searchParams = useSearchParams();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tagFilter, setTagFilter] = useState('all');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Portfolio | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 폼 필드 상태
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventScale, setEventScale] = useState('');
  const [itemSummary, setItemSummary] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);

  // 이미지/영상 업로드 로딩
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // 목록 불러오기
  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/portfolios');
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data.portfolios || []);
      }
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  // 쿼리 파라미터로 주문 연동된 경우 자동 모달 오픈 (개인정보 보호 필터 적용)
  useEffect(() => {
    const fromOrderId = searchParams.get('order_id');
    const fromClientName = searchParams.get('client_name');
    const fromDate = searchParams.get('date');
    const fromTime = searchParams.get('time');
    const fromItems = searchParams.get('items');

    if (fromOrderId || fromClientName) {
      resetForm();
      const safeClient = sanitizeClientName(fromClientName || '');

      if (fromOrderId) setOrderId(fromOrderId);
      setClientName(safeClient);
      setTitle(`${safeClient} 단체 케이터링 납품`);

      if (fromDate) setEventDate(fromDate);
      if (fromTime) setEventTime(fromTime);
      if (fromItems) {
        setItemSummary(fromItems);
        setContent(`${safeClient} 행사에 ${fromItems} 구성을 신선하게 정시 배달 납품 완료했습니다.`);
      }
      setEventScale('단체 50인분');
      setIsFeatured(true);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const resetForm = () => {
    setEditingItem(null);
    setTitle('');
    setClientName('');
    setEventDate(new Date().toISOString().slice(0, 10));
    setEventTime('오전 09:00');
    setEventScale('');
    setItemSummary('');
    setContent('');
    setPhotos([]);
    setVideoUrls([]);
    setTagsInput('관공서, 단체주문, 정시배달');
    setIsFeatured(false);
    setIsActive(true);
    setSortOrder(0);
    setOrderId(null);
    setNewImageUrl('');
    setNewVideoUrl('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: Portfolio) => {
    setEditingItem(item);
    setTitle(item.title);
    setClientName(item.client_name);
    setEventDate(item.event_date);
    setEventTime(item.event_time || '');
    setEventScale(item.event_scale);
    setItemSummary(item.item_summary || '');
    setContent(item.content || '');
    setPhotos(item.photos || []);
    setVideoUrls(item.video_urls || []);
    setTagsInput((item.tags || []).join(', '));
    setIsFeatured(item.is_featured);
    setIsActive(item.is_active);
    setSortOrder(item.sort_order || 0);
    setOrderId(item.order_id || null);
    setIsModalOpen(true);
  };

  // 사진 파일 업로드 처리
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) uploadedUrls.push(data.url);
        }
      }
      if (uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // 사진 직접 URL 추가
  const handleAddPhotoUrl = () => {
    if (!newImageUrl.trim()) return;
    setPhotos((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  // 영상 파일 업로드 처리
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setVideoUrls((prev) => [...prev, data.url]);
        }
      }
    } catch (err) {
      alert('영상 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  // 영상 URL 직접 추가 (유튜브 또는 비디오 링크)
  const handleAddVideoUrl = () => {
    if (!newVideoUrl.trim()) return;
    setVideoUrls((prev) => [...prev, newVideoUrl.trim()]);
    setNewVideoUrl('');
  };

  // 포트폴리오 저장 (생성/수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || !eventDate || !eventScale.trim()) {
      alert('필수 입력 항목(제목, 기관/단체명, 행사일, 행사규모)을 입력해주세요.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // 개인정보 보호 안심 필터 적용
    const safeClient = sanitizeClientName(clientName.trim());

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        client_name: safeClient,
        event_date: eventDate,
        event_time: eventTime.trim(),
        event_scale: eventScale.trim(),
        item_summary: itemSummary.trim(),
        content: content.trim(),
        photos,
        video_urls: videoUrls,
        tags,
        order_id: orderId,
        is_featured: isFeatured,
        is_active: isActive,
        sort_order: sortOrder,
      };

      if (editingItem) {
        const res = await fetch(`/api/admin/portfolios/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('수정에 실패했습니다.');
      } else {
        const res = await fetch('/api/admin/portfolios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('등록에 실패했습니다.');
      }

      setIsModalOpen(false);
      fetchPortfolios();
    } catch (err: any) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 삭제 처리
  const handleDelete = async (item: Portfolio) => {
    if (!confirm(`'${item.title}' 포트폴리오를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/portfolios/${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPortfolios((prev) => prev.filter((p) => p.id !== item.id));
      } else {
        alert('삭제 처리에 실패했습니다.');
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 빠른 상태 토글
  const handleToggleStatus = async (item: Portfolio, field: 'is_featured' | 'is_active') => {
    try {
      const nextVal = !item[field];
      const res = await fetch(`/api/admin/portfolios/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: nextVal }),
      });
      if (res.ok) {
        setPortfolios((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, [field]: nextVal } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // 필터링된 포트폴리오
  const filteredPortfolios = portfolios.filter((item) => {
    if (tagFilter !== 'all') {
      if (!item.tags?.includes(tagFilter)) return false;
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(kw);
      const matchClient = item.client_name.toLowerCase().includes(kw);
      const matchSummary = item.item_summary?.toLowerCase().includes(kw);
      const matchContent = item.content?.toLowerCase().includes(kw);
      if (!matchTitle && !matchClient && !matchSummary && !matchContent) return false;
    }
    return true;
  });

  // 모든 고유 태그 목록
  const allTags = Array.from(
    new Set(portfolios.flatMap((p) => p.tags || []).filter(Boolean))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* 상단 헤더 & 통계 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Showcase & Marketing Archive</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900">단체 납품 포트폴리오 저장소</h1>
          <p className="text-xs text-stone-500 mt-1">
            견적 및 납품 완료된 단체/기관 행사 실적과 사진·영상을 등록하여 홈페이지 방문 고객에게 자연스럽게 신뢰도를 홍보합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/portfolio"
            target="_blank"
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-colors border border-stone-200"
          >
            <Eye className="w-4 h-4" />
            <span>홈페이지 갤러리 보기</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </Link>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all shadow-md shadow-stone-900/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>납품 사례 신규 등록</span>
          </button>
        </div>
      </div>

      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-medium">전체 납품 실적</span>
          <p className="text-xl font-black text-stone-900 mt-1">{portfolios.length}건</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-medium">대표 추천(메인노출)</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {portfolios.filter((p) => p.is_featured).length}건
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-medium">현장 사진 보유 실적</span>
          <p className="text-xl font-black text-blue-600 mt-1">
            {portfolios.filter((p) => p.photos && p.photos.length > 0).length}건
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-medium">현장 영상 보유 실적</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {portfolios.filter((p) => p.video_urls && p.video_urls.length > 0).length}건
          </p>
        </div>
      </div>

      {/* 검색 및 태그 필터 바 */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="기관명, 행사명, 메뉴 구성, 설명 내용 검색..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setTagFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  tagFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                전체 ({portfolios.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                    tagFilter === tag
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 포트폴리오 목록 카드 그리드 */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
          <p className="text-xs">납품 포트폴리오를 불러오는 중입니다...</p>
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-700 text-sm">등록된 납품 포트폴리오가 없습니다.</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            수원시청, 대학교, 기업 등 실제 납품된 행사 사진과 구성을 등록하면 홈페이지 방문 고객에게 신뢰도 높은 맞춤 홍보가 이루어집니다.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors"
          >
            첫 포트폴리오 등록하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPortfolios.map((item) => {
            const hasPhotos = item.photos && item.photos.length > 0;
            const hasVideos = item.video_urls && item.video_urls.length > 0;
            const mainPhoto = hasPhotos ? item.photos[0] : null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-video bg-stone-100 overflow-hidden group">
                  {mainPhoto ? (
                    <img
                      src={mainPhoto}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1 bg-stone-50">
                      <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                      <span className="text-[10px]">사진 미등록</span>
                    </div>
                  )}

                  {/* 뱃지들 */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {item.is_featured && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-stone-950 font-black text-[10px] shadow-sm flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-stone-950" />
                        <span>대표 추천</span>
                      </span>
                    )}
                    {item.is_active ? (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] shadow-sm">
                        공개중
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-stone-700 text-stone-200 font-bold text-[10px] shadow-sm">
                        비공개
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
                    {hasPhotos && (
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-2xs text-white text-[10px] font-medium flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" />
                        <span>{item.photos.length}장</span>
                      </span>
                    )}
                    {hasVideos && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-700/85 backdrop-blur-2xs text-white text-[10px] font-bold flex items-center gap-1">
                        <Video className="w-2.5 h-2.5" />
                        <span>영상</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 본문 정보 */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold">
                      <Building className="w-3 h-3" />
                      <span className="truncate">{item.client_name}</span>
                    </div>

                    <h4 className="font-bold text-sm text-stone-900 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>

                    {/* 행사일 / 규모 뱃지 */}
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{item.event_date}</span>
                        {item.event_time && <span className="text-stone-400">({item.event_time})</span>}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-stone-700">
                        <Users className="w-3 h-3 text-amber-600" />
                        <span>{item.event_scale}</span>
                      </span>
                    </div>

                    {item.item_summary && (
                      <div className="p-2 bg-stone-50 rounded-xl text-[11px] text-stone-600 border border-stone-200/60 line-clamp-2">
                        <strong className="text-stone-800">납품 메뉴:</strong> {item.item_summary}
                      </div>
                    )}

                    {item.content && (
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    )}

                    {/* 태그 칩 */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {item.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 하단 관리자 도구 바 */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item, 'is_featured')}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold transition-colors ${
                          item.is_featured
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-stone-600'
                        }`}
                        title="메인 대표 추천 토글"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item, 'is_active')}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold transition-colors ${
                          item.is_active
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-stone-50 border-stone-200 text-stone-400'
                        }`}
                        title={item.is_active ? '비공개로 전환' : '공개로 전환'}
                      >
                        {item.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        <span>수정</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 text-xs transition-colors"
                        title="포트폴리오 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 등록 & 수정 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-800 my-8 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {editingItem ? '납품 포트폴리오 수정' : '새 단체 납품 사례 등록'}
                  </h3>
                  <p className="text-[11px] text-amber-300">
                    홈페이지 단체 고객에게 노출될 실제 납품 사례를 작성합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 폼 바디 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 개인정보 보호 안심 필터 안내 */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block text-amber-900">개인정보보호 안심 필터 적용 중</span>
                  <span>고객님의 소중한 개인정보(성명) 노출을 방지하기 위해, 제목 및 주문처는 단체·기관·행사명(예: 수원 세미나 단체, OO기업 워크숍)으로 등록됩니다.</span>
                </div>
              </div>

              {/* 1. 기본 정보 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  기본 행사 및 납품 정보
                </h4>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    납품 사례 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 수원시청 기획예산과 정기 워크숍 150세트 납품"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      주문 기관 혹은 단체명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="예: 수원시청, 삼성전자, 성균관대학교"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      행사 규모 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventScale}
                      onChange={(e) => setEventScale(e.target.value)}
                      placeholder="예: 단체 120인분, 200세트"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      행사일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">납품/행사 시간</label>
                    <input
                      type="text"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder="예: 오전 08:30 또는 오후 13:00"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    납품 메뉴 구성 요약
                  </label>
                  <input
                    type="text"
                    value={itemSummary}
                    onChange={(e) => setItemSummary(e.target.value)}
                    placeholder="예: 에그마요 1/2 + 햄치즈 1/2 반반 샌드위치, 캔아메리카노 보냉 150캔"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    행사 납품 후기 및 특징
                  </label>
                  <textarea
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="예: 워크숍 시작 시간에 맞춰 신선 보냉 포장으로 정시 배송 완료했습니다. 담당자분께서 개별 스티커 라벨링과 맛에 매우 만족하셨습니다."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* 2. 사진 올리기 기능 */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>납품 현장 사진 등록 ({photos.length}장)</span>
                  </h4>
                  <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold cursor-pointer border border-blue-200 flex items-center gap-1 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingImage ? '사진 업로드 중...' : '사진 파일 추가'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 이미지 URL 직접 추가 */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="또는 이미지 외부 URL 직접 붙여넣기..."
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
                  >
                    추가
                  </button>
                </div>

                {/* 사진 썸네일 리스트 */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
                        <img src={p} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-amber-500 text-stone-950 font-black text-[9px] px-1 py-0.2 rounded">
                            대표
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="사진 삭제"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. 영상 올리기 기능 */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>납품 현장 영상 등록 ({videoUrls.length}개)</span>
                  </h4>
                  <label className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold cursor-pointer border border-purple-200 flex items-center gap-1 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingVideo ? '영상 업로드 중...' : '영상 파일 추가'}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileUpload}
                      disabled={uploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 영상 URL 직접 추가 */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="유튜브 링크 또는 영상 웹 URL (mp4, webm 등)..."
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
                  >
                    추가
                  </button>
                </div>

                {/* 등록된 영상 목록 */}
                {videoUrls.length > 0 && (
                  <div className="space-y-1.5">
                    {videoUrls.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-purple-50/50 rounded-xl text-xs border border-purple-100"
                      >
                        <span className="truncate text-purple-900 font-mono text-[11px] max-w-[420px]">
                          {v}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-red-600 ml-2"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. 태그 및 설정 옵션 */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    검색 키워드 태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="예: 관공서, 워크숍, 샌드위치도시락, 정시배달"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>⭐ 대표 추천 (상단노출)</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>공개 상태 (활성화)</span>
                  </label>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">
                      정렬 순서 (낮을수록 앞)
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 모달 하단 액션 버튼 */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <span>{editingItem ? '수정 완료' : '포트폴리오 등록'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPortfolioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">페이지 로딩 중...</div>}>
      <PortfolioAdminContent />
    </Suspense>
  );
}
