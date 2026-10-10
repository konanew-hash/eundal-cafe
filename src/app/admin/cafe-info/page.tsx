'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Save,
  RefreshCw,
  CheckCircle,
  Image as ImageIcon,
  MapPin,
  Clock,
  Phone,
  Upload,
  FileText,
  Trash2,
  Send,
  Bell,
  Sparkles,
  MessageCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { CafeInfo } from '@/lib/types';

const DEFAULT_PRIVACY_POLICY = `은달 카페(이하 '카페' 또는 '회사')는 「개인정보 보호법」 제30조 및 관계 법령을 준수하며, 정보주체의 개인정보 및 권익을 보호하고 개인정보와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.

제1조 (개인정보의 처리 목적)
카페는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
1. 주문 및 단체 견적 처리: 식음료 주문 접수, 단체 맞춤 세트 제조 및 포장, 배달 및 매장 픽업 서비스 제공, 견적서 발송
2. 고객 안내 및 상담: 주문 상태 확인, 배달 거리/위치 안내, 지연·품절 안내 및 관련 SMS/MMS 발송, 고객 문의 대응
3. 서비스 개선 및 안전 관리: 접속 빈도 파악, 이상 거래 방지 및 서비스 품질 향상

제2조 (처리하는 개인정보의 항목)
카페는 주문 및 견적 접수를 위해 다음의 최소한의 개인정보 항목을 수집·처리하고 있습니다.
- 필수 항목: 고객 성명, 휴대전화번호, 희망 수령일시, 배달 주소(배달 주문 시 상세주소 포함), 픽업 매장(픽업 주문 시)
- 자동 수집 항목: 서비스 이용 기록, 접속 IP 주소, 단말기 OS/브라우저 정보, GPS 위치 좌표(사용자가 기기 권한을 허용한 경우에 한함)

제3조 (개인정보의 처리 및 보유 기간)
① 카페는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
② 단체 주문 및 견적 접수 정보의 보유 기간은 배달 완료 또는 주문 완료일로부터 14일입니다. 사후 배달 오류 방지 및 CS 처리 완료 후 지체 없이 데이터베이스에서 안전하게 영구 파기합니다.

제4조 (개인정보의 제3자 제공 및 처리 위탁)
① 카페는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의 또는 법률의 특별한 규정 등에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
② 배달 대행 업체: 배달 기사 (주문 상품 배송 목적 / 성명, 연락처, 주소 / 배송 완료 시까지)
③ 호스팅 및 클라우드 인프라: Supabase, Vercel (시스템 데이터 보관 및 안전 호스팅)

제5조 (정보주체와 법정대리인의 권리·의무 및 행사방법)
정보주체는 카페에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있으며, 고객센터 유선 연락을 통해 즉시 조치받으실 수 있습니다.

제6조 (개인정보의 안전성 확보조치)
카페는 개인정보의 안전성 확보를 위해 데이터 암호화 통신(SSL/TLS), 관리자 인증 접근 통제 등의 기술적·관리적 보호 조치를 강구하고 있습니다.

제7조 (개인정보 보호책임자)
- 개인정보 보호책임자: 은달 카페 대표
- 문의 연락처: 02-1234-5678 (운영시간: 09:00 ~ 21:00)`;

export default function AdminCafeInfoPage() {
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const appIconFileInputRef = useRef<HTMLInputElement>(null);
  const sealFileInputRef = useRef<HTMLInputElement>(null);

  // 새 배너 URL 직접 추가용 입력값
  const [newBannerUrl, setNewBannerUrl] = useState('');
  // 새 로고 URL 직접 추가용 입력값
  const [newLogoUrl, setNewLogoUrl] = useState('');

  const [form, setForm] = useState({
    name: '',
    slogan: '',
    description: '',
    hero_image_url: '',
    logo_icon_url: '',
    app_icon_url: '',
    hero_images: [] as string[],
    logo_images: [] as string[],
    phone: '',
    address: '',
    business_hours: '',
    // 1호점 및 2호점 구분 필드
    store1_name: '은달 1호점(조원)',
    store1_address: '',
    store1_business_hours: '',
    store1_phone: '',
    store2_name: '은달 2호점(파장)',
    store2_address: '',
    store2_business_hours: '',
    store2_phone: '',
    quote_notice: '',
    // 납품사례(포트폴리오) 홍보 문구
    portfolio_title: '',
    portfolio_subtitle: '',
    instagram_url: '',
    youtube_url: '',
    naver_url: '',
    google_url: '',
    business_number: '',
    owner_name: '',
    business_type: '음식점업',
    business_item: '커피, 디저트, 샌드위치',
    seal_image_url: '',
    privacy_officer: '',
    privacy_policy: '',
    manager_kakao_id: '',
    manager_phone: '',
    // 실시간 주문 알림 연동
    telegram_bot_token: '',
    telegram_chat_id: '',
    sms_service_type: 'webhook' as 'webhook' | 'aligo' | 'none',
    sms_api_key: '',
    sms_user_id: '',
    sms_sender_phone: '',
    sms_webhook_url: '',
  });

  const loadCafeInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/cafe-info');
      const data = await res.json();
      if (data.cafe) {
        setCafe(data.cafe);
        const heroImages = Array.isArray(data.cafe.hero_images) && data.cafe.hero_images.length > 0
          ? data.cafe.hero_images
          : (data.cafe.hero_image_url ? [data.cafe.hero_image_url] : []);
        const logoImages = Array.isArray(data.cafe.logo_images) && data.cafe.logo_images.length > 0
          ? data.cafe.logo_images
          : (data.cafe.logo_icon_url ? [data.cafe.logo_icon_url] : []);

        setForm({
          name: data.cafe.name || '',
          slogan: data.cafe.slogan || '',
          description: data.cafe.description || '',
          hero_image_url: heroImages[0] || data.cafe.hero_image_url || '',
          logo_icon_url: logoImages[0] || data.cafe.logo_icon_url || '',
          app_icon_url: data.cafe.app_icon_url || '',
          hero_images: heroImages,
          logo_images: logoImages,
          phone: data.cafe.phone || '',
          address: data.cafe.address || '',
          business_hours: data.cafe.business_hours || '',
          store1_name: data.cafe.store1_name || '은달 1호점(조원)',
          store1_address: data.cafe.store1_address || data.cafe.address || '',
          store1_business_hours: data.cafe.store1_business_hours || data.cafe.business_hours || '',
          store1_phone: data.cafe.store1_phone || data.cafe.phone || '',
          store2_name: data.cafe.store2_name || '은달 2호점(파장)',
          store2_address: data.cafe.store2_address || '경기 수원시 장안구 경수대로1043번길 3 은달 파장2호점',
          store2_business_hours: data.cafe.store2_business_hours || data.cafe.business_hours || '',
          store2_phone: data.cafe.store2_phone || '031-255-0816',
          quote_notice: data.cafe.quote_notice || '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다.',
          portfolio_title: data.cafe.portfolio_title || '',
          portfolio_subtitle: data.cafe.portfolio_subtitle || '',
          instagram_url: data.cafe.instagram_url || '',
          youtube_url: data.cafe.youtube_url || '',
          naver_url: data.cafe.naver_url || '',
          google_url: data.cafe.google_url || '',
          business_number: data.cafe.business_number || '',
          owner_name: data.cafe.owner_name || '',
          business_type: data.cafe.business_type || '음식점업',
          business_item: data.cafe.business_item || '커피, 디저트, 샌드위치',
          seal_image_url: data.cafe.seal_image_url || '',
          privacy_officer: data.cafe.privacy_officer || '',
          privacy_policy: data.cafe.privacy_policy || '',
          manager_kakao_id: data.cafe.manager_kakao_id || '',
          manager_phone: data.cafe.manager_phone || '',
          telegram_bot_token: data.cafe.telegram_bot_token || '',
          telegram_chat_id: data.cafe.telegram_chat_id || '',
          sms_service_type: data.cafe.sms_service_type || 'webhook',
          sms_api_key: data.cafe.sms_api_key || '',
          sms_user_id: data.cafe.sms_user_id || '',
          sms_sender_phone: data.cafe.sms_sender_phone || '',
          sms_webhook_url: data.cafe.sms_webhook_url || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 텔레그램 테스트 발송
  const handleTestTelegram = async () => {
    if (!form.telegram_bot_token.trim() || !form.telegram_chat_id.trim()) {
      alert('텔레그램 봇 토큰과 채팅방 ID를 먼저 입력해주세요.');
      return;
    }

    try {
      setTestingTelegram(true);
      const res = await fetch('/api/admin/notify-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'telegram',
          telegram_bot_token: form.telegram_bot_token.trim(),
          telegram_chat_id: form.telegram_chat_id.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || '텔레그램 테스트 메시지가 전송되었습니다! 텔레그램 앱을 확인해주세요.');
      } else {
        alert(data.error || '텔레그램 테스트 전송에 실패했습니다.');
      }
    } catch {
      alert('테스트 전송 중 네트워크 오류가 발생했습니다.');
    } finally {
      setTestingTelegram(false);
    }
  };

  // SMS 테스트 발송
  const handleTestSms = async () => {
    try {
      setTestingSms(true);
      const res = await fetch('/api/admin/notify-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'sms',
          sms_service_type: form.sms_service_type,
          sms_api_key: form.sms_api_key.trim(),
          sms_user_id: form.sms_user_id.trim(),
          sms_sender_phone: form.sms_sender_phone.trim(),
          sms_webhook_url: form.sms_webhook_url.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'SMS 테스트 전송이 완료되었습니다!');
      } else {
        alert(data.error || 'SMS 테스트 전송에 실패했습니다.');
      }
    } catch {
      alert('테스트 전송 중 네트워크 오류가 발생했습니다.');
    } finally {
      setTestingSms(false);
    }
  };

  useEffect(() => {
    loadCafeInfo();
  }, []);

  const handleFileUpload = async (file: File, target: 'banner' | 'logo' | 'app_icon' | 'seal') => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    if (target === 'banner') setUploadingBanner(true);
    else if (target === 'logo') setUploadingLogo(true);
    else if (target === 'app_icon') setUploadingAppIcon(true);
    else setUploadingSeal(true);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (target === 'banner') {
          setForm((prev) => {
            const nextList = [...prev.hero_images, data.url];
            return {
              ...prev,
              hero_images: nextList,
              hero_image_url: nextList[0] || data.url,
            };
          });
        } else if (target === 'logo') {
          setForm((prev) => {
            const nextList = [...prev.logo_images, data.url];
            return {
              ...prev,
              logo_images: nextList,
              logo_icon_url: nextList[0] || data.url,
            };
          });
        } else if (target === 'app_icon') {
          setForm((prev) => ({ ...prev, app_icon_url: data.url }));
        } else {
          setForm((prev) => ({ ...prev, seal_image_url: data.url }));
        }
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      if (target === 'banner') setUploadingBanner(false);
      else if (target === 'logo') setUploadingLogo(false);
      else if (target === 'app_icon') setUploadingAppIcon(false);
      else setUploadingSeal(false);
    }
  };

  // 배너 이미지 삭제
  const handleRemoveHeroImage = (index: number) => {
    setForm((prev) => {
      const nextList = prev.hero_images.filter((_, i) => i !== index);
      return {
        ...prev,
        hero_images: nextList,
        hero_image_url: nextList[0] || '',
      };
    });
  };

  // 로고 이미지 삭제
  const handleRemoveLogoImage = (index: number) => {
    setForm((prev) => {
      const nextList = prev.logo_images.filter((_, i) => i !== index);
      return {
        ...prev,
        logo_images: nextList,
        logo_icon_url: nextList[0] || '',
      };
    });
  };

  // 배너 URL 직접 추가
  const handleAddHeroUrl = () => {
    if (!newBannerUrl.trim()) return;
    setForm((prev) => {
      const nextList = [...prev.hero_images, newBannerUrl.trim()];
      return {
        ...prev,
        hero_images: nextList,
        hero_image_url: nextList[0] || newBannerUrl.trim(),
      };
    });
    setNewBannerUrl('');
  };

  // 로고 URL 직접 추가
  const handleAddLogoUrl = () => {
    if (!newLogoUrl.trim()) return;
    setForm((prev) => {
      const nextList = [...prev.logo_images, newLogoUrl.trim()];
      return {
        ...prev,
        logo_images: nextList,
        logo_icon_url: nextList[0] || newLogoUrl.trim(),
      };
    });
    setNewLogoUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/cafe-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccessMsg('카페 정보와 이미지/아이콘 및 견적 안내문구가 성공적으로 저장되었습니다.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
        <p className="text-xs">카페 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* 타이틀 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-700" />
            <span>카페 소개 & 비주얼 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            홈페이지 메인 및 소개 모달에 노출되는 카페 이름, 소개글, 대표 이미지, 아이콘, 견적 안내 문구를 변경합니다.
          </p>
        </div>

        <button
          onClick={loadCafeInfo}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs border border-stone-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 text-xs">
        {/* 1. 이미지 및 아이콘 변경 (직접 파일 업로드 지원) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-700" />
              대표 이미지 및 로고/아이콘 변경
            </h3>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              파일 직접 업로드 및 URL 입력 지원
            </span>
          </div>

          <div className="space-y-6">
            {/* 1. 대표 배너 이미지 (복수 이미지 롤링 지원) */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-stone-900 font-bold text-xs flex items-center gap-1.5">
                    <span>🎞️ 대표 배너 이미지 목록</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                      홈페이지 자동 롤링/슬라이더 연동 ({form.hero_images.length}개)
                    </span>
                  </label>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    홈페이지 상단 메인 비주얼 배너에 복수의 이미지가 주기적으로 부드럽게 롤링(전환)됩니다.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={bannerFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'banner');
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingBanner}
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingBanner ? '업로드 중...' : '📷 새 사진 파일 추가'}</span>
                  </button>
                </div>
              </div>

              {/* URL 직접 추가 입력창 */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="외부 이미지 URL 직접 추가 (https://...)"
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHeroUrl(); } }}
                  className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddHeroUrl}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl"
                >
                  URL 추가
                </button>
              </div>

              {/* 등록된 배너 썸네일 그리드 */}
              {form.hero_images.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-stone-200 text-center text-stone-400 text-xs">
                  등록된 대표 배너 이미지가 없습니다. 상단 버튼으로 사진을 추가해주세요.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {form.hero_images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-300 bg-white aspect-video shadow-xs">
                      <img src={imgUrl} alt={`배너 ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveHeroImage(idx)}
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                          title="이미지 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                        {idx === 0 ? '★ 대표' : `#${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. 카페 로고 및 바로가기 아이콘 (복수 로고 관리 지원) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 로고 / 아이콘 */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-stone-900 font-bold text-xs flex items-center gap-1">
                    <span>☕ 카페 로고 / 아이콘 ({form.logo_images.length}개)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logo');
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingLogo ? '업로드 중...' : '파일 추가'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="url"
                    placeholder="로고 URL 추가 (https://...)"
                    value={newLogoUrl}
                    onChange={(e) => setNewLogoUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLogoUrl(); } }}
                    className="flex-1 p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddLogoUrl}
                    className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl"
                  >
                    추가
                  </button>
                </div>

                {/* 등록된 로고 썸네일들 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.logo_images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300 bg-white shadow-xs">
                      <img src={imgUrl} alt={`로고 ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveLogoImage(idx)}
                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="로고 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 바탕화면 즐겨찾기 / 바로가기 아이콘 (PWA) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-stone-900 font-bold text-xs flex items-center gap-1.5">
                    <span>📱 휴대폰 바탕화면 바로가기 아이콘</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full font-bold">홈화면 추가용</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={appIconFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'app_icon');
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingAppIcon}
                      onClick={() => appIconFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingAppIcon ? '업로드 중...' : '파일 업로드'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  value={form.app_icon_url}
                  onChange={(e) => setForm({ ...form, app_icon_url: e.target.value })}
                  placeholder="https://... 또는 파일 업로드 (비워둘 시 기본 로고 사용)"
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
                <div className="h-16 rounded-xl bg-white border border-stone-200 flex items-center justify-center gap-3 px-3">
                  <img
                    src={form.app_icon_url || form.logo_images[0] || form.logo_icon_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80'}
                    alt="바탕화면 아이콘 미리보기"
                    className="w-10 h-10 rounded-xl object-cover shadow-sm border border-amber-400"
                  />
                  <span className="text-[11px] text-stone-600 font-medium">
                    스마트폰 바탕화면 추가 시 표시되는 앱 아이콘
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 견적 요청 안내 문구 설정 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              견적 요청 접수 안내 문구 설정
            </h3>
            <span className="text-[11px] text-stone-500">
              고객 견적 완료 시 팝업 및 상태 확인 창에 노출
            </span>
          </div>
          <div>
            <label className="block text-stone-700 font-bold mb-1">
              견적 완료 팝업 안내 텍스트
            </label>
            <textarea
              rows={2}
              required
              value={form.quote_notice}
              onChange={(e) => setForm({ ...form, quote_notice: e.target.value })}
              placeholder="견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium leading-relaxed focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              * 고객이 온라인에서 견적 요청을 접수했을 때 "견적이 정상 접수되었습니다!" 메시지 아래에 표시될 안내 문구입니다.
            </p>
          </div>
        </div>

        {/* 3. 카페 기본 소개 정보 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
            기본 브랜드 및 소개 문구
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">카페 상호명</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">한 줄 슬로건</label>
              <input
                type="text"
                required
                value={form.slogan}
                onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">상세 브랜드 스토리 및 소개글</label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* 4. 영업 및 매장 정보 (1호점 및 2호점 분리 확장) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-700" />
                <span>은달 매장별 영업시간 및 주소 관리 (1호점 / 2호점 분리)</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                1호점(조원)과 2호점(파장)의 매장 주소, 영업시간, 전화번호를 각각 독립적으로 설정하여 고객 안내 화면에 구분 노출합니다.
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              2개 매장 분리 연동
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 은달 1호점 (조원) 정보 카드 */}
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                  <span>은달 1호점 (조원점)</span>
                </span>
                <span className="text-[10px] text-amber-800 font-bold bg-white px-2 py-0.5 rounded-full border border-amber-200">
                  본점 / 조원시장 맞은편
                </span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 text-[11px]">1호점 명칭</label>
                <input
                  type="text"
                  required
                  value={form.store1_name}
                  onChange={(e) => setForm({ ...form, store1_name: e.target.value })}
                  placeholder="은달 1호점(조원)"
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  1호점 매장 주소
                </label>
                <input
                  type="text"
                  required
                  value={form.store1_address}
                  onChange={(e) => setForm({ ...form, store1_address: e.target.value, address: e.target.value })}
                  placeholder="경기 수원시 장안구 조원로 16 상가동 1층 108-1"
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-bold mb-1 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    1호점 영업시간
                  </label>
                  <input
                    type="text"
                    required
                    value={form.store1_business_hours}
                    onChange={(e) => setForm({ ...form, store1_business_hours: e.target.value, business_hours: e.target.value })}
                    placeholder="09:00 ~ 21:00"
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1 text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-700" />
                    1호점 전화번호
                  </label>
                  <input
                    type="text"
                    value={form.store1_phone}
                    onChange={(e) => setForm({ ...form, store1_phone: e.target.value, phone: e.target.value })}
                    placeholder="031-000-0000"
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 은달 2호점 (파장) 정보 카드 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-stone-800 text-white text-[10px] font-black flex items-center justify-center">2</span>
                  <span>은달 2호점 (파장점)</span>
                </span>
                <span className="text-[10px] text-stone-600 font-bold bg-white px-2 py-0.5 rounded-full border border-stone-200">
                  파장초 인근 / 북수원
                </span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 text-[11px]">2호점 명칭</label>
                <input
                  type="text"
                  required
                  value={form.store2_name}
                  onChange={(e) => setForm({ ...form, store2_name: e.target.value })}
                  placeholder="은달 2호점(파장)"
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-700" />
                  2호점 매장 주소
                </label>
                <input
                  type="text"
                  required
                  value={form.store2_address}
                  onChange={(e) => setForm({ ...form, store2_address: e.target.value })}
                  placeholder="경기 수원시 장안구 경수대로1043번길 3 은달 파장2호점"
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-bold mb-1 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-700" />
                    2호점 영업시간
                  </label>
                  <input
                    type="text"
                    required
                    value={form.store2_business_hours}
                    onChange={(e) => setForm({ ...form, store2_business_hours: e.target.value })}
                    placeholder="09:00 ~ 21:00"
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1 text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-700" />
                    2호점 전화번호
                  </label>
                  <input
                    type="text"
                    value={form.store2_phone}
                    onChange={(e) => setForm({ ...form, store2_phone: e.target.value })}
                    placeholder="031-255-0816"
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4.5. 총괄관리자 카카오톡 & 직통 연락처 설정 (주문 접수 시 즉시 전송 연동) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>💬 총괄관리자 카카오톡 & 주문 알림 설정</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                원클릭 카톡 전송 연동
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              고객이 주문 접수 완료 시 또는 관리자가 주문을 총괄관리자에게 카톡으로 보낼 때 사용되는 카카오톡 ID 및 연락처입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                카카오톡 ID 또는 오픈프로필 링크
              </label>
              <input
                type="text"
                placeholder="예: eundal_boss 또는 https://open.kakao.com/o/..."
                value={form.manager_kakao_id}
                onChange={(e) => setForm({ ...form, manager_kakao_id: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                총괄관리자 직통 연락처
              </label>
              <input
                type="text"
                placeholder="예: 010-1234-5678"
                value={form.manager_phone}
                onChange={(e) => setForm({ ...form, manager_phone: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>

        {/* 4.8. 단체 납품사례(포트폴리오) 홍보 문구 설정 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>단체 납품사례(포트폴리오) 홍보 문구 설정</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                홈페이지 배너 실시간 반영
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              홈페이지 납품사례(/portfolio) 페이지 상단 히어로 배너에 노출될 헤드라인(제목)과 소개 문구(부제목)를 설정합니다. 미입력 시 은달 기본 문구가 표시됩니다.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1 text-xs">
                포트폴리오 메인 헤드라인 (제목)
              </label>
              <textarea
                rows={2}
                placeholder={`믿고 맡기는 정시 배달과 신선함,\n은달의 실제 단체 납품 사례를 확인하세요`}
                value={form.portfolio_title}
                onChange={(e) => setForm({ ...form, portfolio_title: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium text-xs resize-none"
              />
              <span className="text-[11px] text-stone-400">※ 줄바꿈을 입력하면 실제 홈페이지 배너에서도 그대로 줄바꿈되어 강조됩니다.</span>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1 text-xs">
                포트폴리오 상세 설명 문구 (부제목)
              </label>
              <textarea
                rows={2}
                placeholder="관공서, 대학교 학술제, 기업 세미나, 병원 연구실까지. 약속된 시간에 맞춰 따뜻한 커피와 갓 만든 디저트를 안전하게 배송해 드린 생생한 현장 기록입니다."
                value={form.portfolio_subtitle}
                onChange={(e) => setForm({ ...form, portfolio_subtitle: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* 5. SNS 홍보 채널 링크 (홈페이지 푸터 & 헤더 연동) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              SNS & 외부 홍보 채널 링크 연동
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              홈페이지 하단 푸터 및 주요 화면에 노출될 인스타그램, 유튜브, 네이버 플레이스, 구글 지도 링크를 설정합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                📸 인스타그램 링크
              </label>
              <input
                type="url"
                placeholder="https://www.instagram.com/eundal_cafe"
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium text-xs"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                🎥 유튜브 링크
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/@eundal_cafe"
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium text-xs"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                🟢 네이버 플레이스 / 지도 / 블로그 링크
              </label>
              <input
                type="url"
                placeholder="https://map.naver.com/p/search/은달카페"
                value={form.naver_url}
                onChange={(e) => setForm({ ...form, naver_url: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium text-xs"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                🌐 구글 지도 / 비즈니스 프로필 링크
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=은달카페"
                value={form.google_url}
                onChange={(e) => setForm({ ...form, google_url: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium text-xs"
              />
            </div>
          </div>
        </div>

        {/* 6. 사업자(공급자) 정보 및 직인 설정 (견적서 & 푸터 연동) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>사업자(공급자) 정보 및 직인 (공식 견적서 & 푸터 연동)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                공식 견적서(A4/PDF/XLSX)의 공급자 란 및 홈페이지 하단 푸터에 자동 반영되는 사업자 정보입니다.
              </p>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              견적서 서식 반영
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">상호 (업체명)</label>
              <input
                type="text"
                placeholder="예: 은달 카페"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">대표자명 (성명)</label>
              <input
                type="text"
                placeholder="예: 김은달"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">사업자등록번호</label>
              <input
                type="text"
                placeholder="예: 569-06-01382"
                value={form.business_number}
                onChange={(e) => setForm({ ...form, business_number: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">업태</label>
              <input
                type="text"
                placeholder="예: 음식점업"
                value={form.business_type}
                onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">종목</label>
              <input
                type="text"
                placeholder="예: 커피, 디저트, 샌드위치"
                value={form.business_item}
                onChange={(e) => setForm({ ...form, business_item: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">개인정보보호책임자</label>
              <input
                type="text"
                placeholder="예: 김은달 (대표)"
                value={form.privacy_officer}
                onChange={(e) => setForm({ ...form, privacy_officer: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-bold mb-1">사업장 주소 (견적서 공급자 주소)</label>
              <input
                type="text"
                placeholder="예: 경기도 수원시 장안구 조원로 16"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">대표 전화번호 (견적서 공급자 번호)</label>
              <input
                type="text"
                placeholder="예: 010-9986-2418"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium font-mono"
              />
            </div>
          </div>

          {/* 직인(도장) 이미지 관리 */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-stone-800 font-bold text-xs">
                  견적서 대표 직인(도장) 이미지
                </label>
                <p className="text-[11px] text-stone-500">
                  견적서 공급자 란 성명 옆에 날인되는 직인입니다. (투명 배경 PNG 권장, 미등록 시 자동 붉은색 (인) 표기)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
              {/* 직인 미리보기 */}
              <div className="w-16 h-16 rounded-xl border border-stone-300 bg-white flex items-center justify-center p-1 relative shrink-0 shadow-2xs">
                {form.seal_image_url ? (
                  <img
                    src={form.seal_image_url}
                    alt="직인 미리보기"
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-red-600 flex items-center justify-center text-red-600 font-black text-xs">
                    인
                  </div>
                )}
              </div>

              {/* 직인 업로드 & URL 입력 컨트롤 */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={sealFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], 'seal');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => sealFileInputRef.current?.click()}
                    disabled={uploadingSeal}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {uploadingSeal ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingSeal ? '업로드 중...' : '직인 파일 업로드'}</span>
                  </button>

                  {form.seal_image_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, seal_image_url: '' })}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>직인 삭제 (기본도장 사용)</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="직인 이미지 직접 URL 입력 (예: https://...)"
                  value={form.seal_image_url}
                  onChange={(e) => setForm({ ...form, seal_image_url: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6-1. 개인정보처리방침 전문 내용 설정 (홈페이지 푸터 연동) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>개인정보처리방침 전문 내용 설정 (홈페이지 푸터 연동)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                홈페이지 하단 푸터의 [개인정보처리방침]을 클릭했을 때 고객에게 고지되는 전문 내용입니다. 관리자가 직접 수정 및 관리할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setForm({ ...form, privacy_policy: DEFAULT_PRIVACY_POLICY })}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-colors"
                title="대한민국 개인정보보호법 제30조 표준 약관 전문을 에디터에 채웁니다"
              >
                📄 표준 서식 채우기
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('개인정보처리방침을 비우고 기본 표준 약관으로 복원하시겠습니까?')) {
                    setForm({ ...form, privacy_policy: '' });
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 text-[11px] font-bold transition-colors"
                title="내용을 비워 시스템 기본 서식이 적용되도록 리셋합니다"
              >
                🧹 비우기 (기본값)
              </button>
            </div>
          </div>

          <div>
            <textarea
              rows={12}
              value={form.privacy_policy}
              onChange={(e) => setForm({ ...form, privacy_policy: e.target.value })}
              placeholder="개인정보처리방침 전문을 입력하세요. (비워둘 경우 시스템 표준 기본 약관이 자동으로 노출됩니다)"
              className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl font-sans text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
              <span>* 작성하신 줄바꿈 및 문단 구성이 홈페이지 모달에 그대로 반영됩니다.</span>
              <span>글자수: {form.privacy_policy.length}자</span>
            </div>
          </div>
        </div>

        {/* 7. 실시간 주문 자동 알림 - 텔레그램 봇 (강력 추천 / 100% 무료 & 0.1초 즉시 푸시) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-5 rounded-2xl border-2 border-amber-300 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Bell className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  실시간 주문 자동 알림 연동 — 텔레그램 봇 (강력 추천 ⭐⭐⭐⭐⭐)
                </h3>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                고객이 주문서를 접수하는 즉시 관리자 스마트폰으로 소리/진동과 함께 0.1초 만에 알림이 울립니다. (100% 평생 무료)
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto shrink-0"
              title="입력한 봇 토큰과 채팅방 ID로 테스트 메시지를 전송합니다"
            >
              {testingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{testingTelegram ? '전송 중...' : '🔔 텔레그램 테스트 전송'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-800 font-bold mb-1">
                텔레그램 봇 토큰 (Bot Token)
              </label>
              <input
                type="text"
                placeholder="예: 7123456789:AAHq_xyz..."
                value={form.telegram_bot_token}
                onChange={(e) => setForm({ ...form, telegram_bot_token: e.target.value })}
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                텔레그램에서 <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">@BotFather</code>에게 발급받은 API Token
              </p>
            </div>

            <div>
              <label className="block text-stone-800 font-bold mb-1">
                알림 수신 Chat ID (개인 ID 또는 그룹방 ID)
              </label>
              <input
                type="text"
                placeholder="예: 123456789 또는 -1001234567890"
                value={form.telegram_chat_id}
                onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                텔레그램 <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">@userinfobot</code>으로 확인한 본인의 Chat ID (그룹방 초대 시 매니저 전원 동시 수신 가능)
              </p>
            </div>
          </div>

          {/* 1분 간편 가이드 박스 */}
          <div className="bg-amber-100/60 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
            <p className="font-bold flex items-center gap-1 text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>텔레그램 무료 실시간 알림봇 1분 세팅 가이드</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-700 pl-1 leading-relaxed">
              <li>스마트폰 텔레그램 앱 검색창에 <strong>@BotFather</strong>를 검색하고 대화창에서 <code className="bg-white/80 px-1 rounded">/newbot</code>을 입력합니다.</li>
              <li>봇 이름과 아이디를 정하면 나오는 <strong>HTTP API Token</strong>(긴 문자열)을 복사하여 위 [봇 토큰]에 붙여넣습니다.</li>
              <li>검색창에 <strong>@userinfobot</strong>을 검색하고 <strong>/start</strong>를 누르면 나타나는 <strong>Id: 12345678</strong> 숫자를 위 [Chat ID]에 넣습니다.</li>
              <li>하단 [저장] 후 <strong>[🔔 텔레그램 테스트 전송]</strong>을 누르면 스마트폰으로 즉시 '띵동!' 소리와 함께 알림이 옵니다.</li>
            </ol>
          </div>
        </div>

        {/* 8. 실시간 SMS 문자 및 Webhook 알림 연동 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-stone-800 text-white flex items-center justify-center font-bold text-xs">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  실시간 SMS 문자 & Webhook 알림 연동 설정
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                직원 관리 메뉴에서 'SMS 알림'이 켜진 관리자 휴대폰으로 주문 알림 문자를 자동 발송합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestSms}
              disabled={testingSms}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto shrink-0"
              title="SMS/Webhook 테스트 전송"
            >
              {testingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{testingSms ? '발송 중...' : '📱 SMS 테스트 전송'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">연동 방식 선택</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'aligo', label: '알리고(Aligo) SMS API' },
                  { key: 'webhook', label: '외부 Webhook URL (슬랙/디스코드/게이트웨이)' },
                  { key: 'none', label: '미사용 (텔레그램 푸시만 사용)' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setForm({ ...form, sms_service_type: m.key as any })}
                    className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                      form.sms_service_type === m.key
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {form.sms_service_type === 'aligo' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">알리고 API Key</label>
                  <input
                    type="password"
                    placeholder="알리고 관리콘솔 API Key"
                    value={form.sms_api_key}
                    onChange={(e) => setForm({ ...form, sms_api_key: e.target.value })}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">알리고 사용자 ID</label>
                  <input
                    type="text"
                    placeholder="알리고 아이디"
                    value={form.sms_user_id}
                    onChange={(e) => setForm({ ...form, sms_user_id: e.target.value })}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">사전 등록된 발신번호</label>
                  <input
                    type="text"
                    placeholder="예: 01012345678"
                    value={form.sms_sender_phone}
                    onChange={(e) => setForm({ ...form, sms_sender_phone: e.target.value })}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">* 전기통신사업법상 알리고에 사전 등록된 발신번호만 발송 가능</p>
                </div>
              </div>
            )}

            {form.sms_service_type === 'webhook' && (
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-stone-700 font-bold mb-1">Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/... 또는 SMS 게이트웨이 엔드포인트"
                  value={form.sms_webhook_url}
                  onChange={(e) => setForm({ ...form, sms_webhook_url: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '저장 처리 중...' : '카페 소개 정보 및 이미지 저장'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
