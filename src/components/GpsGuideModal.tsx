'use client';

import React, { useState } from 'react';
import {
  X,
  Navigation,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RotateCw,
  LocateFixed,
  Lock,
} from 'lucide-react';
import { getBrowserLocation } from '@/lib/geoUtils';

interface GpsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSuccess?: (loc: { latitude: number; longitude: number; address: string }) => void;
}

export default function GpsGuideModal({ isOpen, onClose, onLocationSuccess }: GpsGuideModalProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'locating' | 'success' | 'denied'>('idle');
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);

  if (!isOpen) return null;

  // 브라우저에 실제 위치 권한 팝업을 즉시 트리거하는 함수
  // 이 함수가 실행되어야 브라우저 사이트 설정의 권한 목록에 '위치' 항목이 등록됩니다.
  const handleRequestPermission = async () => {
    setTestStatus('locating');
    try {
      const loc = await getBrowserLocation();
      setTestStatus('success');
      setCurrentAddress(loc.address || `위도 ${loc.latitude.toFixed(4)}, 경도 ${loc.longitude.toFixed(4)}`);
      setAccuracy(loc.accuracy);
      if (onLocationSuccess) {
        onLocationSuccess({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || '',
        });
      }
    } catch (err: any) {
      console.warn('위치 권한 요청 실패/거부:', err);
      setTestStatus('denied');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 text-xs text-stone-900 max-h-[88vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <Navigation className="w-4 h-4 text-amber-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                브라우저 위치 권한 및 GPS 안내
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">
                원클릭 배달주소 자동입력 & 픽업 매장 거리 안내
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors shrink-0"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 안내 (모바일 부드러운 스크롤) */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* 핵심: 브라우저 위치 권한 즉시 트리거 카드 */}
          <div className="p-3.5 rounded-2xl border bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border-amber-300 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <LocateFixed className="w-4 h-4 text-amber-700" />
                위치 권한 활성화 및 상태 확인
              </span>
              {testStatus === 'success' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  허용됨
                </span>
              )}
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed">
              브라우저의 사이트 권한 목록에 <strong>'위치'</strong>를 등록하고 정상 작동시키려면,
              아래 버튼을 눌러 브라우저 팝업에서 <strong>[허용]</strong>을 선택해주세요.
            </p>

            {/* 권한 요청 / 재측정 버튼 */}
            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={testStatus === 'locating'}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 ${testStatus === 'locating' ? 'animate-spin text-amber-400' : ''}`} />
              <span>
                {testStatus === 'locating'
                  ? '브라우저 권한 요청 중... (허용을 눌러주세요)'
                  : testStatus === 'success'
                  ? '위치 다시 측정 및 권한 갱신'
                  : '📍 지금 브라우저 위치 권한 허용하기'}
              </span>
            </button>

            {/* 결과 피드백 */}
            {testStatus === 'success' && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] space-y-0.5 animate-fade-in">
                <div className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>위치 권한이 성공적으로 허용되었습니다!</span>
                </div>
                <p className="text-stone-700 pl-4.5 truncate">
                  <strong>현재 위치:</strong> {currentAddress}
                  {accuracy && ` (오차 ±${accuracy}m)`}
                </p>
                <p className="text-[10px] text-emerald-700 pl-4.5">
                  이제 주문서에서 '내 GPS 위치로 자동 입력' 버튼을 이용하실 수 있습니다.
                </p>
              </div>
            )}

            {testStatus === 'denied' && (
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-red-900 text-[11px] space-y-1 animate-fade-in">
                <div className="flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>브라우저 위치 권한이 차단되어 있습니다.</span>
                </div>
                <p className="text-[10px] text-red-800 leading-snug">
                  주소창 좌측의 <strong>자물쇠 🔒 아이콘</strong>을 누른 후 <strong>[위치]</strong>를 <strong>'허용'</strong>으로 변경하고 새로고침해주세요.
                </p>
              </div>
            )}
          </div>

          {/* 1. 스마트폰(모바일) 설정 방법 */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-1.5 text-stone-900 font-bold">
              <Smartphone className="w-3.5 h-3.5 text-amber-700" />
              <span>스마트폰 기기별 위치 권한 켜는 법</span>
            </div>

            <div className="space-y-2 text-[11px] text-stone-700 leading-normal pl-0.5">
              <div className="p-2 bg-white rounded-xl border border-stone-200/80">
                <p className="font-bold text-stone-900">📱 아이폰 (iOS Safari)</p>
                <p className="text-[10px] text-stone-600 mt-0.5">
                  1. 주소창 좌측 <strong>[가A]</strong> 버튼 터치 ➔ <strong>[웹사이트 설정]</strong> ➔ <strong>위치 [허용]</strong>
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  * 안 뜰 경우: 아이폰 [설정] ➔ [개인정보 보호] ➔ [위치 서비스: 켬]
                </p>
              </div>

              <div className="p-2 bg-white rounded-xl border border-stone-200/80">
                <p className="font-bold text-stone-900">🤖 안드로이드 (갤럭시 Chrome / 삼성인터넷)</p>
                <p className="text-[10px] text-stone-600 mt-0.5">
                  1. 상단 알림창을 아래로 내려 <strong>'위치(GPS)'</strong> 켜기
                </p>
                <p className="text-[10px] text-stone-600 mt-0.5">
                  2. 주소창 좌측 <strong>자물쇠 🔒 또는 설정 아이콘</strong> ➔ <strong>[권한]</strong> ➔ <strong>위치 [허용]</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 2. PC / 노트북 브라우저 설정 방법 */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-1.5 text-stone-900 font-bold">
              <Monitor className="w-3.5 h-3.5 text-amber-700" />
              <span>PC / 노트북 브라우저 (Chrome, Edge 등)</span>
            </div>
            <div className="text-[11px] text-stone-700 space-y-1 pl-1">
              <p className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-stone-500" />
                브라우저 주소창 좌측 <strong>자물쇠 🔒(사이트 정보)</strong> 클릭
              </p>
              <p>
                ➔ <strong>'위치'</strong> 항목을 <strong>[허용]</strong>으로 변경 ➔ 페이지 새로고침
              </p>
            </div>
          </div>

          {/* 인앱 브라우저 주의사항 */}
          <div className="p-3 bg-red-50/70 rounded-2xl border border-red-200 text-[11px] text-red-900 space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>카카오톡 / 네이버 인앱 브라우저 주의</span>
            </div>
            <p className="text-[10px] text-red-800 leading-relaxed">
              카카오톡 링크로 접속 시 위치 권한이 제한될 수 있습니다. 우측 하단 <strong>메뉴(⋮ 또는 ···) ➔ '다른 브라우저로 열기(Safari / Chrome)'</strong>를 선택하시면 원활하게 작동합니다.
            </p>
          </div>

          {/* 안전 및 보관 정책 */}
          <div className="p-2.5 bg-stone-100 rounded-xl text-[10px] text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-600 shrink-0" />
            <span>수집된 위치 정보는 견적 확인 용도로만 사용되며, 배달 완료 14일 후 영구 파기됩니다.</span>
          </div>
        </div>

        {/* 하단 확인 버튼 */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-stone-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors shadow-sm active:scale-[0.99]"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
