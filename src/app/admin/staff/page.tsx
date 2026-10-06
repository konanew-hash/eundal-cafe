'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Phone,
  Bell,
  MessageSquare,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { Staff } from '@/lib/types';

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // 폼 상태
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'manager' as 'super_admin' | 'manager',
    phone: '',
    notify_sms: true,
    notify_push: true,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStaffList = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.staffList) {
        setStaffList(data.staffList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffList();
  }, []);

  const openCreateModal = () => {
    setEditingStaff(null);
    setForm({
      username: '',
      password: '',
      name: '',
      role: 'manager',
      phone: '',
      notify_sms: true,
      notify_push: true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setForm({
      username: staff.username,
      password: '',
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      notify_sms: staff.notify_sms,
      notify_push: staff.notify_push,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      if (editingStaff) {
        // 수정
        const res = await fetch('/api/admin/staff', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingStaff.id,
            name: form.name,
            role: form.role,
            phone: form.phone,
            notify_sms: form.notify_sms,
            notify_push: form.notify_push,
            newPassword: form.password || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '수정 실패');
      } else {
        // 신규 등록
        const res = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '등록 실패');
      }

      setIsModalOpen(false);
      setSuccessMsg(editingStaff ? '계정 정보가 수정되었습니다.' : '신규 계정이 성공적으로 등록되었습니다.');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStaffList();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`[${name}] 계정을 정말 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      loadStaffList();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            <span>관리자 & 매니저 계정 및 알림 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            로그인 가능한 메인 관리자 및 매니저 계정을 추가하고, 주문 발생 시 푸시/문자 알림을 수신할 전화번호를 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 계정 추가 등록</span>
          </button>
          <button
            onClick={loadStaffList}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs border border-stone-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 계정 목록 테이블 */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
            <tr>
              <th className="p-3.5">아이디</th>
              <th className="p-3.5">이름</th>
              <th className="p-3.5">권한 역할</th>
              <th className="p-3.5">등록 연락처 (알림 수신)</th>
              <th className="p-3.5">알림 설정</th>
              <th className="p-3.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-stone-50/50">
                <td className="p-3.5 font-bold font-mono text-stone-900">{staff.username}</td>
                <td className="p-3.5 font-medium">{staff.name}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      staff.role === 'super_admin'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 text-stone-700 border border-stone-300'
                    }`}
                  >
                    {staff.role === 'super_admin' ? '최고 총괄관리자' : '매니저'}
                  </span>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1 font-medium text-stone-800">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{staff.phone}</span>
                  </div>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        staff.notify_sms
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      SMS {staff.notify_sms ? 'ON' : 'OFF'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        staff.notify_push
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      PUSH {staff.notify_push ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </td>
                <td className="p-3.5 text-right space-x-1">
                  <button
                    onClick={() => openEditModal(staff)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                    title="수정"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(staff.id, staff.name)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록 / 수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                {editingStaff ? '계정 정보 수정' : '신규 관리자/매니저 계정 등록'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-xl flex items-center gap-1.5 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-stone-700 font-bold mb-1">아이디 (Username)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingStaff}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="예: manager2"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl disabled:bg-stone-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-stone-500" />
                  {editingStaff ? '새 비밀번호 (미입력 시 유지)' : '비밀번호 (필수)'}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">담당자 이름</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 김매니저"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">권한 역할</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as 'super_admin' | 'manager' })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
                  >
                    <option value="manager">매니저 (Manager)</option>
                    <option value="super_admin">최고 총괄관리자</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  알림 수신 전화번호 (필수)
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-medium"
                />
                <p className="text-[10px] text-stone-500 mt-0.5">
                  신규 주문 접수 시 이 번호로 알림 메시지 발송 트리거가 실행됩니다.
                </p>
              </div>

              {/* 알림 채널 선택 */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                <span className="font-bold text-stone-800 block text-[11px]">주문 발생 시 알림 수신 설정</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify_sms}
                      onChange={(e) => setForm({ ...form, notify_sms: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>문자메시지 (SMS) 알림</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify_push}
                      onChange={(e) => setForm({ ...form, notify_push: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>웹 푸시 / 앱 알림</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold"
                >
                  {saving ? '저장 중...' : '계정 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
