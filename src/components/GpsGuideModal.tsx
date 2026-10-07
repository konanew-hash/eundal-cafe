'use client';

import React from 'react';
import {
  X,
  Navigation,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface GpsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GpsGuideModal({ isOpen, onClose }: GpsGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 text-xs text-stone-900 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Navigation className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">GPS 위치 정보 수집 및 설정 안내</h3>
              <p className="text-[11px] text-stone-500">정확한 배달 및 픽업 관제를 위한 설정 안내</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 안내 */}
        <div className="py-3 overflow-y-auto space-y-4 flex-1 pr-0.5">
          {/* 수집 목적 및 방식 안내 */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>은달 카페의 GPS 위치 정보 수집 기준</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              은달 카페는 부정 견적 요청 방지와 신속한 라이더 배차 및 매장 픽업 확인을 위해,
              단말기의 <strong>실제 GPS 위성 좌표(위도·경도)</strong>를 브라우저 Geolocation API를 통해 안전하게 수집합니다.
            </p>
            <p className="text-[10px] text-stone-500">
              * 수집된 위치 정보는 암호화되어 전송되며, 배달 완료 14일 후 데이터베이스에서 자동으로 영구 파기됩니다.
            </p>
          </div>

          {/* 1. 스마트폰(모바일) 설정 방법 */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-stone-900 font-bold">
              <Smartphone className="w-4 h-4 text-amber-700" />
              <span>스마트폰(휴대폰) 설정 가이드</span>
            </div>

            <div className="space-y-2 text-[11px] text-stone-700 leading-normal pl-1">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong>기기 위치(GPS) 켜기:</strong> 상단 알림창을 아래로 내려 <strong>'위치'</strong> 또는 <strong>'GPS'</strong>가 켜져 있는지 확인합니다.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>아이폰 (Safari):</strong> 화면 좌측 하단 주소창의 <strong>[가A]</strong> 버튼 터치 ➔ <strong>[웹사이트 설정]</strong> ➔ <strong>위치 [허용]</strong> 선택.
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    (또는 설정 앱 ➔ 개인정보 보호 및 보안 ➔ 위치 서비스 ➔ Safari 웹 사이트 '앱을 사용하는 동안')
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong>안드로이드 (Chrome / 삼성인터넷):</strong> 상단 주소창 좌측의 <strong>자물쇠 🔒</strong> 또는 <strong>설정 아이콘</strong> 터치 ➔ <strong>권한 ➔ 위치 [허용]</strong> 선택.
                </div>
              </div>
            </div>
          </div>

          {/* 2. PC / 노트북 설정 방법 */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-stone-900 font-bold">
              <Monitor className="w-4 h-4 text-amber-700" />
              <span>PC / 노트북 브라우저 설정 가이드</span>
            </div>

            <div className="space-y-2 text-[11px] text-stone-700 leading-normal pl-1">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  브라우저 주소창 좌측의 <strong>자물쇠 🔒(사이트 정보)</strong>를 클릭합니다.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>'위치'</strong> 항목의 차단을 <strong>'허용'</strong>으로 변경한 뒤 <strong>새로고침(F5)</strong>을 누릅니다.
                </div>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                * PC 환경은 Wi-Fi 및 유선 네트워크 기반으로 좌표가 산정되므로 스마트폰보다 오차 범위가 다소 넓을 수 있습니다.
              </p>
            </div>
          </div>

          {/* 인앱 브라우저 주의사항 */}
          <div className="p-3 bg-red-50/70 rounded-2xl border border-red-200 text-[11px] text-red-900 space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>카카오톡 / 네이버 인앱 브라우저 안내</span>
            </div>
            <p className="text-[10px] text-red-800 leading-relaxed">
              카카오톡이나 네이버 앱 내부 브라우저에서는 보안 정책상 GPS 수신이 차단될 수 있습니다.
              화면 우측 하단 <strong>메뉴(⋮ 또는 ...) ➔ '다른 브라우저로 열기(Safari / Chrome)'</strong>를 이용하시면 정확한 GPS 측정이 가능합니다.
            </p>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
