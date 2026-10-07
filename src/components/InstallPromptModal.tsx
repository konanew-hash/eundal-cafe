'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  Check,
  X,
  Sparkles,
  Copy,
  ExternalLink,
  Download,
  BookmarkPlus,
  ArrowDown,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function useHomeScreenInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // 1. Android / Chrome PWA 설치 프롬프트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 2. iOS 환경 감지
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // 3. 이미 홈 화면에 설치되어 실행 중인지 확인
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // 4. 인앱 브라우저 (카카오톡, 네이버, 인스타그램 등) 감지
    const inApp = /kakaotalk|naver|instagram|fbav|line/.test(ua);
    setIsInAppBrowser(inApp);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async (onRequireGuide: () => void) => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    // Android 네이티브 프롬프트가 지원되지 않거나 iOS/기타 환경인 경우 가이드 모달 띄우기
    onRequireGuide();
  };

  return {
    deferredPrompt,
    isIOS,
    isStandalone,
    isInAppBrowser,
    triggerInstall,
  };
}

export default function InstallPromptModal({ isOpen, onClose }: InstallPromptModalProps) {
  const [copied, setCopied] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(ua));
      setIsInApp(/kakaotalk|naver|instagram|fbav|line/.test(ua));
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('주소가 복사되었습니다: ' + window.location.href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 text-xs text-stone-900">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-900 text-amber-200 flex items-center justify-center">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">바탕화면에 즐겨찾기 추가</h3>
              <p className="text-[11px] text-stone-500">스마트폰 홈 화면에서 앱처럼 사용하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 은달 카페 앱 아이콘 미리보기 */}
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
          <img
            src="/icon.svg"
            alt="은달 카페 아이콘"
            className="w-12 h-12 rounded-2xl shadow-sm border border-stone-300/60"
          />
          <div className="flex-1 min-w-0">
            <div className="font-black text-xs text-stone-900">은달 카페 (Eundal Cafe)</div>
            <div className="text-[11px] text-stone-500 truncate">https://eundal.vercel.app</div>
            <div className="text-[10px] text-amber-800 font-bold mt-0.5">✦ 터치 한 번으로 빠른 견적 주문</div>
          </div>
        </div>

        {/* 인앱 브라우저 경고 안내 */}
        {isInApp && (
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-[11px] space-y-1">
            <strong>⚠️ 카카오톡/네이버 인앱 브라우저 이용 중</strong>
            <p className="text-[10px] text-stone-600">
              우측 상단 또는 하단 <strong>메뉴(⋮ 또는 ...)</strong>를 누른 후 <strong>'다른 브라우저로 열기(Safari / Chrome)'</strong>를 선택하시면 홈 화면 추가가 가능합니다.
            </p>
          </div>
        )}

        {/* OS별 친절한 안내 가이드 */}
        {isIOS ? (
          /* iOS Safari 안내 */
          <div className="space-y-2.5">
            <div className="font-bold text-stone-800 text-[11px] flex items-center gap-1">
              <span>아이폰(Safari) 홈 화면 추가 방법</span>
            </div>
            <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-[11px] text-stone-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  사파리 화면 하단 중앙의 <strong>[공유 버튼 ⎋]</strong>을 탭합니다.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  메뉴를 아래로 스크롤하여 <strong>[홈 화면에 추가 ⊞]</strong>를 선택합니다.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  우측 상단의 <strong>[추가]</strong>를 누르면 바탕화면에 은달 카페 아이콘이 생성됩니다.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome / 일반 모바일 안내 */
          <div className="space-y-2.5">
            <div className="font-bold text-stone-800 text-[11px]">안드로이드(Chrome / 삼성인터넷) 추가 방법</div>
            <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-[11px] text-stone-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  브라우저 우측 상단 <strong>[메뉴 ⋮]</strong> 버튼을 누릅니다.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>[홈 화면에 추가]</strong> 또는 <strong>[앱 설치]</strong>를 선택합니다.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  확인을 누르시면 휴대폰 바탕화면에 바로가기 아이콘이 설치됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 주소 복사 버튼 */}
        <div className="pt-1 flex gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '주소 복사 완료!' : '홈페이지 주소 복사'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
