import { MenuSubcategory } from './types';

export interface SubcategoryMeta {
  key: MenuSubcategory;
  label: string;
  icon: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const SUBCATEGORIES: Record<MenuSubcategory, SubcategoryMeta> = {
  coffee: {
    key: 'coffee',
    label: '커피류',
    icon: '☕',
    description: '에스프레소, 아메리카노, 카페라떼, 콜드브루 등',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
  },
  juice: {
    key: 'juice',
    label: '주스·에이드·스무디',
    icon: '🍹',
    description: '착즙 과일주스, 수제청 에이드, 요거트 스무디, 프라페',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
  },
  tea: {
    key: 'tea',
    label: '차(Tea) & 밀크티',
    icon: '🍵',
    description: '프리미엄 허브티, 홍차, 블렌딩티, 밀크티, 전통차',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
  },
  dessert: {
    key: 'dessert',
    label: '디저트 & 구움과자',
    icon: '🍰',
    description: '소금빵, 르뱅쿠키, 스콘, 휘낭시에, 조각케이크, 마카롱',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
  },
  sandwich: {
    key: 'sandwich',
    label: '샌드위치 & 브런치',
    icon: '🥪',
    description: '수제 샌드위치, 잠봉뵈르, 크루아상 샌드, 파니니',
    badgeBg: 'bg-lime-100',
    badgeText: 'text-lime-900',
    badgeBorder: 'border-lime-300',
  },
  set: {
    key: 'set',
    label: '세트 & 다과 패키지',
    icon: '🎁',
    description: '1인 커피+디저트 세트, 단체 다과 패키지, 선물 세트',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
  },
};

/**
 * 메뉴명 및 설명을 바탕으로 6대 정밀 세부분류로 자동 태깅
 */
export function categorizeMenuDetailed(
  name: string,
  desc?: string
): { mainCategory: 'drink' | 'dessert' | 'set'; subcategory: MenuSubcategory } {
  const text = (name + ' ' + (desc || '')).toLowerCase();

  // 1. 세트 & 선물 패키지 판별
  if (
    text.includes('세트') ||
    text.includes('set') ||
    text.includes('셋트') ||
    text.includes('플래터') ||
    text.includes('패키지') ||
    text.includes('선물세트') ||
    text.includes('박스')
  ) {
    return { mainCategory: 'set', subcategory: 'set' };
  }

  // 2. 샌드위치 & 브런치류 판별
  const sandwichKeywords = [
    '샌드위치',
    '샌디',
    '파니니',
    '잠봉',
    '핫도그',
    '토스트',
    '산도',
    '브런치',
    '샐러드',
    '베이글샌드',
  ];
  if (sandwichKeywords.some((k) => text.includes(k))) {
    return { mainCategory: 'dessert', subcategory: 'sandwich' };
  }

  // 3. 디저트 & 구움과자 판별
  const dessertKeywords = [
    '케이크',
    '케익',
    '베이글',
    '쿠키',
    '휘낭시에',
    '피낭시에',
    '마들렌',
    '스콘',
    '타르트',
    '소금빵',
    '크루아상',
    '크로와상',
    '크로플',
    '와플',
    '판나코타',
    '브라우니',
    '티라미수',
    '초콜릿',
    '마카롱',
    '롤케이크',
    '다쿠아즈',
    '오란다',
    '까눌레',
    '파이',
    '디저트',
    '도넛',
    '도너츠',
    '약과',
    '푸딩',
    '빙수',
    '구움과자',
    '에그타르트',
    '소보로',
    '식빵',
    '바게트',
  ];
  if (dessertKeywords.some((k) => text.includes(k))) {
    return { mainCategory: 'dessert', subcategory: 'dessert' };
  }

  // 4. 주스 & 에이드 & 스무디 판별
  const juiceKeywords = [
    '주스',
    '쥬스',
    '착즙',
    '에이드',
    '스무디',
    '쉐이크',
    '프라페',
    '슬러시',
    '과일',
    '모히또',
    '샹그리아',
    '블렌디드',
    '클렌즈',
    '청포도',
    '자몽에이드',
    '레몬에이드',
    '자두',
    '망고',
    '수박',
  ];
  if (juiceKeywords.some((k) => text.includes(k))) {
    return { mainCategory: 'drink', subcategory: 'juice' };
  }

  // 5. 차(Tea) & 밀크티 판별
  const teaKeywords = [
    '티',
    '차',
    'tea',
    '밀크티',
    '홍차',
    '녹차',
    '말차',
    '얼그레이',
    '캐모마일',
    '페퍼민트',
    '히비스커스',
    '루이보스',
    '유자차',
    '레몬차',
    '자몽차',
    '생강차',
    '대추차',
    '아이스티',
    '복숭아티',
    '초코',
    '초콜릿',
    '미숫가루',
    '곡물',
  ];
  if (teaKeywords.some((k) => text.includes(k))) {
    return { mainCategory: 'drink', subcategory: 'tea' };
  }

  // 6. 커피류 (기본 음료는 커피류로 분류)
  return { mainCategory: 'drink', subcategory: 'coffee' };
}
