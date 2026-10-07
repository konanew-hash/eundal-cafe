'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Send, Copy, Check, Phone } from 'lucide-react';
import { Order } from '@/lib/types';

interface SmsSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function SmsSendModal({ isOpen, onClose, order }: SmsSendModalProps) {
  const [templateType, setTemplateType] = useState<'quote' | 'ready' | 'notice' | 'custom'>('quote');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const phone = order.customer_phone.replace(/[^0-9]/g, '');

  const templates = {
    quote: `[은달카페] 안녕하세요, ${order.customer_name}님!
요청하신 단체 견적(${order.order_number})이 확정되었습니다.
- 총 금액: ${order.total_amount.toLocaleString()}원
- 수령 일시: ${order.delivery_date} ${order.delivery_time}
- 방식: ${order.order_type === 'pickup' ? `매장 픽업 (${order.pickup_store_name || '은달 매장'})` : `배달 (${order.delivery_address})`}
주문 및 상태 조회를 통해 상세 내역을 확인하실 수 있습니다. 감사합니다!`,

    ready: `[은달카페] 안녕하세요, ${order.customer_name}님!
주문하신 단체 주문(${order.order_number})의 메뉴 준비가 완료되었습니다.
- 수령 일시: ${order.delivery_date} ${order.delivery_time}
- 방식: ${order.order_type === 'pickup' ? `매장 픽업 (${order.pickup_store_name || '은달 매장'})` : `배달 출발`}
항상 정성을 다하는 은달카페가 되겠습니다. 감사합니다!`,

    notice: `[은달카페] 안녕하세요, ${order.customer_name}님!
단체 주문(${order.order_number}) 건과 관련하여 확인 및 안내드릴 사항이 있어 메시지 남깁니다.
통화가 가능하신 시간에 편하게 회신 주시면 감사하겠습니다.`,

    custom: customText || `[은달카페] 안녕하세요, ${order.customer_name}님!`,
  };

  const messageBody = templateType === 'custom' ? customText : templates[templateType];

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 모바일 기기별 SMS URL 호환 처리 (iOS는 &body=, 기타 ?body=)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsHref = `sms:${phone}${isIOS ? '&' : '?'}body=${encodeURIComponent(messageBody)}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">고객 안내 문자(SMS) 발송</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 수신자 정보 */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-stone-500">수신 고객: </span>
            <strong className="text-stone-900 font-bold">{order.customer_name} 님</strong>
            <span className="text-stone-400 ml-2">({order.order_number})</span>
          </div>
          <a
            href={`tel:${order.customer_phone}`}
            className="flex items-center gap-1 font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300"
          >
            <Phone className="w-3 h-3 text-amber-700" />
            <span>{order.customer_phone}</span>
          </a>
        </div>

        {/* 템플릿 선택 탭 */}
        <div className="p-3.5 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1.5">메시지 템플릿 선택</label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[
                { type: 'quote', label: '견적 확정' },
                { type: 'ready', label: '준비 완료' },
                { type: 'notice', label: '상담/문의' },
                { type: 'custom', label: '직접 입력' },
              ].map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => {
                    const sel = t.type as any;
                    setTemplateType(sel);
                    if (sel === 'custom' && !customText) {
                      setCustomText(templates[templateType] || '');
                    }
                  }}
                  className={`py-1.5 px-2 rounded-xl font-bold text-center transition-all ${
                    templateType === t.type
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메시지 내용 입력/미리보기 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-stone-600">메시지 본문 미리보기 및 편집</label>
              <span className="text-[10px] text-stone-400 font-mono">
                {messageBody.length}자
              </span>
            </div>
            <textarea
              rows={6}
              value={templateType === 'custom' ? customText : messageBody}
              onChange={(e) => {
                if (templateType !== 'custom') {
                  setTemplateType('custom');
                }
                setCustomText(e.target.value);
              }}
              className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans leading-relaxed resize-none"
              placeholder="메시지 내용을 입력하세요..."
            />
          </div>

          {/* 안내 배너 */}
          <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 flex items-start gap-1.5">
            <span className="font-bold shrink-0">💡 팁:</span>
            <span>
              모바일 기기에서는 [문자 앱 바로 실행] 시 기본 문자 앱으로 전달되며, PC에서는 [본문 복사] 후 문자 프로그램에 붙여넣을 수 있습니다.
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-stone-300 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-600" />
                <span>본문 복사</span>
              </>
            )}
          </button>

          <a
            href={smsHref}
            className="flex-1 py-2.5 px-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-98"
          >
            <Send className="w-3.5 h-3.5" />
            <span>문자 앱 바로 실행</span>
          </a>
        </div>
      </div>
    </div>
  );
}
