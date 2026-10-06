import { getSupabaseServer } from './supabase';
import { Order } from './types';

export interface DispatchNotificationParams {
  order: Order;
  type?: 'NEW_ORDER' | 'STATUS_CHANGE';
}

/**
 * 신규 주문 또는 상태 변경 시 등록된 관리자/매니저 전화번호로 알림 디스패치
 */
export async function dispatchStaffNotifications({ order, type = 'NEW_ORDER' }: DispatchNotificationParams) {
  const supabase = getSupabaseServer();

  try {
    // 1. 알림 수신 대상 스태프(관리자/매니저) 조회
    const { data: staffList, error } = await supabase
      .from('eundal_staff')
      .select('id, name, phone, role, notify_sms, notify_push')
      .eq('is_active', true);

    if (error || !staffList || staffList.length === 0) {
      console.warn('[Notification] 알림을 수신할 활성 관리자/매니저가 없습니다.');
      return;
    }

    const title = type === 'NEW_ORDER' ? '[은달 카페] 신규 주문 접수!' : `[은달 카페] 주문 상태 변경 (${order.status})`;
    const content = `[은달카페 신규주문]\n주문번호: ${order.order_number}\n고객명: ${order.customer_name}님\n배달일시: ${order.delivery_date} ${order.delivery_time}\n배달지: ${order.delivery_address} ${order.delivery_address_detail || ''}\n총 금액: ${order.total_amount.toLocaleString()}원`;

    // 2. 각 스태프별 알림 로그 기록 및 전송 처리
    for (const staff of staffList) {
      if (staff.notify_sms || staff.notify_push) {
        // 알림 로그 테이블에 저장
        await supabase.from('eundal_notification_logs').insert({
          order_id: order.id,
          recipient_name: staff.name,
          recipient_phone: staff.phone,
          notification_type: staff.notify_sms ? 'SMS' : 'PUSH',
          content,
          status: 'sent',
        });

        console.log(`[Notification Sent] ${staff.role} ${staff.name} (${staff.phone}): ${title}`);

        // 외부 SMS Webhook URL이 설정되어 있을 경우 실시간 발송
        if (process.env.SMS_WEBHOOK_URL) {
          try {
            await fetch(process.env.SMS_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: staff.phone,
                message: content,
                order_number: order.order_number,
              }),
            });
          } catch (webhookErr) {
            console.error('[Notification Webhook Error]', webhookErr);
          }
        }
      }
    }
  } catch (err) {
    console.error('[dispatchStaffNotifications Error]', err);
  }
}
