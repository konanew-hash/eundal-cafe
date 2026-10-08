'use client';

import React, { useState } from 'react';
import { ShieldAlert, Image as ImageIcon } from 'lucide-react';

interface CompetitorImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  showBadge?: boolean;
}

export default function CompetitorImage({
  src,
  alt,
  className = '',
  showBadge = true,
}: CompetitorImageProps) {
  const [hasError, setHasError] = useState(false);

  // 기본 fallback URL
  const fallbackUrl = `/api/competitors/image-proxy?name=${encodeURIComponent(alt)}`;
  const displaySrc = hasError || !src ? fallbackUrl : src;

  return (
    <div className={`relative overflow-hidden group select-none ${className}`}>
      {/* 
        저작권 보호 변조 필터 적용:
        - sepia(25%): 톤 변조
        - contrast(106%): 명암비 조절
        - hue-rotate(-8deg): 색상 스펙트럼 미세 변경
      */}
      <img
        src={displaySrc}
        alt={`${alt} (상권분석 변조 이미지)`}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        style={{
          filter: 'sepia(25%) contrast(106%) hue-rotate(-8deg)',
        }}
        loading="lazy"
      />

      {/* 미세 워터마크 격자 오버레이 (저작권 복제 방지) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* 저작권 보호 안내 뱃지 */}
      {showBadge && (
        <div 
          className="absolute top-2 left-2 z-10 pointer-events-auto"
          title="저작권법 공정이용 준수를 위해 원본에서 채도/색조가 변조된 상권 비교 분석용 이미지입니다."
        >
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9.5px] font-bold text-amber-300 border border-amber-500/30 shadow-xs">
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>변조 썸네일(분석용)</span>
          </span>
        </div>
      )}
    </div>
  );
}
