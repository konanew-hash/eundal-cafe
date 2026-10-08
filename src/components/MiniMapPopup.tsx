'use client';

import React from 'react';
import { X, ExternalLink, MapPin, Copy, Check, Navigation } from 'lucide-react';

interface MiniMapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  storeName?: string;
  address: string;
  detailAddress?: string;
  postalCode?: string;
  naverPlaceUrl?: string;
  phone?: string;
}

export default function MiniMapPopup({
  isOpen,
  onClose,
  title = '위치 지도 확인',
  storeName,
  address,
  detailAddress,
  naverPlaceUrl,
  phone,
}: MiniMapPopupProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !address) return null;

  const cleanAddress = address.replace(/\(우:[^)]+\)/g, '').trim();
  const displayName = storeName || title;

  // 네이버 플레이스 연동 링크 우선순위
  const naverUrl =
    naverPlaceUrl && naverPlaceUrl.trim()
      ? naverPlaceUrl.trim()
      : `https://map.naver.com/p/search/${encodeURIComponent(`${displayName} ${cleanAddress}`)}`;

  const kakaoUrl = `https://map.kakao.com/link/search/${encodeURIComponent(`${displayName} ${cleanAddress}`)}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cleanAddress}`)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${cleanAddress} ${detailAddress || ''}`.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-[#03C75A] text-white flex items-center justify-center font-black text-xs shrink-0">
              N
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-xs truncate text-white">{displayName}</h3>
              <p className="text-[10px] text-emerald-300 font-medium truncate">네이버 플레이스 기반 실위치 매핑</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="지도 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 주소 및 매장 실위치 정보 */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              네이버 플레이스 공식 위치 연동
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>주소복사</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-0.5">
            <p className="font-bold text-stone-900 text-xs sm:text-sm break-all leading-snug">
              {cleanAddress} {detailAddress && <span className="text-amber-900 font-bold">({detailAddress})</span>}
            </p>
            {phone && (
              <p className="text-[11px] text-stone-500">
                매장 직통 연락처: <span className="font-bold text-stone-700">{phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* 네이버 플레이스 비주얼 인터랙티브 카드 */}
        <div className="p-4 bg-gradient-to-b from-stone-50 via-white to-stone-50 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden border-b border-stone-100">
          <div className="w-14 h-14 rounded-2xl bg-[#03C75A]/10 border-2 border-[#03C75A]/30 flex items-center justify-center text-[#03C75A] shadow-inner">
            <MapPin className="w-7 h-7" />
          </div>

          <div className="space-y-1 max-w-xs">
            <h4 className="font-bold text-stone-900 text-sm">{displayName}</h4>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              우편번호 기반 오차를 없애고 실제 점포 건물의 네이버 지도 등록 좌표로 안내해 드립니다.
            </p>
          </div>

          {/* 원클릭 네이버 플레이스 바로가기 버튼 */}
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-[#03C75A] hover:bg-[#02b150] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>네이버 플레이스에서 실위치 & 길찾기 보기</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

        {/* 하단 퀵 액션: 카카오 / 구글 보조 링크 및 닫기 */}
        <div className="p-3 bg-white space-y-2">
          <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-[#FEE500] hover:bg-[#ebd300] text-stone-900 font-bold rounded-lg flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <span>카카오맵</span>
              <ExternalLink className="w-2.5 h-2.5 text-stone-700" />
            </a>
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <span>구글 지도</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors"
          >
            확인 및 지도 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
