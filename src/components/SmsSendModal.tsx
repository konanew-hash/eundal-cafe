'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Copy,
  Check,
  Phone,
  Camera,
  Download,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  Sparkles,
  Share2,
  Smartphone,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { Order, SmsTemplate } from '@/lib/types';

interface SmsSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function SmsSendModal({ isOpen, onClose, order }: SmsSendModalProps) {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [messageText, setMessageText] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // 이미지 캡처 및 공유 상태
  const [capturingImage, setCapturingImage] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const captureCardRef = useRef<HTMLDivElement>(null);

  // 템플릿 관리(편집) 모달 상태
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<SmsTemplate> | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // 템플릿 목록 불러오기
  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/sms-templates');
      if (res.ok) {
        const data = await res.json();
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
          // 첫 번째 템플릿 적용
          if (selectedTemplateId === 'custom' && !messageText) {
            applyTemplateContent(data.templates[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setCapturedImageUrl(null);
      setCopiedImage(false);
    }
  }, [isOpen]);

  // 주문 정보 기반 템플릿 변수 치환
  const formatTemplate = (rawContent: string, currentOrder: Order) => {
    const isPickup = currentOrder.order_type === 'pickup';
    const pickupStore = currentOrder.pickup_store_name || '은달 매장';
    const deliveryMethod = isPickup
      ? `매장 픽업 (${pickupStore})`
      : `배달 (${currentOrder.delivery_address})`;

    return rawContent
      .replace(/\{고객명\}/g, currentOrder.customer_name)
      .replace(/\{주문번호\}/g, currentOrder.order_number)
      .replace(/\{총금액\}/g, currentOrder.total_amount.toLocaleString())
      .replace(/\{수령일시\}/g, `${currentOrder.delivery_date} ${currentOrder.delivery_time}`)
      .replace(/\{수령방식\}/g, deliveryMethod)
      .replace(/\{픽업매장\}/g, pickupStore)
      .replace(/\{배달주소\}/g, currentOrder.delivery_address);
  };

  const applyTemplateContent = (tpl: SmsTemplate) => {
    if (!order) return;
    setSelectedTemplateId(tpl.id);
    setMessageText(formatTemplate(tpl.content, order));
  };

  useEffect(() => {
    if (order && templates.length > 0 && selectedTemplateId !== 'custom') {
      const current = templates.find((t) => t.id === selectedTemplateId);
      if (current) {
        setMessageText(formatTemplate(current.content, order));
      }
    } else if (order && !messageText) {
      setMessageText(`[은달카페] 안녕하세요, ${order.customer_name}님! 단체 주문(${order.order_number}) 관련 안내드립니다.`);
    }
  }, [order, templates, selectedTemplateId]);

  if (!isOpen || !order) return null;

  const phone = order.customer_phone.replace(/[^0-9]/g, '');

  // 문자 텍스트 복사
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // 문자용 이미지 캡처 (옵션 기능)
  const handleCaptureImage = async () => {
    if (!captureCardRef.current) return;
    setCapturingImage(true);
    try {
      const dataUrl = await toPng(captureCardRef.current, {
        cacheBust: true,
        quality: 0.95,
        backgroundColor: '#ffffff',
      });
      setCapturedImageUrl(dataUrl);

      // 클립보드에 이미지 복사 시도
      try {
        const blob = await (await fetch(dataUrl)).blob();
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 3000);
        }
      } catch {
        // 클립보드 미지원 환경은 다운로드 유지
      }
    } catch (e) {
      console.error('Image capture failed:', e);
      alert('이미지 캡처 중 오류가 발생했습니다.');
    } finally {
      setCapturingImage(false);
    }
  };

  // 캡처 이미지 다운로드
  const handleDownloadImage = () => {
    if (!capturedImageUrl) return;
    const link = document.createElement('a');
    link.download = `eundal-order-${order.order_number}.png`;
    link.href = capturedImageUrl;
    link.click();
  };

  // 요구사항: 이미지와 텍스트를 함께 전송 (Web Share API Level 2 및 클립보드 복사 Fallback)
  const handleSendImageAndText = async () => {
    if (!captureCardRef.current) return;
    setSharing(true);
    try {
      // 1. 고화질 이미지 Blob 생성
      const blob = await toBlob(captureCardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      if (!blob) throw new Error('이미지 생성에 실패했습니다.');

      const imageFile = new File([blob], `은달카페_주문확인_${order.order_number}.png`, { type: 'image/png' });

      // 2. 모바일 / Web Share API 지원 브라우저: 메시지(MMS) 또는 카카오톡으로 이미지+본문 동시 전송!
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          title: `[은달카페] 주문 및 견적서 (${order.customer_name} 님)`,
          text: messageText,
          files: [imageFile],
        });
        return;
      }

      // 3. PC 또는 Share API 미지원 브라우저: 클립보드에 이미지 복사 + 텍스트 복사 + 안내 팝업
      let imageCopied = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          imageCopied = true;
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 4000);
        } catch (clipErr) {
          console.warn('Clipboard image write warning:', clipErr);
        }
      }

      // 텍스트도 복사
      try {
        await navigator.clipboard.writeText(messageText);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 3000);
      } catch {
        // ignore
      }

      // 미리보기 이미지 생성
      const dataUrl = await toPng(captureCardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      setCapturedImageUrl(dataUrl);

      if (imageCopied) {
        alert(
          `[주문 내역 이미지 클립보드 복사 완료!]\n\n` +
          `• 주문서 이미지가 클립보드에 복사되었습니다.\n` +
          `• PC 카카오톡 또는 문자 발송 프로그램에서 '붙여넣기(Ctrl+V)'하시면 이미지가 바로 첨부됩니다.\n` +
          `• 문자 본문도 함께 복사되었습니다.`
        );
      } else {
        // 파일 다운로드
        const link = document.createElement('a');
        link.download = `은달카페_주문확인_${order.order_number}.png`;
        link.href = dataUrl;
        link.click();
        alert('주문 내역 이미지가 다운로드되었습니다. 문자 발송 시 첨부해주세요.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Send error:', err);
        alert('전송 처리 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setSharing(false);
    }
  };

  // 템플릿 저장 (신규 추가 또는 수정)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.title || !editingTemplate.content) {
      alert('템플릿 제목과 본문을 입력해주세요.');
      return;
    }

    setSavingTemplate(true);
    try {
      if (editingTemplate.id) {
        // 수정
        const res = await fetch('/api/admin/sms-templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingTemplate),
        });
        if (res.ok) {
          await loadTemplates();
          setEditingTemplate(null);
        }
      } else {
        // 추가
        const res = await fetch('/api/admin/sms-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editingTemplate,
            sort_order: templates.length + 1,
          }),
        });
        if (res.ok) {
          await loadTemplates();
          setEditingTemplate(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert('템플릿 저장 실패');
    } finally {
      setSavingTemplate(false);
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('이 문자 템플릿을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/sms-templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadTemplates();
        if (selectedTemplateId === id) {
          setSelectedTemplateId('custom');
        }
      }
    } catch (err) {
      console.error(err);
      alert('템플릿 삭제 실패');
    }
  };

  // 현재 작성 중인 텍스트를 새 템플릿으로 바로 등록
  const handleSaveCurrentAsNewTemplate = () => {
    const title = prompt('새 템플릿의 이름을 입력하세요:', '맞춤 안내');
    if (!title) return;
    setEditingTemplate({
      title,
      content: messageText,
    });
    setIsTemplateManagerOpen(true);
  };

  // 모바일 기기별 SMS URL 호환 처리 (iOS는 &body=, 기타 ?body=)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsHref = `sms:${phone}${isIOS ? '&' : '?'}body=${encodeURIComponent(messageText)}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-800 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">고객 안내 문자(SMS/MMS) 발송</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 수신자 정보 바 */}
        <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs shrink-0">
          <div>
            <span className="text-stone-500">수신 고객: </span>
            <strong className="text-stone-900 font-bold">{order.customer_name} 님</strong>
            <span className="text-stone-400 ml-2 font-mono">({order.order_number})</span>
          </div>
          <a
            href={`tel:${order.customer_phone}`}
            className="flex items-center gap-1 font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 transition-colors"
          >
            <Phone className="w-3 h-3 text-amber-700" />
            <span>{order.customer_phone}</span>
          </a>
        </div>

        {/* 모달 본문 (스크롤 가능) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. 문자 템플릿 선택 및 관리자 편집 줄 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <span>메시지 템플릿 선택</span>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                  {templates.length}개 등록됨
                </span>
              </label>

              {/* 템플릿 관리자 편집 버튼 */}
              <button
                type="button"
                onClick={() => setIsTemplateManagerOpen(true)}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold flex items-center gap-1 transition-colors border border-stone-200"
              >
                <Settings className="w-3 h-3 text-stone-600" />
                <span>문자 템플릿 항목 편집</span>
              </button>
            </div>

            {/* 템플릿 탭 버튼 그리드 */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplateContent(tpl)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {tpl.title}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedTemplateId('custom')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedTemplateId === 'custom'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                직접 작성
              </button>
            </div>
          </div>

          {/* 2. 메시지 본문 미리보기 및 실시간 편집 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-stone-600">메시지 본문 내용</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-mono">{messageText.length}자</span>
                <button
                  type="button"
                  onClick={handleSaveCurrentAsNewTemplate}
                  className="text-[10px] text-amber-700 hover:underline font-semibold flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>현재 문구를 새 템플릿으로 저장</span>
                </button>
              </div>
            </div>
            <textarea
              rows={5}
              value={messageText}
              onChange={(e) => {
                if (selectedTemplateId !== 'custom') {
                  setSelectedTemplateId('custom');
                }
                setMessageText(e.target.value);
              }}
              className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans leading-relaxed resize-none shadow-inner"
              placeholder="전송할 메시지 내용을 입력하세요..."
            />
          </div>

          {/* 3. [옵션] 문자용 주문 내역 이미지 캡처 영역 (요구사항 반영) */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50/60 to-stone-50 rounded-2xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-stone-900">문자용 주문 내역 이미지 캡처 (옵션)</span>
              </div>
              <button
                type="button"
                onClick={handleCaptureImage}
                disabled={capturingImage}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-colors active:scale-95 disabled:bg-stone-300"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{capturingImage ? '캡처 생성 중...' : '주문 내역 이미지 생성/복사'}</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-600 leading-snug">
              주문 품목 및 세트메뉴 세부 구성, 총 결제금액이 포함된 이미지를 캡처하여 클립보드에 복사하거나 다운로드하여 MMS/카카오톡으로 함께 전송할 수 있습니다.
            </p>

            {/* 캡처 성공 시 미리보기 및 추가 도구 */}
            {capturedImageUrl && (
              <div className="p-2.5 bg-white rounded-xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-bold text-emerald-700">
                    <Check className="w-3.5 h-3.5" />
                    <span>{copiedImage ? '클립보드에 이미지 복사 완료!' : '이미지 생성 완료'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-stone-200"
                    >
                      <Download className="w-3 h-3" />
                      <span>이미지 다운로드</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                  <img src={capturedImageUrl} alt="캡처된 주문서 미리보기" className="w-full object-cover" />
                </div>
              </div>
            )}

            {/* 캡처 대상 숨김 프레임 (toPng/toBlob 대상: 사용자 제공 스크린샷과 100% 일치하는 주문 카드 디자인) */}
            <div className="overflow-hidden h-0 opacity-0 pointer-events-none">
              <div
                ref={captureCardRef}
                style={{
                  width: '420px',
                  backgroundColor: '#ffffff',
                  color: '#1c1917',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
                  borderRadius: '24px',
                  border: '1px solid #e7e5e4',
                  padding: '22px',
                  boxSizing: 'border-box',
                }}
              >
                {/* 1. 상단: 주문번호 + 배달/픽업 뱃지 + 상태 뱃지 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#1c1917', letterSpacing: '-0.3px' }}>
                        {order.order_number}
                      </span>
                      {order.order_type === 'pickup' ? (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          🏬 픽업
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          🛵 배달
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '3px' }}>
                      {order.created_at ? new Date(order.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) + ' 접수' : '접수 완료'}
                    </div>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#fefce8',
                    color: '#854d0e',
                    border: '1px solid #fef08a',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    <span>🕒</span>
                    <span>{order.status === 'confirmed' ? '주문확정' : order.status === 'brewing' ? '제조중' : order.status === 'delivering' ? '배달중' : order.status === 'completed' ? '완료' : '견적대기'}</span>
                  </div>
                </div>

                {/* 2. 고객명 & 전화번호 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 'bold', color: '#1c1917' }}>
                    <span>👤</span>
                    <span>{order.customer_name} 님</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold', color: '#78350f' }}>
                    <span>📞</span>
                    <span>{order.customer_phone}</span>
                  </div>
                </div>

                {/* 3. 배달/픽업 일정 및 장소 박스 (스크린샷 일치) */}
                <div style={{
                  backgroundColor: '#fafaf9',
                  borderRadius: '16px',
                  border: '1px solid #e7e5e4',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#44403c',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#451a03', marginBottom: '4px' }}>
                    <span>📅</span>
                    <span>{order.delivery_date} {order.delivery_time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', flex: 1 }}>
                      <span style={{ color: '#78716c' }}>📍</span>
                      <span style={{ color: '#1c1917', fontWeight: '500' }}>
                        {order.order_type === 'pickup'
                          ? `매장 픽업 (${order.pickup_store_name || '은달 매장'})`
                          : `${order.delivery_address} ${order.delivery_address_detail || ''}`}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#1d4ed8',
                      backgroundColor: '#eff6ff',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      flexShrink: 0,
                    }}>
                      지도
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#78716c', marginTop: '2px' }}>
                    거리구간: <strong style={{ color: '#292524' }}>{order.selected_distance_label || '기본'}</strong>
                  </div>
                  {order.order_memo && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e7e5e4', fontSize: '11px', color: '#92400e' }}>
                      <strong>요청사항:</strong> {order.order_memo}
                    </div>
                  )}
                </div>

                {/* 4. 주문 메뉴 내역 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#44403c' }}>주문 메뉴 내역</span>
                  <span style={{ fontSize: '11px', color: '#a8a29e' }}>총 {order.items?.length || 0}종</span>
                </div>

                {/* 5. 메뉴 품목 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                  {order.items?.map((item, idx) => {
                    const isSet = !!item.set_details;
                    return (
                      <div key={idx} style={{ fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, paddingRight: '8px' }}>
                            {isSet && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #f59e0b',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                marginRight: '2px',
                                flexShrink: 0,
                              }}>
                                🎁 세트
                              </span>
                            )}
                            <span style={{ fontWeight: isSet ? 'bold' : '500', color: '#1c1917', lineHeight: '1.4' }}>
                              {isSet ? `[세트] ${item.menu_name}` : item.menu_name} x {item.quantity}
                            </span>
                          </div>
                          <span style={{ fontWeight: 'bold', color: '#1c1917', flexShrink: 0 }}>
                            {item.subtotal.toLocaleString()}원
                          </span>
                        </div>

                        {/* 세트 세부 내역 (노란색 좌측 바 & 크림색 배경 서브박스) */}
                        {isSet && item.set_details && (
                          <div style={{
                            backgroundColor: '#fffbeb',
                            borderLeft: '3px solid #f59e0b',
                            borderRadius: '0 10px 10px 0',
                            padding: '8px 10px',
                            marginTop: '6px',
                            fontSize: '11px',
                            lineHeight: '1.6',
                            color: '#44403c',
                          }}>
                            <div>
                              <strong style={{ color: '#1c1917' }}>구성:</strong>{' '}
                              {item.set_details.components?.map((c) => `${c.menu_name} x${c.quantity}`).join(', ') || '-'}
                            </div>
                            <div>
                              <strong style={{ color: '#1c1917' }}>포장:</strong>{' '}
                              {item.set_details.package_box?.name}
                              {item.set_details.package_box?.price > 0 && ` (+${item.set_details.package_box.price.toLocaleString()}원)`}
                            </div>
                            {item.set_details.packaging_options && item.set_details.packaging_options.length > 0 && (
                              <div>
                                <strong style={{ color: '#1c1917' }}>옵션:</strong>{' '}
                                {item.set_details.packaging_options.map((opt) => `${opt.name} (+${opt.price.toLocaleString()}원)`).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 6. 배달비 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#78716c', marginBottom: '8px' }}>
                  <span>배달비 ({order.selected_distance_label || '기본'})</span>
                  <span>{order.delivery_fee.toLocaleString()}원</span>
                </div>

                {/* 7. 점선 구분선 및 총 결제금액 */}
                <div style={{
                  borderTop: '1px dashed #d6d3d1',
                  paddingTop: '10px',
                  marginTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1c1917' }}>총 결제금액</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#451a03' }}>
                    {order.total_amount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모달 하단 액션 바: 스마트 동시 발송 + 개별 복사/앱 실행 */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-2 shrink-0">
          {/* 핵심 요구사항 버튼: 이미지 + 문자 함께 발송 (MMS/카카오톡) */}
          <button
            type="button"
            onClick={handleSendImageAndText}
            disabled={sharing}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:bg-stone-300"
          >
            {sharing ? (
              <span>이미지 및 문자 발송 준비 중...</span>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-amber-200" />
                <span>📱 이미지 + 문자 함께 전송 (MMS / 카카오톡)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-stone-300 transition-colors shadow-2xs"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">본문 복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                  <span>문자 본문 복사</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCaptureImage}
              disabled={capturingImage}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-stone-300 transition-colors shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-stone-600" />
              <span>{copiedImage ? '이미지 복사됨' : '이미지만 복사'}</span>
            </button>

            <a
              href={smsHref}
              className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
              title="기본 문자앱 열기"
            >
              <Send className="w-3.5 h-3.5" />
              <span>문자앱</span>
            </a>
          </div>

          <div className="text-[10px] text-stone-500 text-center leading-tight">
            * 스마트폰 환경에서는 [함께 전송] 클릭 시 문자(MMS) 또는 카카오톡에 이미지와 글이 함께 자동 첨부됩니다. PC에서는 이미지가 클립보드에 복사되어 메신저에 붙여넣기(Ctrl+V)하실 수 있습니다.
          </div>
        </div>
      </div>

      {/* 4. 문자 템플릿 관리(편집) 인라인 모달 */}
      {isTemplateManagerOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsTemplateManagerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 text-xs max-h-[88vh] flex flex-col space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-sm text-stone-900">문자 발송 템플릿 관리 & 편집</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateManagerOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {/* 등록된 템플릿 리스트 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 text-xs">등록된 템플릿 목록</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingTemplate({
                        title: '',
                        content: '',
                      })
                    }
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>새 템플릿 추가</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-xs">{tpl.title}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingTemplate({ ...tpl })}
                            className="p-1 text-stone-500 hover:text-amber-800"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 text-stone-400 hover:text-red-600"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 line-clamp-2 whitespace-pre-line bg-white p-2 rounded-xl border border-stone-200/80">
                        {tpl.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 템플릿 추가 / 수정 폼 */}
              {editingTemplate && (
                <form
                  onSubmit={handleSaveTemplate}
                  className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-300/80 space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950">
                      {editingTemplate.id ? '템플릿 내용 수정' : '새 템플릿 작성'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(null)}
                      className="text-[10px] text-stone-500 hover:underline"
                    >
                      작성 취소
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">템플릿 제목</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 픽업 10분 전 안내"
                      value={editingTemplate.title || ''}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, title: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-stone-700">본문 내용</label>
                      <span className="text-[10px] text-stone-400">
                        치환 변수: {'{고객명}'}, {'{주문번호}'}, {'{총금액}'}, {'{수령일시}'}, {'{수령방식}'}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      placeholder="내용을 입력하세요..."
                      value={editingTemplate.content || ''}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, content: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(null)}
                      className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 font-bold text-xs"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={savingTemplate}
                      className="px-4 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingTemplate ? '저장 중...' : '템플릿 저장'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTemplateManagerOpen(false)}
                className="px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
