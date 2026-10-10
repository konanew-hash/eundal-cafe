'use client';

import React, { useRef, useState } from 'react';
import { X, FileDown, FileSpreadsheet, Printer, Loader2, Check } from 'lucide-react';
import { Order, CafeInfo } from '@/lib/types';
import { QuotationDocument } from './QuotationDocument';
import { exportQuotationToExcel, downloadQuotationPdf } from '@/lib/quotation';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  cafe?: CafeInfo | null;
}

export default function QuotationModal({
  isOpen,
  onClose,
  order,
  cafe,
}: QuotationModalProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);

  if (!isOpen || !order) return null;

  // 1. PDF 다운로드
  const handleDownloadPdf = async () => {
    if (!docRef.current) return;
    try {
      setDownloadingPdf(true);
      const fileName = `은달카페_견적서_${order.order_number || '주문'}.pdf`;
      await downloadQuotationPdf(docRef.current, fileName);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF 생성 중 오류가 발생했습니다. 브라우저 인쇄를 이용해 PDF 저장을 진행하실 수도 있습니다.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 2. 엑셀 다운로드
  const handleDownloadExcel = () => {
    try {
      setDownloadingExcel(true);
      exportQuotationToExcel(order, cafe, '은달카페_견적서');
      setExcelSuccess(true);
      setTimeout(() => setExcelSuccess(false), 3000);
    } catch (err) {
      console.error('Excel generation error:', err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  // 3. 브라우저 인쇄
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      {/* 화면 전체 감싸는 모달 컨테이너 */}
      <div className="w-full max-w-4xl bg-stone-100 rounded-3xl shadow-2xl border border-stone-300 max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full">
        {/* 상단 툴바 (인쇄 시 숨김) */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-400">📄 공식 견적서</span>
            <span className="text-xs text-stone-300 font-mono font-medium hidden sm:inline">
              ({order.order_number})
            </span>
          </div>

          {/* 다운로드 및 출력 액션 버튼 모음 */}
          <div className="flex items-center gap-2">
            {/* PDF 다운로드 버튼 */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              title="A4 표준 서식의 PDF 파일로 다운로드합니다"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-900" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{downloadingPdf ? 'PDF 생성 중...' : pdfSuccess ? '다운로드 완료!' : 'PDF 다운로드'}</span>
            </button>

            {/* 엑셀(XLSX) 다운로드 버튼 */}
            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              title="편집 가능한 정통 엑셀(.xlsx) 파일로 다운로드합니다"
            >
              {downloadingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : excelSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              <span>{downloadingExcel ? '엑셀 생성 중...' : excelSuccess ? '저장 완료!' : '엑셀(XLSX)'}</span>
            </button>

            {/* 인쇄 버튼 */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs transition-colors"
              title="브라우저 인쇄 또는 PDF로 저장합니다"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">인쇄</span>
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 문서 미리보기 영역 (가로/세로 스크롤 가능) */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-stone-200/80 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
          <div className="shadow-lg rounded-md overflow-hidden bg-white print:shadow-none print:rounded-none">
            <QuotationDocument ref={docRef} order={order} cafe={cafe} />
          </div>
        </div>
      </div>
    </div>
  );
}
