'use client';

import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">개인정보 수집 및 이용 동의 (필수)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 약관 내용 */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-stone-700 leading-relaxed">
          <p className="font-medium text-stone-800">
            은달 카페(이하 &apos;매장&apos;)는 고객님의 소중한 개인정보를 안전하게 보호하며, 「개인정보 보호법」 제15조에 따라 아래와 같이 개인정보를 수집 및 이용합니다.
          </p>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-stone-900">1. 수집 및 이용 목적</h4>
            <p className="text-stone-600">
              - 식음료 주문 접수, 제조 및 포장, 배달 서비스 제공<br />
              - 주문 확인, 배달 진행 상황 안내 및 배달 위치 확인<br />
              - 배달 지연, 품절 등 주문 관련 긴급 안내 및 고객 상담 처리
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-stone-900">2. 수집하는 개인정보 항목</h4>
            <p className="text-stone-600">
              - 필수 항목: 주문자 성명, 휴대전화번호, 배달지 주소(상세주소 포함), 배달 희망 일시
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-stone-900">3. 개인정보 보유 및 이용 기간</h4>
            <p className="text-stone-600">
              - 주문 및 배달 완료 후 원칙적으로 목적 달성 시까지 보유하며, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관계 법령에 따라 5년간 안전하게 보존 후 파기합니다.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-stone-900">4. 동의 거부 권리 및 불이익 고지</h4>
            <p className="text-stone-600">
              - 귀하는 상기 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 단, 본 항목은 배달 주문 처리를 위한 필수 최소 항목이므로 동의를 거부하실 경우 배달 주문 서비스 이용이 제한될 수 있습니다.
            </p>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="pt-3 border-t border-stone-200">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
          >
            내용 확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
