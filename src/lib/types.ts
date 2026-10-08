export interface CafeInfo {
  id: string;
  name: string;
  slogan: string;
  description: string;
  hero_image_url: string;
  logo_icon_url: string;
  app_icon_url?: string; // 바탕화면 즐겨찾기/앱 아이콘
  phone: string;
  address: string;
  business_hours: string;
  quote_notice?: string;
  updated_at?: string;
  // SNS 및 홍보용 링크 & 사업자 정보
  instagram_url?: string;
  youtube_url?: string;
  naver_url?: string;
  google_url?: string;
  business_number?: string;
  owner_name?: string;
  privacy_officer?: string;
  hero_images?: string[]; // 대표 이미지 복수 목록 (홈페이지 롤링용)
  logo_images?: string[]; // 로고 복수 이미지 목록
  manager_kakao_id?: string; // 총괄관리자 카카오톡 ID/오픈채팅 링크
  manager_phone?: string; // 총괄관리자 직통 연락처
  // 실시간 주문 알림 연동 (텔레그램 & SMS)
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  sms_service_type?: 'webhook' | 'aligo' | 'none';
  sms_api_key?: string;
  sms_user_id?: string;
  sms_sender_phone?: string;
  sms_webhook_url?: string;
  privacy_policy?: string; // 관리자가 직접 편집하는 개인정보처리방침 전문
}

// 관리자, 매니저간 전달사항 (인수인계 및 점포 변경사항)
export interface NoticeReadInfo {
  admin_id: string;
  name?: string;
  read_at: string;
}

export interface ManagerNotice {
  id: string;
  created_at: string;
  author_id: string;
  author_name?: string;
  store_id?: string | null;
  store_name: string;
  content: string;
  photo_urls?: string[];
  read_by?: NoticeReadInfo[];
  is_important?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  allergens?: string; // 알러지 유발 성분 표기
  price: number;
  image_url: string;
  additional_images?: string[]; // 홈페이지 사진 롤링용 추가 이미지 목록
  video_urls?: string[]; // 메뉴 설명 영상 목록 (다수 지원)
  is_sold_out: boolean;
  sort_order: number;
  is_active: boolean;
  packaging_type?: 'box' | 'special' | null; // 맞춤 세트메뉴용 구분 ('box': 포장용기, 'special': 특수포장, null: 일반메뉴)
  is_available_for_set?: boolean; // 맞춤 세트메뉴 세트에 담을 품목 포함 여부 (기본 true)
  is_set_only?: boolean; // 일반 메뉴 비노출, 맞춤세트 전용 노출 (1/2 샌드위치 등)
  is_even_only?: boolean; // 짝수개(2, 4, 6...)만 선택 가능 (1/2 샌드위치 등)
  max_items_count?: number | null; // 포장용기(box)에 담을 수 있는 최대 품목 가지수
  created_at?: string;
  updated_at?: string;
}

export type Menu = MenuItem;

// 픽업 매장 정보
export interface Store {
  id: string;
  name: string;
  branch_name?: string;
  address: string;
  address_detail?: string;
  postal_code?: string;
  naver_place_url?: string; // 네이버 플레이스 연동 URL
  naver_place_id?: string; // 네이버 플레이스 고유 번호 (예: 1245444726, 1869537461)
  latitude?: number; // 위도 (y)
  longitude?: number; // 경도 (x)
  phone?: string;
  operating_hours?: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DistanceRule {
  label: string;
  extra_fee: number;
}

export interface DeliveryPolicy {
  id: string;
  base_fee: number;
  free_threshold: number;
  min_order_amount: number;
  distance_rules: DistanceRule[];
  updated_at?: string;
}

export interface Staff {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'manager';
  phone: string;
  notify_sms: boolean;
  notify_push: boolean;
  is_active: boolean;
  created_at?: string;
}

// 문자 발송 템플릿
export interface SmsTemplate {
  id: string;
  title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 세트메뉴 구성 요소
export interface SetComponentItem {
  menu_id: string;
  menu_name: string;
  price: number;
  quantity: number;
}

// 커스텀 세트메뉴 상세 내역
export interface CustomSetDetails {
  set_name: string; // 예: "은달 힐링 티타임 세트"
  components: SetComponentItem[]; // 포함된 메뉴 및 수량
  package_box: { name: string; price: number }; // 포장용기 (예: 크라프트 박스)
  packaging_options: { name: string; price: number }[]; // 캔시머, 리본 등 추가 옵션
  unit_price: number; // 1세트당 단가
}

// 서브웨이 썹픽 스타일 추천 세트 조합 (은픽)
export interface PresetSet {
  id: string;
  name: string;
  description?: string;
  badge_text?: string;
  image_url?: string;
  components: SetComponentItem[];
  package_box_id?: string;
  package_box_name?: string;
  package_box_price?: number;
  packaging_options?: { id: string; name: string; price: number }[];
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_id?: string | null;
  menu_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  set_details?: CustomSetDetails | null;
}

export interface Order {
  id: string;
  order_number: string;
  order_type: 'delivery' | 'pickup'; // 배달 vs 픽업
  pickup_store_id?: string;
  pickup_store_name?: string;
  customer_name: string;
  customer_phone: string;
  delivery_date: string;
  delivery_time: string;
  delivery_address: string;
  delivery_address_detail?: string;
  selected_distance_label: string;
  order_memo?: string;
  items_total: number;
  delivery_fee: number;
  packaging_fee?: number;
  packaging_box?: { name: string; price: number } | null;
  packaging_options?: { name: string; price: number }[] | null;
  total_amount: number;
  privacy_agreed: boolean;
  privacy_agreed_at: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'accepted' | 'brewing' | 'delivering';
  client_ip?: string;
  client_location?: string;
  gps_lat?: number;
  gps_lng?: number;
  delivery_lat?: number; // 배달 목적지 주소 기반 위도
  delivery_lng?: number; // 배달 목적지 주소 기반 경도
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface CartItem {
  id?: string; // 카트 내 고유 식별자 (세트메뉴 등 고유 키 구분용)
  menu: MenuItem;
  quantity: number;
  is_custom_set?: boolean;
  set_details?: CustomSetDetails;
}

// 단체 행사 납품 포트폴리오
export interface Portfolio {
  id: string;
  title: string;
  client_name: string;
  event_date: string;
  event_time?: string;
  event_scale: string;
  item_summary?: string;
  content?: string;
  photos: string[];
  video_urls?: string[];
  tags: string[];
  order_id?: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
