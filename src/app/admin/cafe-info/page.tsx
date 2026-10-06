'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Store, Save, RefreshCw, CheckCircle, Image as ImageIcon, MapPin, Clock, Phone, Upload, FileText } from 'lucide-react';
import { CafeInfo } from '@/lib/types';

export default function AdminCafeInfoPage() {
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    slogan: '',
    description: '',
    hero_image_url: '',
    logo_icon_url: '',
    phone: '',
    address: '',
    business_hours: '',
    quote_notice: '',
  });

  const loadCafeInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/cafe-info');
      const data = await res.json();
      if (data.cafe) {
        setCafe(data.cafe);
        setForm({
          name: data.cafe.name || '',
          slogan: data.cafe.slogan || '',
          description: data.cafe.description || '',
          hero_image_url: data.cafe.hero_image_url || '',
          logo_icon_url: data.cafe.logo_icon_url || '',
          phone: data.cafe.phone || '',
          address: data.cafe.address || '',
          business_hours: data.cafe.business_hours || '',
          quote_notice: data.cafe.quote_notice || '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다.',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCafeInfo();
  }, []);

  const handleFileUpload = async (file: File, target: 'banner' | 'logo') => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    if (target === 'banner') setUploadingBanner(true);
    else setUploadingLogo(true);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (target === 'banner') {
          setForm((prev) => ({ ...prev, hero_image_url: data.url }));
        } else {
          setForm((prev) => ({ ...prev, logo_icon_url: data.url }));
        }
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      if (target === 'banner') setUploadingBanner(false);
      else setUploadingLogo(false);
    }
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 대표 배너 이미지 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-stone-700 font-bold">대표 배너 이미지</label>
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadingBanner ? '업로드 중...' : '파일 직접 업로드'}</span>
                  </button>
                </div>
              </div>
              <input
                type="url"
                required
                value={form.hero_image_url}
                onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                placeholder="https://... 또는 우측 상단 파일 업로드"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
              />
              {/* 이미지 미리보기 */}
              <div className="relative h-36 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={form.hero_image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'}
                  alt="대표 배너 미리보기"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                  배너 미리보기
                </span>
              </div>
            </div>

            {/* 로고 / 아이콘 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-stone-700 font-bold">카페 로고 / 아이콘</label>
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
                    <span>{uploadingLogo ? '업로드 중...' : '파일 직접 업로드'}</span>
                  </button>
                </div>
              </div>
              <input
                type="url"
                required
                value={form.logo_icon_url}
                onChange={(e) => setForm({ ...form, logo_icon_url: e.target.value })}
                placeholder="https://... 또는 우측 상단 파일 업로드"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
              />
              {/* 아이콘 미리보기 */}
              <div className="h-36 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center p-4">
                <div className="text-center">
                  <img
                    src={form.logo_icon_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80'}
                    alt="로고 아이콘 미리보기"
                    className="w-16 h-16 rounded-full object-cover mx-auto shadow-sm border-2 border-amber-300"
                  />
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-bold">
                    아이콘 미리보기
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
