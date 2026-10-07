'use client';

import React from 'react';
import { X, ExternalLink, MapPin, Copy, Check } from 'lucide-react';

interface MiniMapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  address: string;
  detailAddress?: string;
  postalCode?: string;
  phone?: string;
}

export default function MiniMapPopup({
  isOpen,
  onClose,
  title = '위치 지도 확인',
  address,
  detailAddress,
  postalCode,
  phone,
}: MiniMapPopupProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !address) return null;

  const cleanAddress = address.replace(/\(우:[^)]+\)/g, '').trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(`${cleanAddress} ${detailAddress || ''}`.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-3.5 py-2.5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="font-bold text-xs truncate">{title}</h3>
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

        {/* 주소 정보 영역 */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            {postalCode && (
              <span className="font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                우편번호 {postalCode}
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-0.5 ml-auto font-medium"
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
          <p className="font-bold text-stone-900 text-xs break-all leading-tight">
            {cleanAddress} {detailAddress && <span className="text-stone-600 font-normal">({detailAddress})</span>}
          </p>
          {phone && (
            <p className="text-[10px] text-stone-500">
              연락처: <span className="font-bold text-stone-700">{phone}</span>
            </p>
          )}
        </div>

        {/* 구글 지도 임베드 프레임 (컴팩트 높이 190px) */}
        <div className="w-full h-48 bg-stone-100 relative">
          <iframe
            title="Google Map Preview"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${encodeURIComponent(cleanAddress)}&z=15&output=embed`}
          />
        </div>

        {/* 하단 퀵 액션: 외부 지도 앱 바로가기 */}
        <div className="p-2.5 bg-white border-t border-stone-100 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <a
              href={`https://map.naver.com/v5/search/${encodeURIComponent(cleanAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-[#03C75A] hover:bg-[#02b150] text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <span>네이버</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(cleanAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-[#FEE500] hover:bg-[#ebd300] text-stone-900 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <span>카카오</span>
              <ExternalLink className="w-2.5 h-2.5 text-stone-700" />
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors"
            >
              <span>구글</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-xs transition-colors"
          >
            지도 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
