'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Video,
  ExternalLink,
  Play,
  Film,
} from 'lucide-react';
import { Menu } from '@/lib/types';

interface MenuDetailModalProps {
  menu: Menu | null;
  isOpen: boolean;
  onClose: () => void;
  currentQuantity: number;
  onUpdateQuantity: (menu: Menu, newQty: number) => void;
}

// 유튜브/비디오 임베드 URL 변환 헬퍼
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    // 1. YouTube Shorts: https://youtube.com/shorts/VIDEO_ID
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    // 2. YouTube 일반 watch: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // 3. YouTube 단축 URL: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // 4. 이미 embed 형식인 경우
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

export default function MenuDetailModal({
  menu,
  isOpen,
  onClose,
  currentQuantity,
  onUpdateQuantity,
}: MenuDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [addedEffect, setAddedEffect] = useState(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  // 사진 롤링(캐러셀) 상태
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isAutoRolling, setIsAutoRolling] = useState(true);

  // 동영상 선택 상태
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);

  // 대표 이미지 + 추가 이미지 합산 목록
  const allImages = React.useMemo(() => {
    if (!menu) return [];
    const base = menu.image_url ? [menu.image_url] : [];
    const additional = Array.isArray(menu.additional_images) ? menu.additional_images.filter(Boolean) : [];
    const combined = [...base, ...additional];
    return combined.length > 0
      ? combined
      : ['https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80'];
  }, [menu]);

  const videoList = React.useMemo(() => {
    if (!menu || !Array.isArray(menu.video_urls)) return [];
    return menu.video_urls.filter(Boolean);
  }, [menu]);

  useEffect(() => {
    if (menu) {
      setQty(currentQuantity > 0 ? currentQuantity : 1);
      setAddedEffect(false);
      setCurrentImageIdx(0);
      setCurrentVideoIdx(0);
      setActiveTab('photos');
      setIsAutoRolling(true);
    }
  }, [menu, currentQuantity, isOpen]);

  // 사진 자동 롤링 효과 (사진이 2장 이상이고 롤링 활성화 상태일 때 3.5초 주기)
  useEffect(() => {
    if (!isOpen || allImages.length <= 1 || !isAutoRolling || activeTab !== 'photos') return;

    const timer = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % allImages.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [isOpen, allImages.length, isAutoRolling, activeTab]);

  if (!isOpen || !menu) return null;

  const handleApply = () => {
    onUpdateQuantity(menu, qty);
    setAddedEffect(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleMinus = () => {
    if (qty > 1) {
      setQty(qty - 1);
    } else {
      setQty(0);
    }
  };

  const handlePlus = () => {
    setQty(qty + 1);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoRolling(false);
    setCurrentImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoRolling(false);
    setCurrentImageIdx((prev) => (prev + 1) % allImages.length);
  };

  const activeVideoUrl = videoList[currentVideoIdx] || '';
  const embedVideoUrl = getEmbedUrl(activeVideoUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 transform transition-all animate-scale-up max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsAutoRolling(false)}
        onMouseLeave={() => setIsAutoRolling(true)}
      >
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-xs transition-colors"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 상단 사진 롤링(캐러셀) 및 영상 뷰어 영역 */}
        <div className="relative w-full h-64 sm:h-72 bg-stone-900 shrink-0 overflow-hidden">
          {activeTab === 'photos' ? (
            /* 📸 사진 롤링 캐러셀 */
            <div className="relative w-full h-full">
              <img
                src={allImages[currentImageIdx]}
                alt={`${menu.name} 사진 ${currentImageIdx + 1}`}
                className="w-full h-full object-cover transition-all duration-500"
              />

              {menu.is_sold_out && (
                <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-sm font-bold shadow-lg">
                    현재 품절 (Sold Out)
                  </span>
                </div>
              )}

              {/* 좌우 넘김 버튼 (사진이 2장 이상일 때 표시) */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-90"
                    aria-label="이전 사진"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-90"
                    aria-label="다음 사진"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* 하단 롤링 인디케이터 (도트 + 페이지 번호) */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                    {currentImageIdx + 1} / {allImages.length}
                  </div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoRolling(false);
                          setCurrentImageIdx(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          currentImageIdx === idx ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/60'
                        }`}
                        aria-label={`${idx + 1}번째 사진 보기`}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute bottom-3 left-3">
                <span className="px-2 py-0.5 rounded-md bg-stone-900/80 text-amber-200 text-[10px] font-semibold backdrop-blur-xs">
                  은달 수제 메뉴
                </span>
              </div>
            </div>
          ) : (
            /* 🎬 영상 플레이어 */
            <div className="relative w-full h-full bg-black flex flex-col justify-center items-center">
              {embedVideoUrl ? (
                <iframe
                  src={embedVideoUrl}
                  title={`${menu.name} 설명 영상`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeVideoUrl ? (
                <video
                  src={activeVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                >
                  브라우저가 비디오 재생을 지원하지 않습니다.
                </video>
              ) : (
                <div className="text-stone-400 text-xs">등록된 설명 영상이 없습니다.</div>
              )}
            </div>
          )}
        </div>

        {/* 탭 바: 사진 / 설명 영상 (영상이 1개 이상 있을 때 노출) */}
        {videoList.length > 0 && (
          <div className="px-4 pt-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`px-3 py-1.5 rounded-t-xl font-bold transition-all border-b-2 ${
                  activeTab === 'photos'
                    ? 'border-amber-700 text-amber-900 bg-white shadow-2xs'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                메뉴 사진 ({allImages.length}장 롤링)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`px-3 py-1.5 rounded-t-xl font-bold flex items-center gap-1 transition-all border-b-2 ${
                  activeTab === 'videos'
                    ? 'border-red-600 text-red-700 bg-white shadow-2xs'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-red-600" />
                <span>설명 영상 ({videoList.length}개)</span>
              </button>
            </div>

            {/* 영상 탭일 때 복수 영상 선택 버튼들 */}
            {activeTab === 'videos' && videoList.length > 1 && (
              <div className="flex items-center gap-1 pb-1">
                {videoList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentVideoIdx(idx)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      currentVideoIdx === idx
                        ? 'bg-red-600 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    영상 {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 상세 설명 및 가격 본문 */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">{menu.name}</h3>
            <p className="text-lg font-black text-amber-900 mt-1">
              {menu.price.toLocaleString()}원
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 text-stone-700 text-xs leading-relaxed whitespace-pre-line">
            {menu.description || '은달 카페만의 정성과 신선함을 담아 준비한 대표 메뉴입니다.'}
          </div>

          {/* 알레르기 유발 성분 안내 영역 */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-950 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>알레르기 유발 성분 안내</span>
            </div>
            {menu.allergens ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {menu.allergens.split(/[,/]/).map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-xs"
                  >
                    {item.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-stone-500">
                해당 메뉴는 별도의 알레르기 유발 성분 표기가 없거나 안전합니다. 특이 체질인 경우 주문 전 매장으로 문의해주세요.
              </p>
            )}
          </div>

          {/* 수량 조절 및 소계 */}
          {!menu.is_sold_out && (
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">주문 수량</span>
                <div className="flex items-center gap-3 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
                  <button
                    type="button"
                    onClick={handleMinus}
                    className="w-8 h-8 rounded-xl bg-white text-stone-700 flex items-center justify-center hover:bg-stone-200 font-bold transition-colors shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-stone-900 text-sm font-mono">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={handlePlus}
                    className="w-8 h-8 rounded-xl bg-white text-stone-700 flex items-center justify-center hover:bg-stone-200 font-bold transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-stone-500 font-medium">예상 견적 금액</span>
                <span className="font-extrabold text-stone-900 text-base">
                  {(menu.price * qty).toLocaleString()}원
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 하단 담기 / 수량적용 버튼 */}
        <div className="p-4 border-t border-stone-100 bg-white shrink-0">
          {menu.is_sold_out ? (
            <button
              disabled
              className="w-full py-3.5 rounded-2xl bg-stone-200 text-stone-400 font-bold text-sm cursor-not-allowed text-center"
            >
              품절된 메뉴입니다
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] ${
                addedEffect
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-amber-600 text-white'
              }`}
            >
              {addedEffect ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>견적서에 반영되었습니다!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {currentQuantity > 0 ? '견적서 수량 변경하기' : '견적서에 담기'} ({(menu.price * qty).toLocaleString()}원)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
