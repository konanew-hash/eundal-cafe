// 한국 행정구역 영문 -> 한글 사전
const KOREA_REGION_MAP: Record<string, string> = {
  // 광역 자치단체
  seoul: '서울특별시',
  'special city of seoul': '서울특별시',
  gyeonggi: '경기도',
  'gyeonggi-do': '경기도',
  incheon: '인천광역시',
  busan: '부산광역시',
  daegu: '대구광역시',
  daejeon: '대전광역시',
  gwangju: '광주광역시',
  ulsan: '울산광역시',
  sejong: '세종특별자치시',
  gangwon: '강원특별자치도',
  'gangwon-do': '강원특별자치도',
  chungcheongbuk: '충청북도',
  'chungcheongbuk-do': '충청북도',
  chungbuk: '충청북도',
  chungcheongnam: '충청남도',
  'chungcheongnam-do': '충청남도',
  chungnam: '충청남도',
  jeollabuk: '전북특별자치도',
  'jeollabuk-do': '전북특별자치도',
  jeonbuk: '전북특별자치도',
  jeollanam: '전라남도',
  'jeollanam-do': '전라남도',
  jeonnam: '전라남도',
  gyeongsangbuk: '경상북도',
  'gyeongsangbuk-do': '경상북도',
  gyeongbuk: '경상북도',
  gyeongsangnam: '경상남도',
  'gyeongsangnam-do': '경상남도',
  gyeongnam: '경상남도',
  jeju: '제주특별자치도',
  'jeju-do': '제주특별자치도',

  // 서울 25개 자치구
  'gangnam-gu': '강남구',
  gangnam: '강남구',
  'gangdong-gu': '강동구',
  gangdong: '강동구',
  'gangbuk-gu': '강북구',
  gangbuk: '강북구',
  'gangseo-gu': '강서구',
  gangseo: '강서구',
  'gwanak-gu': '관악구',
  gwanak: '관악구',
  'gwangjin-gu': '광진구',
  gwangjin: '광진구',
  'guro-gu': '구로구',
  guro: '구로구',
  'geumcheon-gu': '금천구',
  geumcheon: '금천구',
  'nowon-gu': '노원구',
  nowon: '노원구',
  'dobong-gu': '도봉구',
  dobong: '도봉구',
  'dongdaemun-gu': '동대문구',
  dongdaemun: '동대문구',
  'dongjak-gu': '동작구',
  dongjak: '동작구',
  'mapo-gu': '마포구',
  mapo: '마포구',
  'seodaemun-gu': '서대문구',
  seodaemun: '서대문구',
  'seocho-gu': '서초구',
  seocho: '서초구',
  'seongdong-gu': '성동구',
  seongdong: '성동구',
  'seongbuk-gu': '성북구',
  seongbuk: '성북구',
  'songpa-gu': '송파구',
  songpa: '송파구',
  'yangcheon-gu': '양천구',
  yangcheon: '양천구',
  'yeongdeungpo-gu': '영등포구',
  yeongdeungpo: '영등포구',
  'yongsan-gu': '용산구',
  yongsan: '용산구',
  'eunpyeong-gu': '은평구',
  eunpyeong: '은평구',
  'jongno-gu': '종로구',
  jongno: '종로구',
  'jung-gu': '중구',
  jung: '중구',
  'jungnang-gu': '중랑구',
  jungnang: '중랑구',

  // 경기도 시/군/구
  'suwon-si': '수원시',
  suwon: '수원시',
  'seongnam-si': '성남시',
  seongnam: '성남시',
  'bundang-gu': '분당구',
  bundang: '분당구',
  'goyang-si': '고양시',
  goyang: '고양시',
  'ilsan-gu': '일산구',
  ilsan: '일산',
  'yongin-si': '용인시',
  yongin: '용인시',
  'bucheon-si': '부천시',
  bucheon: '부천시',
  'ansan-si': '안산시',
  ansan: '안산시',
  'anyang-si': '안양시',
  anyang: '안양시',
  'namyangju-si': '남양주시',
  namyangju: '남양주시',
  'hwaseong-si': '화성시',
  hwaseong: '화성시',
  'uijeongbu-si': '의정부시',
  uijeongbu: '의정부시',
  'siheung-si': '시흥시',
  siheung: '시흥시',
  'pyeongtaek-si': '평택시',
  pyeongtaek: '평택시',
  'gwangmyeong-si': '광명시',
  gwangmyeong: '광명시',
  'paju-si': '파주시',
  paju: '파주시',
  'gunpo-si': '군포시',
  gunpo: '군포시',
  'gwangju-si': '광주시',
  'gimpo-si': '김포시',
  gimpo: '김포시',
  'icheon-si': '이천시',
  icheon: '이천시',
  'yangju-si': '양주시',
  yangju: '양주시',
  'guri-si': '구리시',
  guri: '구리시',
  'osan-si': '오산시',
  osan: '오산시',
  'anseong-si': '안성시',
  anseong: '안성시',
  'uiwang-si': '의왕시',
  uiwang: '의왕시',
  'hanam-si': '하남시',
  hanam: '하남시',
  'pocheon-si': '포천시',
  pocheon: '포천시',
  'dongducheon-si': '동두천시',
  dongducheon: '동두천시',
  'gwacheon-si': '과천시',
  gwacheon: '과천시',
  'gapyeong-gun': '가평군',
  'yangpyeong-gun': '양평군',
  'yeoju-si': '여주시',
  'yeoncheon-gun': '연천군',
};

// 영어 텍스트를 한글 지명으로 변환
export function translateLocationToKorean(input: string): string {
  if (!input || !input.trim()) return '위치 확인 불가';
  let str = input.trim();

  // 이미 한글이 충분히 포함되어 있고 영문 불필요 단어만 있는 경우
  str = str.replace(/South Korea|Republic of Korea|Korea/gi, '').trim();

  // 토큰 분리 및 치환
  const words = str.split(/[\s,]+/);
  const translatedWords = words.map((w) => {
    const key = w.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return KOREA_REGION_MAP[key] || w;
  });

  // 중복된 한글 시/도 제거 (예: "서울특별시 서울특별시" -> "서울특별시")
  const resultTokens: string[] = [];
  for (const token of translatedWords) {
    if (!token) continue;
    if (resultTokens.includes(token)) continue;
    // '서울'과 '서울특별시' 중복 시 '서울특별시'만 유지
    if (token === '서울' && resultTokens.includes('서울특별시')) continue;
    if (token === '서울특별시' && resultTokens.includes('서울')) {
      const idx = resultTokens.indexOf('서울');
      resultTokens[idx] = '서울특별시';
      continue;
    }
    resultTokens.push(token);
  }

  const finalStr = resultTokens.join(' ').trim();
  return finalStr || '대한민국';
}

interface GeoResolveOptions {
  clientIp: string;
  vercelCity?: string;
  vercelRegion?: string;
  vercelCountry?: string;
}

/**
 * IP 및 Vercel 헤더를 결합하여 최대한 정밀한 한글 주소 문자열 반환
 * 예: "서울특별시 마포구", "경기도 성남시 분당구"
 */
export async function resolveDetailedKoreanLocation({
  clientIp,
  vercelCity = '',
  vercelRegion = '',
  vercelCountry = '',
}: GeoResolveOptions): Promise<string> {
  // 로컬/사설 IP 예외
  if (
    !clientIp ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('172.16.')
  ) {
    return '로컬/내부망 접속';
  }

  let regionName = '';
  let cityName = '';
  let districtName = '';
  let zipCode = '';

  // 1. IP-API 호출 (lang=ko)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `http://ip-api.com/json/${clientIp}?lang=ko&fields=status,country,regionName,city,district,zip`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        regionName = data.regionName || '';
        cityName = data.city || '';
        districtName = data.district || '';
        zipCode = data.zip || '';
      }
    }
  } catch (err) {
    console.warn('[GeoIP] IP-API lookup timeout or error:', err);
  }

  // 2. Vercel 헤더 보완 (Vercel 헤더에 구/시 정보가 있으면 결합)
  const decodedVercelCity = vercelCity ? decodeURIComponent(vercelCity).trim() : '';
  const translatedVercelCity = decodedVercelCity ? translateLocationToKorean(decodedVercelCity) : '';

  // 3. 한글화 및 결합
  const parts: string[] = [];

  // 도/특별시/광역시
  const translatedRegion = regionName ? translateLocationToKorean(regionName) : '';
  if (translatedRegion && translatedRegion !== '대한민국') {
    parts.push(translatedRegion);
  }

  // 시/군
  const translatedCity = cityName ? translateLocationToKorean(cityName) : '';
  if (translatedCity && !parts.includes(translatedCity)) {
    // 만약 region이 '서울특별시'인데 city도 '서울'이면 제외
    if (!(parts.includes('서울특별시') && (translatedCity === '서울' || translatedCity === '서울특별시'))) {
      parts.push(translatedCity);
    }
  }

  // 구/읍/면/동
  const translatedDistrict = districtName ? translateLocationToKorean(districtName) : '';
  if (translatedDistrict && !parts.includes(translatedDistrict)) {
    parts.push(translatedDistrict);
  }

  // 만약 구(district)가 비어있는데 Vercel City에 구 정보가 있는 경우 보완 (예: Mapo-gu -> 마포구)
  if (!districtName && translatedVercelCity && !parts.includes(translatedVercelCity)) {
    if (translatedVercelCity.endsWith('구') || translatedVercelCity.endsWith('군')) {
      parts.push(translatedVercelCity);
    }
  }

  // 결과 조합
  let fullAddress = parts.join(' ').trim();

  // 만약 아무것도 안 나왔을 경우
  if (!fullAddress) {
    if (translatedVercelCity) {
      fullAddress = translatedVercelCity;
    } else if (vercelCountry === 'KR') {
      fullAddress = '대한민국';
    } else {
      fullAddress = '위치 확인 불가';
    }
  }

  // 우편번호(우체국 관할 구역)가 있으면 상세 위치 참고 표기 (예: "서울특별시 마포구 (우편구역: 04000)")
  if (zipCode && /^\d{5}$/.test(zipCode) && fullAddress !== '위치 확인 불가') {
    fullAddress = `${fullAddress} (우:${zipCode})`;
  }

  return translateLocationToKorean(fullAddress);
}
