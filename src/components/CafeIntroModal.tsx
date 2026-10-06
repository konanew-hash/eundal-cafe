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

          {/* 매장 운영 및 위치 정보 */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-stone-900">운영 및 배달 시간</p>
                <p className="text-xs text-stone-600 mt-0.5 leading-snug">
                  {cafe?.business_hours || '매일 09:00 ~ 21:30 (배달 주문 09:30 ~ 21:00)'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
              <MapPin className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-stone-900">매장 위치</p>
                <p className="text-xs text-stone-600 mt-0.5 leading-snug">
                  {cafe?.address || '서울특별시 마포구 월드컵북로 120 (연남동) 은달빌딩 1층'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
              <Phone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-stone-900">매장 연락처</p>
                <p className="text-xs text-stone-600 mt-0.5">
                  {cafe?.phone || '02-334-5821'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 닫기 */}
        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-colors shadow-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
