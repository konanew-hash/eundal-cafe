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
} from 'lucide-react';
import { CafeInfo } from '@/lib/types';

export default function AdminCafeInfoPage() {
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const appIconFileInputRef = useRef<HTMLInputElement>(null);

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
    quote_notice: '',
    instagram_url: '',
    youtube_url: '',
    naver_url: '',
    google_url: '',
    business_number: '',
    owner_name: '',
    privacy_officer: '',
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
          quote_notice: data.cafe.quote_notice || '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다.',
          instagram_url: data.cafe.instagram_url || '',
          youtube_url: data.cafe.youtube_url || '',
          naver_url: data.cafe.naver_url || '',
          google_url: data.cafe.google_url || '',
          business_number: data.cafe.business_number || '',
          owner_name: data.cafe.owner_name || '',
          privacy_officer: data.cafe.privacy_officer || '',
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

  const handleFileUpload = async (file: File, target: 'banner' | 'logo' | 'app_icon') => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    if (target === 'banner') setUploadingBanner(true);
    else if (target === 'logo') setUploadingLogo(true);
    else setUploadingAppIcon(true);

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
        } else {
          setForm((prev) => ({ ...prev, app_icon_url: data.url }));
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
      else setUploadingAppIcon(false);
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

        {/* 4. 영업 및 매장 정보 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
            영업시간 및 매장 연락처
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                대표 전화번호
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                영업 및 배달 시간
              </label>
              <input
                type="text"
                required
                value={form.business_hours}
                onChange={(e) => setForm({ ...form, business_hours: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                매장 주소
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
              />
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

        {/* 6. 사업자 정보 및 개인정보보호 책임자 (법령 준수) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              사업자 정보 및 개인정보보호 책임자 (법령 표기용)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              전자상거래법 및 개인정보보호법에 의거하여 홈페이지 하단 푸터에 의무 고지되는 사업자 정보입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">대표자명</label>
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
                placeholder="예: 123-45-67890"
                value={form.business_number}
                onChange={(e) => setForm({ ...form, business_number: e.target.value })}
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
