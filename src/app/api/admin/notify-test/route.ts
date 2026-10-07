import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { target, telegram_bot_token, telegram_chat_id, sms_service_type, sms_api_key, sms_user_id, sms_sender_phone, sms_target_phone, sms_webhook_url } = body;

    if (target === 'telegram') {
      if (!telegram_bot_token || !telegram_chat_id) {
        return NextResponse.json({ error: '텔레그램 봇 토큰과 채팅방 ID를 입력해주세요.' }, { status: 400 });
      }

      const testMessage = `🔔 [은달카페 텔레그램 알림 테스트 성공!]
━━━━━━━━━━━━━━━━━━
관리자님, 실시간 주문 알림 봇 연동이 정상적으로 완료되었습니다!
앞으로 고객이 주문서를 접수하면 0.1초 만에 이 채팅방으로 소리/진동 푸시 알림이 발송됩니다.

• 발송일시: ${new Date().toLocaleString('ko-KR')}
• 발송자: ${admin.name} (${admin.username})
━━━━━━━━━━━━━━━━━━`;

      const tgRes = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegram_chat_id,
          text: testMessage,
        }),
      });

      const tgData = await tgRes.json();
      if (!tgRes.ok || !tgData.ok) {
        return NextResponse.json({
          error: `텔레그램 전송 실패: ${tgData.description || '토큰 또는 Chat ID를 다시 확인해주세요.'}`,
        }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: '텔레그램 테스트 메시지가 성공적으로 발송되었습니다!' });
    }

    if (target === 'sms') {
      const targetPhone = sms_target_phone || admin.phone;
      if (!targetPhone) {
        return NextResponse.json({ error: '수신할 휴대폰 번호가 없습니다.' }, { status: 400 });
      }

      const testMsg = `[은달카페] SMS 알림 테스트 성공! 관리자 ${admin.name}님 정상 연동되었습니다.`;

      if (sms_service_type === 'aligo') {
        if (!sms_api_key || !sms_user_id || !sms_sender_phone) {
          return NextResponse.json({ error: '알리고 API Key, 사용자 ID, 발신번호를 모두 입력해주세요.' }, { status: 400 });
        }

        const formData = new URLSearchParams();
        formData.append('key', sms_api_key);
        formData.append('user_id', sms_user_id);
        formData.append('sender', sms_sender_phone);
        formData.append('receiver', targetPhone.replace(/[^0-9]/g, ''));
        formData.append('msg', testMsg);
        formData.append('title', '[은달카페 SMS 테스트]');

        const aligoRes = await fetch('https://apis.aligo.in/send/', {
          method: 'POST',
          body: formData,
        });
        const aligoData = await aligoRes.json();

        if (aligoData.result_code !== 1 && aligoData.result_code !== '1') {
          return NextResponse.json({ error: `알리고 발송 실패: ${aligoData.message}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `알리고 SMS가 ${targetPhone} 번호로 성공적으로 발송되었습니다!` });
      }

      if (sms_webhook_url) {
        const hookRes = await fetch(sms_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: targetPhone,
            message: testMsg,
            is_test: true,
          }),
        });

        if (!hookRes.ok) {
          return NextResponse.json({ error: `Webhook 호출 실패 (HTTP ${hookRes.status})` }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Webhook으로 테스트 알림이 성공적으로 전송되었습니다!' });
      }

      return NextResponse.json({ error: 'SMS 연동 방식(알리고 또는 Webhook)을 올바르게 설정해주세요.' }, { status: 400 });
    }

    return NextResponse.json({ error: '올바른 테스트 대상(target)을 지정해주세요.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: `테스트 발송 오류: ${message}` }, { status: 500 });
  }
}
