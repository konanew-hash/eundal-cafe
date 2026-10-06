'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, ShieldCheck, Lock, User, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      router.push('/admin/orders');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('로그인 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center items-center px-4 py-12 text-white">
      <div className="w-full max-w-sm">
        {/* 뒤로가기 링크 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>고객 주문 홈페이지로 돌아가기</span>
        </Link>

        {/* 브랜드 헤더 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-stone-800 to-amber-700 border border-amber-600/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Moon className="w-7 h-7 fill-amber-300 stroke-amber-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">은달 매장 관리자 모드</h1>
          <p className="text-xs text-stone-400 mt-1">
            메인 관리자 및 매니저 계정으로 로그인해주세요.
          </p>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="bg-stone-800/90 backdrop-blur-md rounded-3xl p-6 border border-stone-700/80 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-900/40 text-red-300 border border-red-700/60 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                관리자 / 매니저 아이디
              </label>
              <input
                type="text"
                required
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-stone-400" />
                비밀번호
              </label>
              <input
                type="password"
                required
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>로그인 확인 중...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>관리자 포털 접속</span>
                </>
              )}
            </button>
          </form>

          {/* 초기 계정 안내 */}
          <div className="mt-5 pt-4 border-t border-stone-700/60 text-[11px] text-stone-400 space-y-1">
            <p className="font-semibold text-stone-300">💡 초기 로그인 안내</p>
            <p>- 메인 관리자: <code className="text-amber-300 font-mono">admin</code> / <code className="text-amber-300 font-mono">eundal2026!</code></p>
            <p>- 매니저 1호: <code className="text-amber-300 font-mono">manager1</code> / <code className="text-amber-300 font-mono">eundal2026!</code></p>
            <p className="text-[10px] text-stone-500 pt-1">* 관리자 모드에서 신규 매니저를 추가 등록할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
