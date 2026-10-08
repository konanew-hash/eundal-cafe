'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Calendar,
  Users,
  Building,
  Image as ImageIcon,
  Video,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Star,
  CheckCircle,
  Phone,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Play,
  Heart,
  ShieldCheck,
  Truck,
  Coffee,
} from 'lucide-react';
import { Portfolio, CafeInfo } from '@/lib/types';

export default function PortfolioPublicPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [cafeInfo, setCafeInfo] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activePhotoIdx, setActivePhotoIdx] = useState<Record<string, number>>({});
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/data')
      .then((res) => res.json())
      .then((data) => {
        if (data.portfolios) {
          setPortfolios(data.portfolios);
        }
        if (data.cafe) {
          setCafeInfo(data.cafe);
        }
      })
      .catch((err) => console.error('Failed to load portfolio public data:', err))
      .finally(() => setLoading(false));
  }, []);

  // 태그 및 필터 옵션
  const filterOptions = [
    { id: 'all', label: '전체 납품 사례' },
    { id: 'featured', label: '⭐ 대표 추천' },
    { id: '관공서', label: '🏢 관공서/공공' },
    { id: '대학교', label: '🎓 대학교/학술제' },
    { id: '기업', label: '💼 기업/워크숍' },
  ];

  const filteredItems = portfolios.filter((item) => {
    if (activeFilter === 'featured') return item.is_featured;
    if (activeFilter !== 'all') {
      const matchTag = item.tags?.some((t) => t.includes(activeFilter));
      const matchClient = item.client_name?.includes(activeFilter);
      const matchTitle = item.title?.includes(activeFilter);
      return matchTag || matchClient || matchTitle;
    }
    return true;
  });

  const handlePrevPhoto = (id: string, total: number) => {
    setActivePhotoIdx((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total,
    }));
  };

  const handleNextPhoto = (id: string, total: number) => {
    setActivePhotoIdx((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total,
    }));
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20">
      {/* 1. 상단 글로벌 네비게이션 바 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-105 transition-transform">
              은
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-stone-900">
                {cafeInfo?.name || '카페 은달'}
              </span>
              <span className="text-[10px] text-amber-700 font-bold block -mt-0.5">
                단체 & 케이터링 포트폴리오
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>실시간 견적서 작성하기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 히어로 배너 */}
      <section className="bg-gradient-to-b from-amber-900 via-stone-900 to-stone-950 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>수원 1등 단체 케이터링 & 샌드위치 납품</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {cafeInfo?.portfolio_title ? (
              <span className="whitespace-pre-line">{cafeInfo.portfolio_title}</span>
            ) : (
              <>
                믿고 맡기는 정시 배달과 신선함,
                <br />
                <span className="text-amber-400">은달의 실제 단체 납품 사례</span>를 확인하세요
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl mx-auto leading-relaxed">
            {cafeInfo?.portfolio_subtitle ? (
              <span className="whitespace-pre-line">{cafeInfo.portfolio_subtitle}</span>
            ) : (
              <>
                수원시청, 대학교, 대기업 워크숍, 병원, 학술 심포지엄까지!
                <br className="hidden sm:inline" />
                당일 새벽 제조한 신선한 수제 샌드위치와 캔시머 보냉 음료로 소중한 행사를 완벽하게 채워드립니다.
              </>
            )}
          </p>

          {/* 신뢰 지표 3대 배지 */}
          <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto pt-4 text-[11px] sm:text-xs">
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 text-center">
              <Clock className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <strong className="block font-bold">오차 없는 정시배송</strong>
              <span className="text-[10px] text-stone-300">이른 아침 행사도 OK</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 text-center">
              <ShieldCheck className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <strong className="block font-bold">당일 새벽 제조</strong>
              <span className="text-[10px] text-stone-300">위생 100% 신선 포장</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 text-center">
              <Sparkles className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <strong className="block font-bold">개별 맞춤 라벨링</strong>
              <span className="text-[10px] text-stone-300">행사 스티커 무료 부착</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 필터 탭 바 */}
      <section className="max-w-6xl mx-auto px-4 -mt-5">
        <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-md flex items-center gap-1.5 overflow-x-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeFilter === opt.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. 포트폴리오 카드 피드 */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs">
            포트폴리오 사례를 불러오고 있습니다...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
            <Award className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-xs text-stone-500 font-bold">해당 카테고리의 납품 사례가 없습니다.</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-amber-600 font-bold underline"
            >
              전체 납품 사례 보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const photoList = item.photos || [];
              const videoList = item.video_urls || [];
              const currPhotoIdx = activePhotoIdx[item.id] || 0;
              const currentPhoto = photoList[currPhotoIdx] || photoList[0];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* 사진/미디어 영역 */}
                  <div>
                    <div className="relative aspect-video bg-stone-100 overflow-hidden">
                      {currentPhoto ? (
                        <img
                          src={currentPhoto}
                          alt={item.title}
                          onClick={() => setActiveImageModal(currentPhoto)}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[10px] mt-1">현장 사진</span>
                        </div>
                      )}

                      {/* 사진 슬라이드 좌우 화살표 */}
                      {photoList.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevPhoto(item.id, photoList.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-md transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextPhoto(item.id, photoList.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-md transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-2xs text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
                            {currPhotoIdx + 1} / {photoList.length}
                          </div>
                        </>
                      )}

                      {/* 뱃지들 */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                        {item.is_featured && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-stone-950 font-black text-[10px] shadow-sm flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-stone-950" />
                            <span>추천 납품</span>
                          </span>
                        )}
                      </div>

                      {/* 영상 버튼 */}
                      {videoList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveVideoModal(videoList[0])}
                          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-purple-700/90 hover:bg-purple-800 text-white text-[10px] font-bold shadow-md backdrop-blur-2xs flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>영상 보기</span>
                        </button>
                      )}
                    </div>

                    {/* 카드 본문 */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold mb-0.5">
                          <Building className="w-3 h-3" />
                          <span>{item.client_name}</span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                      </div>

                      {/* 행사일 / 납품 규모 */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-2xl border border-stone-100">
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{item.event_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                          <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{item.event_scale}</span>
                        </div>
                      </div>

                      {/* 납품 메뉴 구성 */}
                      {item.item_summary && (
                        <div className="text-[11px] text-stone-700 bg-amber-50/50 p-2.5 rounded-2xl border border-amber-100/70 leading-relaxed">
                          <span className="font-bold text-amber-900 block mb-0.5">
                            🥪 납품 세트 구성:
                          </span>
                          <span>{item.item_summary}</span>
                        </div>
                      )}

                      {/* 행사 후기 및 특징 */}
                      {item.content && (
                        <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                          {item.content}
                        </p>
                      )}

                      {/* 태그들 */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          {item.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[10px] font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 하단 자연스러운 전환 CTA 버튼 */}
                  <div className="p-4 pt-0">
                    <Link
                      href={`/?portfolio_id=${item.id}&portfolio_title=${encodeURIComponent(item.title)}&portfolio_items=${encodeURIComponent(item.item_summary || '')}&custom_memo=${encodeURIComponent(`${item.client_name} 납품 구성 (${item.item_summary || item.title}) 참고 견적 요청`)}`}
                      className="w-full py-2.5 px-3 rounded-2xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs group-hover:bg-amber-600 active:scale-98"
                    >
                      <span>이 구성 그대로 견적 문의하기</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. 하단 케이터링 문의 배너 */}
      <section className="max-w-4xl mx-auto px-4 mt-16">
        <div className="bg-gradient-to-r from-stone-900 to-amber-950 text-white p-8 sm:p-10 rounded-3xl shadow-xl border border-stone-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black">
            우리 단체·기관도 맞춤 견적이 필요하신가요?
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            원하시는 예산, 인원수, 선호하시는 음료·디저트 구성에 맞춰
            <br className="hidden sm:inline" />
            수원 전 지역 및 인접 권역으로 약속된 시간에 안전하게 직배송해 드립니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>온라인 실시간 견적서 작성</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {cafeInfo?.phone && (
              <a
                href={`tel:${cafeInfo.phone}`}
                className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm transition-colors border border-white/20 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>전화 상담 ({cafeInfo.phone})</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 영상 모달 */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            {activeVideoModal.includes('youtube.com') || activeVideoModal.includes('youtu.be') ? (
              <iframe
                src={activeVideoModal.replace('watch?v=', 'embed/')}
                title="현장 영상"
                className="w-full aspect-video border-0"
                allowFullScreen
              />
            ) : (
              <video
                src={activeVideoModal}
                controls
                autoPlay
                className="w-full aspect-video object-contain bg-black"
              />
            )}
          </div>
        </div>
      )}

      {/* 이미지 풀스크린 모달 */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={activeImageModal}
              alt="납품 현장 사진 확대"
              className="w-full h-full object-contain max-h-[85vh] rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
