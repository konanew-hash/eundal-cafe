'use client';

import React from 'react';
import { CafeInfo } from '@/lib/types';
import {
  ShieldCheck,
  Phone,
  Clock,
  MapPin,
  ExternalLink,
  Globe,
  FileText,
} from 'lucide-react';

interface FooterProps {
  cafe: CafeInfo | null;
  onOpenPrivacyPolicy: () => void;
}

export default function Footer({ cafe, onOpenPrivacyPolicy }: FooterProps) {
  const currentYear = new Date().getFullYear();

  // SNS 링크 기본값 fallback
  const instagramUrl =
    cafe?.instagram_url || 'https://www.instagram.com/explore/tags/%EC%9D%80%EB%8B%AC%EC%B9%B4%ED%8E%98/';
  const youtubeUrl =
    cafe?.youtube_url || 'https://www.youtube.com/results?search_query=%EC%9D%80%EB%8B%AC%EC%B9%B4%ED%8E%98';
  const naverUrl =
    cafe?.naver_url || `https://map.naver.com/v5/search/${encodeURIComponent(cafe?.address || '은달카페')}`;
  const googleUrl =
    cafe?.google_url || `https://www.google.com/maps/search/${encodeURIComponent(cafe?.address || '은달카페')}`;

  const ownerName = cafe?.owner_name || '김은달';
  const businessNumber = cafe?.business_number || '123-45-67890';
  const privacyOfficer = cafe?.privacy_officer || ownerName;
  const address = cafe?.address || '서울특별시 마포구 월드컵북로 120 (성산동, 은달빌딩)';
  const phone = cafe?.phone || '02-1234-5678';
  const businessHours = cafe?.business_hours || '매일 09:00 ~ 21:00 (연중무휴)';

  return (
    <footer className="mt-12 bg-stone-900 text-stone-300 border-t border-stone-800 text-xs">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* 1. 브랜드 및 슬로건 */}
        <div className="space-y-1.5 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-white tracking-tight">
              {cafe?.name || '은달 (Eundal Cafe)'}
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              단체주문 & 픽업 전문
            </span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium">
            {cafe?.slogan || '은은한 달빛 아래, 깊고 그윽한 한 잔의 여유'}
          </p>
        </div>

        {/* 2. 홍보용 SNS & 채널 바로가기 링크 버튼 그리드 (요구사항) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-200">
              은달 공식 SNS & 채널 바로가기
            </span>
            <span className="text-[10px] text-stone-500">새창 열림</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* 인스타그램 */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#833ab4]/20 via-[#fd1d1d]/20 to-[#fcb045]/20 hover:from-[#833ab4]/30 hover:to-[#fcb045]/30 border border-pink-500/30 text-pink-200 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span className="font-bold text-[11px]">인스타그램</span>
              </div>
              <ExternalLink className="w-3 h-3 text-pink-400/70" />
            </a>

            {/* 유튜브 */}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-800/40 text-red-200 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-red-500 fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="font-bold text-[11px]">유튜브 채널</span>
              </div>
              <ExternalLink className="w-3 h-3 text-red-400/70" />
            </a>

            {/* 네이버 플레이스 */}
            <a
              href={naverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#03C75A] text-white font-black text-[10px] flex items-center justify-center group-hover:scale-110 transition-transform">
                  N
                </div>
                <span className="font-bold text-[11px]">네이버 플레이스</span>
              </div>
              <ExternalLink className="w-3 h-3 text-emerald-400/70" />
            </a>

            {/* 구글 지도 / 프로필 */}
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-950/60 border border-blue-800/40 text-blue-200 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[11px]">구글 지도</span>
              </div>
              <ExternalLink className="w-3 h-3 text-blue-400/70" />
            </a>
          </div>
        </div>

        {/* 3. 고객센터 및 매장 운영 안내 */}
        <div className="p-3 bg-stone-800/50 rounded-2xl border border-stone-800 space-y-1.5 text-[11px] text-stone-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Phone className="w-3.5 h-3.5" />
            <span>고객센터 및 단체 견적 문의: {phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-400">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>운영시간: {businessHours}</span>
          </div>
          <div className="flex items-start gap-1.5 text-stone-400">
            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
            <span className="break-all">{address}</span>
          </div>
        </div>

        {/* 4. 사업자 정보 및 법적 고지 (전자상거래법 & 개인정보보호법) */}
        <div className="space-y-1.5 text-[10.5px] text-stone-400 leading-relaxed pb-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span><strong>상호명:</strong> {cafe?.name || '은달'}</span>
            <span className="text-stone-600">|</span>
            <span><strong>대표자:</strong> {ownerName}</span>
            <span className="text-stone-600">|</span>
            <span><strong>사업자등록번호:</strong> {businessNumber}</span>
          </div>
          <div>
            <span><strong>개인정보보호책임자:</strong> {privacyOfficer}</span>
            <span className="text-stone-600 mx-2">|</span>
            <span><strong>통신판매업신고:</strong> 사업장 소재지 지자체 신고 완료</span>
          </div>
          <p className="text-stone-500 pt-1">
            * 은달 카페는 통신판매중개자 또는 통신판매업자로서 관련 법령을 준수하며, 소비자의 개인정보 보호 및 주문 견적 처리 권리를 보장합니다.
          </p>
        </div>

        {/* 5. 개인정보처리방침 전문 보기 버튼 & 이용약관 */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-200 underline underline-offset-4 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>개인정보처리방침 전문 보기</span>
          </button>

          <span className="text-[10px] text-stone-500">
            © {currentYear} Eundal. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
