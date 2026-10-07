import { getSupabaseServer } from './supabase';
import { Order } from './types';

export interface DispatchNotificationParams {
  order: Order;
  type?: 'NEW_ORDER' | 'STATUS_CHANGE';
}

/**
 * 텔레그램 메시지 마크다운 특수문자 이스케이프 또는 안전 텍스트 생성
 */
function formatTelegramMessage(order: Order, type: 'NEW_ORDER' | 'STATUS_CHANGE'): string {
  const isPickup = order.order_type === 'pickup';
  const typeText = type === 'NEW_ORDER' ? '🚨 [은달카페 신규 주문 접수!]' : `📋 [은달카페 주문 상태 변경: ${order.status}]`;

  const itemsText = order.items && order.items.length > 0
    ? order.items.map((it) => {
        const setNote = it.set_details ? ` (세트 구성: ${it.set_details.components?.map(c => `${c.menu_name}x${c.quantity}`).join(', ')})` : '';
        return `  • ${it.menu_name} x${it.quantity} (${it.subtotal.toLocaleString()}원)${setNote}`;
      }).join('\n')
    : '  • 주문 메뉴 내역 없음';

  const placeInfo = isPickup
    ? `🏬 수령 방식: 매장 픽업 (${order.pickup_store_name || '은달 매장'})\n📍 픽업 위치: ${order.delivery_address || '매장 직접 방문 수령'}`
    : `🛵 수령 방식: 배달 주문\n📍 배달 주소: ${order.delivery_address} ${order.delivery_address_detail || ''}\n🛣 거리 구간: ${order.selected_distance_label} (배달비: ${order.delivery_fee.toLocaleString()}원)`;

  return `${typeText}
━━━━━━━━━━━━━━━━━━
• 주문번호: ${order.order_number}
• 주문자명: ${order.customer_name} 님
• 전화번호: ${order.customer_phone}
• 희망일시: ${order.delivery_date} ${order.delivery_time}
${placeInfo}
━━━━━━━━━━━━━━━━━━
[주문 품목]
${itemsText}

💰 총 결제금액: ${order.total_amount.toLocaleString()}원
${order.order_memo ? `📝 요청사항: ${order.order_memo}\n` : ''}━━━━━━━━━━━━━━━━━━
👉 관리자 대시보드 바로가기:
https://eundal.vercel.app/admin/orders`;
}

/**
 * 신규 주문 또는 상태 변경 시 등록된 관리자/매니저 및 텔레그램 봇으로 알림 디스패치
 */
export async function dispatchStaffNotifications({ order, type = 'NEW_ORDER' }: DispatchNotificationParams) {
  const supabase = getSupabaseServer();

  try {
    // 1. 카페 기본 설정 조회 (텔레그램 봇 토큰, SMS 설정 등)
    const { data: cafe } = await supabase
      .from('eundal_cafes')
      .select('telegram_bot_token, telegram_chat_id, sms_service_type, sms_api_key, sms_user_id, sms_sender_phone, sms_webhook_url')
      .limit(1)
      .single();

    // 2. 텔레그램 실시간 봇 자동 발송 (설정된 경우 즉시 스마트폰 푸시 전송)
    if (cafe?.telegram_bot_token && cafe?.telegram_chat_id) {
      const telegramText = formatTelegramMessage(order, type);
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${cafe.telegram_bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cafe.telegram_chat_id,
            text: telegramText,
            parse_mode: 'HTML',
          }),
        });
        const tgResult = await tgRes.json();

        // 텔레그램 로그 기록
        await supabase.from('eundal_notification_logs').insert({
          order_id: order.id,
          recipient_name: '텔레그램 봇 푸시',
          recipient_phone: cafe.telegram_chat_id,
          notification_type: 'PUSH',
          content: telegramText,
          status: tgResult.ok ? 'sent' : 'failed',
        });
        console.log('[Telegram Bot Notification]', tgResult.ok ? 'Success' : `Failed: ${tgResult.description}`);
      } catch (tgErr) {
        console.error('[Telegram Bot Error]', tgErr);
      }
    }

    // 3. 알림 수신 대상 스태프(관리자/매니저) 조회
    const { data: staffList, error: staffError } = await supabase
      .from('eundal_staff')
      .select('id, name, phone, role, notify_sms, notify_push')
      .eq('is_active', true);

    if (staffError || !staffList || staffList.length === 0) {
      console.warn('[Notification] 알림을 수신할 활성 관리자/매니저가 없습니다.');
      return;
    }

    const title = type === 'NEW_ORDER' ? '[은달카페 신규주문]' : `[은달카페 주문상태변경: ${order.status}]`;
    const isPickup = order.order_type === 'pickup';
    const place = isPickup ? `[픽업:${order.pickup_store_name || '매장'}]` : `[배달:${order.delivery_address}]`;
    const smsContent = `[은달카페 신규주문]
주문번호: ${order.order_number}
고객명: ${order.customer_name}님(${order.customer_phone})
수령: ${place}
일시: ${order.delivery_date} ${order.delivery_time}
금액: ${order.total_amount.toLocaleString()}원`;

    // 4. 각 스태프별 알림 전송 처리
    for (const staff of staffList) {
      if (staff.notify_sms || staff.notify_push) {
        // 알림 로그 테이블에 저장
        await supabase.from('eundal_notification_logs').insert({
          order_id: order.id,
          recipient_name: staff.name,
          recipient_phone: staff.phone,
          notification_type: staff.notify_sms ? 'SMS' : 'PUSH',
          content: smsContent,
          status: 'sent',
        });

        // (1) 알리고(Aligo) SMS API 연동
        if (
          staff.notify_sms &&
          cafe?.sms_service_type === 'aligo' &&
          cafe?.sms_api_key &&
          cafe?.sms_user_id &&
          cafe?.sms_sender_phone
        ) {
          try {
            const formData = new URLSearchParams();
            formData.append('key', cafe.sms_api_key);
            formData.append('user_id', cafe.sms_user_id);
            formData.append('sender', cafe.sms_sender_phone);
            formData.append('receiver', staff.phone.replace(/[^0-9]/g, ''));
            formData.append('msg', smsContent);
            formData.append('title', title);

            const aligoRes = await fetch('https://apis.aligo.in/send/', {
              method: 'POST',
              body: formData,
            });
            const aligoData = await aligoRes.json();
            console.log(`[Aligo SMS Sent to ${staff.name}]`, aligoData);
          } catch (aligoErr) {
            console.error('[Aligo SMS Error]', aligoErr);
          }
        }

        // (2) 외부 SMS / Webhook URL 연동
        const webhookUrl = cafe?.sms_webhook_url || process.env.SMS_WEBHOOK_URL;
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: staff.phone,
                message: smsContent,
                order_number: order.order_number,
                customer_name: order.customer_name,
                total_amount: order.total_amount,
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
