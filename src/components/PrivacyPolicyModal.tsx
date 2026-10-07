'use client';

import React from 'react';
import { X, ShieldCheck, Scale, FileText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[88vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">개인정보처리방침 (법률 고지)</h3>
              <p className="text-[10px] text-stone-500">개인정보보호법 제30조에 따른 규정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 약관 내용 */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-4 text-xs text-stone-700 leading-relaxed pr-1">
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-amber-950 font-medium">
            은달 카페(이하 &apos;카페&apos; 또는 &apos;회사&apos;)는 「개인정보 보호법」 제30조 및 관계 법령을 준수하며, 정보주체의 개인정보 및 권익을 보호하고 개인정보와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제1조 (개인정보의 처리 목적)</h4>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              카페는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-4 text-stone-600 text-[11px] space-y-1">
              <li><strong>주문 및 단체 견적 처리:</strong> 식음료 주문 접수, 단체 맞춤 세트 제조 및 포장, 배달 및 매장 픽업 서비스 제공, 견적서 발송</li>
              <li><strong>고객 안내 및 상담:</strong> 주문 상태 확인, 배달 거리/위치 안내, 지연·품절 안내 및 관련 SMS/MMS 발송, 고객 문의 대응</li>
              <li><strong>서비스 개선 및 안전 관리:</strong> 접속 빈도 파악, 이상 거래 방지 및 서비스 품질 향상</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제2조 (처리하는 개인정보의 항목)</h4>
            <p className="text-stone-600 text-[11px]">
              카페는 주문 및 견적 접수를 위해 다음의 최소한의 개인정보 항목을 수집·처리하고 있습니다.
            </p>
            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] space-y-1">
              <p>• <strong>필수 항목:</strong> 고객 성명, 휴대전화번호, 희망 수령일시, 배달 주소(배달 주문 시 상세주소 포함), 픽업 매장(픽업 주문 시)</p>
              <p>• <strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 IP 주소, 단말기 OS/브라우저 정보, GPS 위치 좌표(사용자가 기기 권한을 허용한 경우에 한함)</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제3조 (개인정보의 처리 및 보유 기간)</h4>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              ① 카페는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br />
              ② 단체 주문 및 견적 접수 정보의 보유 기간은 원칙적으로 다음과 같습니다:
            </p>
            <div className="p-2.5 bg-stone-100/80 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-800">
              • <strong className="text-amber-900 font-bold">배달 완료 또는 주문 완료일로부터 14일</strong> (사후 배달 오류 방지 및 CS 처리 완료 후 지체 없이 데이터베이스에서 안전하게 영구 파기)
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제4조 (개인정보의 제3자 제공 및 처리 위탁)</h4>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              ① 카페는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의 또는 법률의 특별한 규정 등에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.<br />
              ② 원활한 배달 및 시스템 운영을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
            </p>
            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] space-y-1 text-stone-600">
              <p>• <strong>배달 대행 업체:</strong> 배달 기사 (주문 상품의 배송 목적 / 성명, 연락처, 배달주소 / 배송 완료 시까지)</p>
              <p>• <strong>호스팅 및 클라우드 데이터 관리:</strong> Supabase, Vercel (시스템 데이터 보관 및 안전 호스팅)</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제5조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h4>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              정보주체는 카페에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있으며, 고객센터 유선 연락 또는 관리자 문의를 통해 즉시 조치받으실 수 있습니다.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제6조 (개인정보의 파기절차 및 방법)</h4>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              카페는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태는 기록을 재생할 수 없도록 기술적 방법을 사용하여 영구 삭제합니다.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제7조 (개인정보의 안전성 확보조치)</h4>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              카페는 개인정보의 안전성 확보를 위해 데이터 암호화 통신(SSL/TLS), 관리자 인증 접근 통제, 최소 권한 부여 등의 기술적·관리적 보호 조치를 강구하고 있습니다.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">제8조 (개인정보 보호책임자 및 권익침해 구제방법)</h4>
            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] space-y-1 text-stone-700">
              <p>• <strong>개인정보 보호책임자:</strong> 은달 카페 대표</p>
              <p>• <strong>문의 및 고객센터:</strong> 02-1234-5678 (운영시간: 09:00 ~ 21:00)</p>
              <p>• <strong>개인정보침해 신고센터:</strong> (국번없이) 118 (privacy.kisa.or.kr)</p>
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="pt-3 border-t border-stone-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors shadow-sm"
          >
            내용 확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
