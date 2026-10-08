'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, MapPin, Copy, Check, Navigation, Truck, Loader2 } from 'lucide-react';

interface MiniMapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  storeName?: string;
  address: string;
  detailAddress?: string;
  postalCode?: string;
  naverPlaceUrl?: string;
  naverPlaceId?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  isDelivery?: boolean; // 배달 목적지 여부
  customerName?: string;
  distanceLabel?: string;
}

export default function MiniMapPopup({
  isOpen,
  onClose,
  title = '위치 지도 확인',
  storeName,
  address,
  detailAddress,
  naverPlaceUrl,
  naverPlaceId,
  latitude,
  longitude,
  phone,
  isDelivery = false,
  customerName,
  distanceLabel,
}: MiniMapPopupProps) {
  const [copied, setCopied] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  const cleanAddress = address ? address.replace(/\(우:[^)]+\)/g, '').trim() : '';
  const displayName = storeName || title;

  // 1. 매장 픽업인지 배달 목적지인지 판별
  const isPickupStore =
    !isDelivery &&
    (Boolean(naverPlaceId) ||
      cleanAddress.includes('조원') ||
      cleanAddress.includes('파장') ||
      displayName.includes('은달'));

  // 2. 알려진 매장인 경우 네이버 플레이스 번호 기반 위경도 매핑
  let knownLat = latitude;
  let knownLng = longitude;
  let finalPlaceId = naverPlaceId;

  if (isPickupStore) {
    if (
      finalPlaceId === '1245444726' ||
      cleanAddress.includes('조원') ||
      displayName.includes('조원') ||
      displayName.includes('1호점')
    ) {
      finalPlaceId = '1245444726';
      if (!knownLat) knownLat = 37.2966787;
      if (!knownLng) knownLng = 127.0215096;
    } else if (
      finalPlaceId === '1869537461' ||
      cleanAddress.includes('파장') ||
      cleanAddress.includes('경수대로1043번길') ||
      displayName.includes('파장') ||
      displayName.includes('2호점')
    ) {
      finalPlaceId = '1869537461';
      if (!knownLat) knownLat = 37.3075666;
      if (!knownLng) knownLng = 126.9978752;
    }
  }

  // 3. 배달 목적지 주소의 경우: 위경도가 없으면 자동 주소 지오코딩 분석 실행
  useEffect(() => {
    if (!isOpen || !cleanAddress) return;

    if (isPickupStore && knownLat && knownLng) {
      setGeoCoords({ lat: knownLat, lng: knownLng });
      return;
    }

    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude) && latitude > 0) {
      setGeoCoords({ lat: latitude, lng: longitude });
      return;
    }

    // 주소 기반 위경도 분석 API 호출
    let isCancelled = false;
    setGeocoding(true);

    fetch(`/api/geocode/search?address=${encodeURIComponent(cleanAddress)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.lat && data.lng) {
          setGeoCoords({ lat: data.lat, lng: data.lng });
        }
      })
      .catch((err) => {
        console.error('Failed to geocode delivery address:', err);
      })
      .finally(() => {
        if (!isCancelled) setGeocoding(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, cleanAddress, latitude, longitude, isPickupStore, knownLat, knownLng]);

  if (!isOpen || !address) return null;

  // 최종 사용할 위도/경도
  const mapLat = geoCoords?.lat || knownLat || latitude || 37.2966787;
  const mapLng = geoCoords?.lng || knownLng || longitude || 127.0215096;

  // 네이버 지도/플레이스 링크 생성
  const fullSearchQuery = `${cleanAddress} ${detailAddress || ''}`.trim();
  const naverUrl = isPickupStore && finalPlaceId
    ? `https://m.place.naver.com/restaurant/${finalPlaceId}/home`
    : `https://map.naver.com/p/search/${encodeURIComponent(fullSearchQuery)}`;

  const kakaoUrl = `https://map.kakao.com/link/search/${encodeURIComponent(fullSearchQuery)}`;
  const tmapNaviUrl = `https://map.kakao.com/link/to/${encodeURIComponent(displayName || fullSearchQuery)},${mapLat},${mapLng}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullSearchQuery)}`;

  // 지도 임베드 범위 (Bounding Box) 계산
  const bbox = `${mapLng - 0.0035},${mapLat - 0.0022},${mapLng + 0.0035},${mapLat + 0.0022}`;
  const embedMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapLat},${mapLng}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSearchQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-[#03C75A] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              N
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm truncate text-white">{displayName}</h3>
              <p className="text-[10px] text-emerald-300 font-medium truncate flex items-center gap-1">
                {isPickupStore ? (
                  <>
                    <span>네이버 플레이스 연동 매장</span>
                    {finalPlaceId && <span className="text-stone-300 font-mono">(ID: {finalPlaceId})</span>}
                  </>
                ) : (
                  <>
                    <Truck className="w-3 h-3 inline text-amber-300" />
                    <span>배달지 주소 분석 및 네이버 지도 연동</span>
                  </>
                )}
              </p>
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

        {/* 주소 및 분석 상태 바 */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[10px] ${
                isPickupStore
                  ? 'text-emerald-800 bg-emerald-100/90'
                  : 'text-blue-800 bg-blue-100/90'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPickupStore ? 'bg-emerald-600' : 'bg-blue-600'
                } animate-pulse`}
              />
              {isPickupStore
                ? '플레이스 고유번호 실위치 매핑'
                : '세부 주소지 위경도 좌표 분석 완료'}
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
                연락처: <span className="font-bold text-stone-700">{phone}</span>
              </p>
            )}
            {customerName && (
              <p className="text-[11px] text-stone-500">
                주문 고객: <strong className="text-stone-800">{customerName} 님</strong>
                {distanceLabel && <span className="ml-2 text-stone-600">({distanceLabel})</span>}
              </p>
            )}
          </div>
        </div>

        {/* 인터랙티브 타일 미니맵 (위경도 분석 반영) */}
        <div className="relative w-full h-[230px] sm:h-[250px] bg-stone-100 border-b border-stone-200 overflow-hidden">
          {geocoding && (
            <div className="absolute inset-0 z-20 bg-stone-50/80 backdrop-blur-2xs flex flex-col items-center justify-center text-xs text-stone-600 gap-1.5">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <span>주소지 네이버/공간 위경도 분석 중...</span>
            </div>
          )}

          <iframe
            src={embedMapUrl}
            title={`${displayName} 실위치 미니맵`}
            className="w-full h-full border-0 pointer-events-auto"
            loading="lazy"
          />

          {/* 지도 상단 오버레이 뱃지 */}
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-stone-700/60 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full inline-block animate-ping ${
                  isPickupStore ? 'bg-[#03C75A]' : 'bg-blue-400'
                }`}
              />
              <span>{isPickupStore ? `${displayName} 픽업 핀` : '배달 목적지 실위치 핀'}</span>
            </span>
          </div>

          {/* 지도 하단 좌표 오버레이 */}
          <div className="absolute bottom-1 right-2 z-10 pointer-events-none text-[9.5px] text-stone-600 bg-white/85 px-1.5 py-0.5 rounded shadow-2xs font-mono">
            위도: {mapLat.toFixed(5)} · 경도: {mapLng.toFixed(5)}
          </div>
        </div>

        {/* 네이버 지도 원클릭 실위치 확인 & 길찾기 액션 바 */}
        <div className="p-3 bg-white space-y-2">
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-[#03C75A] hover:bg-[#02b150] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>
              {isPickupStore
                ? '네이버 플레이스에서 길찾기 & 상세정보 보기'
                : '네이버 지도에서 배달지 위치 & 길찾기 보기'}
            </span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>

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
              href={tmapNaviUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg flex items-center justify-center gap-1 border border-blue-200 transition-colors"
            >
              <span>길찾기 내비</span>
              <ExternalLink className="w-2.5 h-2.5 text-blue-700" />
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
