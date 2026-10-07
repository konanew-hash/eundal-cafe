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
  is_sold_out: boolean;
  sort_order: number;
  is_active: boolean;
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

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_id?: string;
  menu_name: string;
  price: number;
  quantity: number;
  subtotal: number;
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
  total_amount: number;
  privacy_agreed: boolean;
  privacy_agreed_at: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'accepted' | 'brewing' | 'delivering';
  client_ip?: string;
  client_location?: string;
  gps_lat?: number;
  gps_lng?: number;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface CartItem {
  menu: MenuItem;
  quantity: number;
}
