'use client';

import React from 'react';
import { X, MapPin, Clock, Phone, Moon } from 'lucide-react';
import { CafeInfo } from '@/lib/types';

interface CafeIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafe: CafeInfo | null;
}

export default function CafeIntroModal({ isOpen, onClose, cafe }: CafeIntroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
        {/* 상단 대표 이미지 및 닫기 버튼 */}
        <div className="relative h-48 sm:h-56 w-full bg-stone-900">
          <img
            src={cafe?.hero_image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'}
            alt="카페 은달 전경"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 이미지 위 브랜드 로고 및 타이틀 */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5 fill-amber-300 stroke-amber-200" />
              </div>
              <span className="text-xs uppercase tracking-widest text-amber-200 font-medium">Specialty Cafe</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{cafe?.name || '카페 은달'}</h2>
            <p className="text-xs text-stone-300 mt-0.5">{cafe?.slogan || '은은한 달빛 아래, 깊고 그윽한 한 잔의 여유'}</p>
          </div>
        </div>

        {/* 본문 정보 */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* 소개글 */}
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>✦</span> 은달 이야기
            </h3>
            <p className="text-stone-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line">
              {cafe?.description || '은달은 엄선된 스페셜티 원두와 정성으로 구워낸 수제 디저트로 일상의 따뜻한 쉼표를 전합니다.'}
            </p>
          </div>

          {/* 매장 운영 및 위치 정보 (1호점 & 2호점 구분) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 px-1">
              <span>은달 매장 안내 (1호점 & 2호점)</span>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">픽업 & 배달</span>
            </div>

            {/* 1호점 카드 */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200/50">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                  <span>{cafe?.store1_name || '은달 1호점 (조원)'}</span>
                </span>
                <span className="text-[10px] text-amber-800 font-bold">본점</span>
              </div>
              <div className="space-y-1 text-xs text-stone-700">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="font-medium text-stone-800 leading-snug">
                    {cafe?.store1_address || cafe?.address || '경기 수원시 장안구 조원로 16 상가동 1층 108-1'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>운영시간: {cafe?.store1_business_hours || cafe?.business_hours || '09:00 ~ 21:00'}</span>
                </div>
                {cafe?.store1_phone && (
                  <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>연락처: {cafe.store1_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2호점 카드 */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-stone-800 text-white text-[10px] font-black flex items-center justify-center">2</span>
                  <span>{cafe?.store2_name || '은달 2호점 (파장)'}</span>
                </span>
                <span className="text-[10px] text-stone-600 font-bold">북수원점</span>
              </div>
              <div className="space-y-1 text-xs text-stone-700">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-600 shrink-0 mt-0.5" />
                  <p className="font-medium text-stone-800 leading-snug">
                    {cafe?.store2_address || '경기 수원시 장안구 경수대로1043번길 3 은달 파장2호점'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>운영시간: {cafe?.store2_business_hours || cafe?.business_hours || '09:00 ~ 21:00'}</span>
                </div>
                {cafe?.store2_phone && (
                  <div className="flex items-center gap-1.5 text-stone-600 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>연락처: {cafe.store2_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 은달 공식 SNS 4종 채널 바로가기 */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                <span>공식 SNS & 지도 채널</span>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                  홍보 채널
                </span>
              </span>
              <span className="text-[10px] text-stone-400">클릭 시 공식 페이지로 이동</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* 1. 인스타그램 */}
              <a
                href={cafe?.instagram_url || 'https://instagram.com/eundal_cafe'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-pink-200/80 hover:bg-pink-50 transition-all text-stone-800 group"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-stone-900 group-hover:text-pink-600 transition-colors">인스타그램</div>
                  <div className="text-[9px] text-stone-500 truncate">소식 & 사진</div>
                </div>
              </a>

              {/* 2. 유튜브 */}
              <a
                href={cafe?.youtube_url || 'https://youtube.com/@eundal_cafe'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-200/80 hover:bg-red-50 transition-all text-stone-800 group"
              >
                <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-stone-900 group-hover:text-red-600 transition-colors">유튜브 채널</div>
                  <div className="text-[9px] text-stone-500 truncate">제조 영상 보기</div>
                </div>
              </a>

              {/* 3. 네이버 플레이스 */}
              <a
                href={cafe?.naver_url || 'https://map.naver.com/p/search/%EC%9D%80%EB%8B%AC%EC%B9%B4%ED%8E%98'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-200/80 hover:bg-emerald-50 transition-all text-stone-800 group"
              >
                <div className="w-6 h-6 rounded-lg bg-[#03C75A] flex items-center justify-center text-white shrink-0 font-black text-xs shadow-2xs group-hover:scale-105 transition-transform">
                  N
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">네이버 플레이스</div>
                  <div className="text-[9px] text-stone-500 truncate">리뷰 & 길찾기</div>
                </div>
              </a>

              {/* 4. 구글 지도 */}
              <a
                href={cafe?.google_url || 'https://maps.google.com/?q=%EC%9D%80%EB%8B%AC%EC%B9%B4%ED%8E%98'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-200/80 hover:bg-blue-50 transition-all text-stone-800 group"
              >
                <div className="w-6 h-6 rounded-lg bg-[#4285F4] flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-stone-900 group-hover:text-blue-600 transition-colors">구글 지도</div>
                  <div className="text-[9px] text-stone-500 truncate">위치 확인</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* 하단 닫기 */}
        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-colors shadow-sm active:scale-[0.99]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
