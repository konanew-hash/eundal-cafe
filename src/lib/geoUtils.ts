// GPS 거리 및 지오로케이션 관련 유틸리티

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  roadAddress?: string;
}

// Haversine 공식을 사용한 두 위경도 좌표 사이의 거리 계산 (미터 단위)
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 지구 반경 (미터)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// 거리를 읽기 쉬운 형식으로 변환 (예: 850m, 2.4km)
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// 브라우저 Geolocation API 고도화 수집 함수
// 실내/PC/모바일 기기 특성을 감안하여 고정밀 실패 시 저정밀도로 자동 즉시 폴백
export async function getBrowserLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  roadAddress?: string;
}> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('이 브라우저는 위치 정보(Geolocation)를 지원하지 않습니다.');
  }

  // Promise 래퍼
  const queryPosition = (enableHighAccuracy: boolean, timeout: number): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy,
        timeout,
        maximumAge: enableHighAccuracy ? 10000 : 60000,
      });
    });
  };

  let position: GeolocationPosition | null = null;

  try {
    // 1차: 고정밀 칩셋 시도 (3.5초 타임아웃으로 모바일 실외/실내 빠르게 판별)
    position = await queryPosition(true, 3500);
  } catch (err: any) {
    // 거부된 경우는 즉시 에러 발생 (코드 1: PERMISSION_DENIED)
    if (err?.code === 1) {
      throw new Error('PERMISSION_DENIED');
    }
    // 타임아웃(3)이나 위치불가(2) 시, 2차: Wi-Fi/기지국 기반 저정밀도 즉시 시도 (성공율 99%)
    try {
      position = await queryPosition(false, 6000);
    } catch (fallbackErr: any) {
      if (fallbackErr?.code === 1) {
        throw new Error('PERMISSION_DENIED');
      }
      throw new Error('POSITION_UNAVAILABLE');
    }
  }

  if (!position) {
    throw new Error('위치 정보를 가져올 수 없습니다.');
  }

  const { latitude, longitude, accuracy } = position.coords;

  // 우리 서버의 역지오코딩 엔드포인트 호출
  let address = '';
  let roadAddress = '';
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
    if (res.ok) {
      const data = await res.json();
      address = data.address || '';
      roadAddress = data.roadAddress || data.address || '';
    }
  } catch {
    address = `위도 ${latitude.toFixed(4)}, 경도 ${longitude.toFixed(4)}`;
  }

  return {
    latitude,
    longitude,
    accuracy: Math.round(accuracy || 0),
    address: address || `위도 ${latitude.toFixed(4)}, 경도 ${longitude.toFixed(4)}`,
    roadAddress: roadAddress || address,
  };
}
