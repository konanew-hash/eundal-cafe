'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Camera,
  Upload,
  Trash2,
  CheckCircle,
  Eye,
  Store,
  Clock,
  User,
  AlertCircle,
  X,
  RefreshCw,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { ManagerNotice, Store as StoreType } from '@/lib/types';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<ManagerNotice[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');

  // 작성 폼 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeId, setStoreId] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 실시간 시계 (작성 시간 기준)
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // 확대 보기 모달 상태
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 카메라 촬영 input ref & 파일 선택 input ref
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 실시간 시각 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 데이터 로딩 (전달사항 목록 & 점포 목록)
  const loadData = async () => {
    try {
      setLoading(true);
      const [noticesRes, storesRes] = await Promise.all([
        fetch('/api/admin/notices'),
        fetch('/api/admin/stores'),
      ]);

      if (noticesRes.ok) {
        const noticesData = await noticesRes.json();
        setNotices(noticesData.notices || []);
        if (noticesData.currentAdmin) {
          setCurrentAdmin(noticesData.currentAdmin);
        }
      }

      if (storesRes.ok) {
        const storesData = await storesRes.json();
        const storeList: StoreType[] = storesData.stores || [];
        setStores(storeList);
        if (storeList.length > 0 && !storeName) {
          // 기본 선택 점포
          setStoreName(storeList[0].name);
          setStoreId(storeList[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load notices or stores:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 사진 업로드 공통 처리 (카메라 촬영 또는 파일 선택)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setPhotoUrls((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      console.error(err);
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingPhoto(false);
      // input 초기화
      e.target.value = '';
    }
  };

  // 첨부 사진 삭제
  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // 신규 전달사항 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('전달 내역을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeName,
          store_id: storeId || null,
          content: content.trim(),
          photo_urls: photoUrls,
          is_important: isImportant,
        }),
      });

      if (res.ok) {
        setContent('');
        setPhotoUrls([]);
        setIsImportant(false);
        setIsFormOpen(false);
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || '전달사항 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 읽음 처리 핸들러
  const handleMarkAsRead = async (noticeId: string) => {
    try {
      const res = await fetch(`/api/admin/notices/${noticeId}`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const data = await res.json();
        setNotices((prev) =>
          prev.map((n) => (n.id === noticeId ? data.notice : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 전달사항 삭제 핸들러
  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('정말 이 전달사항을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/notices/${noticeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    }
  };

  // 필터링된 전달사항 목록
  const filteredNotices = notices.filter((n) => {
    if (selectedStoreFilter === 'all') return true;
    return n.store_name === selectedStoreFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      {/* 1. 상단 타이틀 & 액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-stone-900 flex items-center gap-2 tracking-tight">
            <MessageSquare className="w-5 h-5 text-amber-700" />
            <span>관리자·매니저 전달사항 및 점포 변경공지</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            점포 간 인수인계, 물품 발주 변동, 당일 영업 특이사항을 사진과 함께 실시간 공유하고 열람을 확인합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs border border-stone-200 transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormOpen ? '작성창 닫기' : '새 전달사항 작성'}</span>
          </button>
        </div>
      </div>

      {/* 2. 새 전달사항 작성 폼 (열림 상태 시 노출) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md space-y-4 animate-in fade-in text-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <h3 className="font-bold text-sm text-stone-900">새 전달사항 작성</h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] font-bold text-red-600 cursor-pointer bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>중요 긴급 공지</span>
              </label>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 작성 메타 정보 바 (날짜/시간 기준, 작성자 아이디, 점포명) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            {/* 1) 날짜 및 시간 (작성 시간 기준 실시간 표시) */}
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>작성 일시 (실시간 기준)</span>
              </label>
              <div className="font-mono font-bold text-stone-800 text-xs bg-white px-2.5 py-1.5 rounded-xl border border-stone-200">
                {currentTimeStr || '시간 로딩 중...'}
              </div>
            </div>

            {/* 2) 작성자 아이디 / 이름 */}
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block flex items-center gap-1">
                <User className="w-3 h-3 text-amber-700" />
                <span>작성자 (로그인 아이디)</span>
              </label>
              <div className="font-bold text-stone-800 text-xs bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 truncate">
                {currentAdmin ? `${currentAdmin.name} (${currentAdmin.username})` : '관리자'}
              </div>
            </div>

            {/* 3) 점포명 목록화 (픽업매장관리 점포 목록) */}
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block flex items-center gap-1">
                <Store className="w-3 h-3 text-amber-700" />
                <span>대상 점포명</span>
              </label>
              <select
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  const matched = stores.find((s) => s.name === e.target.value);
                  setStoreId(matched ? matched.id : '');
                }}
                className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="전체 점포 공통">🏢 전체 점포 공통</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.name}>
                    🏬 {s.name} ({s.branch_name || '매장'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 전달 내역 본문 */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              전달 내역 상세
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="매니저 간 인수인계 사항, 당일 재고 변동, 기기 점검 요청, 손님 전달사항 등을 상세히 작성해주세요."
              className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs text-stone-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 사진 추가 영역: 바로 촬영(카메라) & 파일로 올리기 2가지 옵션 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>현장 사진 추가 ({photoUrls.length}장 첨부됨)</span>
              </label>
              <div className="flex items-center gap-1.5">
                {/* 1) 스마트폰/태블릿 카메라 바로 촬영용 input */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold text-[11px] flex items-center gap-1 border border-amber-300 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-800" />
                  <span>{uploadingPhoto ? '업로드 중...' : '📷 바로 촬영'}</span>
                </button>

                {/* 2) 사진 파일 선택용 input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-[11px] flex items-center gap-1 border border-stone-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-600" />
                  <span>📁 사진 파일 올리기</span>
                </button>
              </div>
            </div>

            {/* 첨부된 사진 미리보기 썸네일 그리드 */}
            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-stone-300 bg-white shadow-2xs">
                    <img src={url} alt={`첨부 ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
                      title="사진 제거"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 작성 폼 버튼 */}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold hover:bg-stone-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:bg-stone-300"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? '등록 중...' : '전달사항 등록 완료'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. 점포별 필터 탭 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedStoreFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedStoreFilter === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          전체 전달사항 ({notices.length})
        </button>
        <button
          onClick={() => setSelectedStoreFilter('전체 점포 공통')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedStoreFilter === '전체 점포 공통'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          🏢 공통 공지
        </button>
        {stores.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStoreFilter(s.name)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedStoreFilter === s.name
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            🏬 {s.name}
          </button>
        ))}
      </div>

      {/* 4. 전달사항 목록 리스트 */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-stone-500 border border-stone-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs">전달사항을 불러오는 중입니다...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-stone-400 border border-stone-200">
          <MessageSquare className="w-8 h-8 mx-auto text-stone-300 mb-2" />
          <p className="text-sm font-semibold text-stone-600">등록된 전달사항이 없습니다.</p>
          <p className="text-xs text-stone-400 mt-1">상단 [새 전달사항 작성] 버튼으로 점포 특이사항을 남겨보세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const readList = notice.read_by || [];
            const isReadByMe = currentAdmin
              ? readList.some((r) => r.admin_id === currentAdmin.username)
              : false;

            return (
              <div
                key={notice.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs space-y-3 transition-all ${
                  notice.is_important
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-300/40'
                    : 'border-stone-200'
                }`}
              >
                {/* 상단 메타 헤더: 점포명, 중요공지, 작성시간, 작성자, 삭제 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 점포명 뱃지 */}
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-black text-xs border border-amber-300">
                      🏬 {notice.store_name}
                    </span>

                    {/* 중요 공지 뱃지 */}
                    {notice.is_important && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-2xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>긴급 중요</span>
                      </span>
                    )}

                    {/* 작성자 */}
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>{notice.author_name || notice.author_id}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({notice.author_id})</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    {/* 작성 일시 */}
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(notice.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="전달사항 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 전달 내역 본문 */}
                <div className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line bg-stone-50/60 p-3.5 rounded-xl border border-stone-200/60">
                  {notice.content}
                </div>

                {/* 첨부 사진 갤러리 */}
                {notice.photo_urls && notice.photo_urls.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-amber-700" />
                      <span>첨부 사진 ({notice.photo_urls.length}장)</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {notice.photo_urls.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setPreviewImageUrl(photoUrl)}
                          className="relative aspect-video rounded-xl overflow-hidden border border-stone-200 cursor-pointer group bg-stone-100 shadow-2xs hover:border-amber-400 transition-colors"
                        >
                          <img
                            src={photoUrl}
                            alt={`전달 사진 ${pIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye className="w-3 h-3" />
                            <span>크게 보기</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. 핵심 요구사항: 읽은 사람 Flag (확인 처리 및 열람 목록) */}
                <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {/* 열람한 관리자 목록 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-stone-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>읽은 사람 ({readList.length}명 확인):</span>
                    </span>
                    {readList.length === 0 ? (
                      <span className="text-stone-400 text-[11px]">아직 확인한 사람이 없습니다.</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        {readList.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200"
                            title={`확인 시각: ${new Date(r.read_at).toLocaleString('ko-KR')}`}
                          >
                            <span>✓ {r.name || r.admin_id}</span>
                            <span className="text-[9px] text-emerald-600">
                              ({new Date(r.read_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 미확인 시 내가 확인했음을 표시하는 버튼 */}
                  <div>
                    {!isReadByMe ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notice.id)}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>내용 확인했습니다 (읽음 처리)</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50">
                        <Check className="w-3 h-3" />
                        <span>확인 완료</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 사진 크게 보기 팝업 모달 */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImageUrl}
              alt="확대 사진"
              className="w-full max-h-[80vh] object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
