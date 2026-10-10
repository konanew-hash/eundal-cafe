'use client';

import React, { forwardRef } from 'react';
import { Order, CafeInfo } from '@/lib/types';
import { calculateQuotationDetails } from '@/lib/quotation';

interface QuotationDocumentProps {
  order: Order;
  cafe?: CafeInfo | null;
}

export const QuotationDocument = forwardRef<HTMLDivElement, QuotationDocumentProps>(
  ({ order, cafe }, ref) => {
    const { rows, totalSupply, totalTax, totalUnitPrice, grandTotal, koreanTotal } =
      calculateQuotationDetails(order);

    const orderDate = order.created_at ? new Date(order.created_at) : new Date();
    const dateStr = `${orderDate.getFullYear()}년 ${orderDate.getMonth() + 1}월 ${orderDate.getDate()}일`;

    // 공급자 정보 (관리자 설정값 연동)
    const supplierNum = cafe?.business_number || '569-06-01382';
    const supplierTitle = cafe?.name || '은달 카페';
    const supplierOwner = cafe?.owner_name || '김은달';
    const supplierAddr = cafe?.address || '경기도 수원시 장안구 조원로 16';
    const supplierType = cafe?.business_type || '음식점업';
    const supplierItem = cafe?.business_item || '커피, 디저트, 샌드위치';
    const supplierPhone = cafe?.phone || '010-9986-2418';
    const sealUrl = cafe?.seal_image_url;

    // 테이블 빈 줄 채우기 (기본 최소 9줄 유지)
    const minRows = 9;
    const emptyRowsCount = Math.max(0, minRows - rows.length);

    return (
      <div
        ref={ref}
        id="quotation-print-area"
        className="w-[794px] min-h-[1123px] bg-white text-stone-900 p-10 font-sans mx-auto shadow-none print:shadow-none print:p-8 print:m-0 print:w-full print:min-h-0 select-text"
        style={{ boxSizing: 'border-box' }}
      >
        {/* 상단: 문서번호 & 견적서 메인 타이틀 */}
        <div className="relative mb-6">
          <div className="text-[11px] font-mono text-stone-500 font-semibold">
            NO. {order.order_number}
          </div>
          <div className="text-center mt-1">
            <h1 className="text-3xl font-black tracking-[0.5em] text-stone-900 inline-block pb-1 border-b-4 border-double border-stone-900">
              견&nbsp;&nbsp;적&nbsp;&nbsp;서
            </h1>
          </div>
        </div>

        {/* 상단 2열: (좌) 일자 및 수신처 / (우) 공급자 테이블 */}
        <div className="grid grid-cols-12 gap-3 mb-4 items-stretch">
          {/* 좌측: 일자 및 고객 정보 (5칸) */}
          <div className="col-span-5 flex flex-col justify-between py-1 pr-2">
            <div className="space-y-4">
              <div className="text-sm font-bold text-stone-700 tracking-wider">
                {dateStr}
              </div>

              <div className="border-b-2 border-stone-800 pb-1.5">
                <div className="text-xl font-black text-stone-950 tracking-tight flex items-baseline justify-between">
                  <span>{order.customer_name || '고객'}</span>
                  <span className="text-base font-bold text-stone-700 ml-2">귀하</span>
                </div>
              </div>

              <div className="text-xs text-stone-600 font-medium">
                {order.customer_phone && (
                  <div>연락처: {order.customer_phone}</div>
                )}
                {order.order_type === 'delivery' ? (
                  <div className="truncate">배달지: {order.delivery_address}</div>
                ) : (
                  <div>수령: 매장 픽업 ({order.pickup_store_name || '은달 매장'})</div>
                )}
              </div>
            </div>

            <div className="text-xs font-bold text-stone-800 tracking-wider pt-3">
              아래와 같이 견적합니다.
            </div>
          </div>

          {/* 우측: 공급자 정보 테이블 (7칸) */}
          <div className="col-span-7 border border-stone-900 text-[11px]">
            <table className="w-full h-full border-collapse">
              <tbody>
                <tr className="border-b border-stone-400">
                  <td
                    rowSpan={5}
                    className="w-7 text-center font-bold bg-stone-100 border-r border-stone-900 py-2 leading-tight text-stone-800 tracking-widest text-[11px]"
                  >
                    공<br /><br />급<br /><br />자
                  </td>
                  <td className="w-16 font-bold bg-stone-50 border-r border-stone-400 px-2 py-1.5 text-center text-stone-700">
                    등록번호
                  </td>
                  <td
                    colSpan={3}
                    className="px-2.5 py-1.5 font-bold font-mono tracking-wider text-stone-950 text-xs"
                  >
                    {supplierNum}
                  </td>
                </tr>

                <tr className="border-b border-stone-400">
                  <td className="font-bold bg-stone-50 border-r border-stone-400 px-2 py-1.5 text-center text-stone-700">
                    상&nbsp;&nbsp;&nbsp;&nbsp;호
                  </td>
                  <td className="px-2.5 py-1.5 font-bold text-stone-900 border-r border-stone-400">
                    {supplierTitle}
                  </td>
                  <td className="w-14 font-bold bg-stone-50 border-r border-stone-400 px-1.5 py-1.5 text-center text-stone-700">
                    성&nbsp;&nbsp;명
                  </td>
                  <td className="px-2 py-1.5 text-stone-900 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{supplierOwner}</span>
                      {sealUrl ? (
                        <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                          <img
                            src={sealUrl}
                            alt="직인"
                            className="w-9 h-9 object-contain"
                          />
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-red-600 text-red-600 text-[10px] font-black tracking-tighter leading-none shrink-0 shadow-2xs">
                          인
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-stone-400">
                  <td className="font-bold bg-stone-50 border-r border-stone-400 px-2 py-1.5 text-center text-stone-700 leading-tight">
                    사업장<br />주&nbsp;&nbsp;&nbsp;&nbsp;소
                  </td>
                  <td colSpan={3} className="px-2.5 py-1.5 text-stone-900 leading-tight">
                    {supplierAddr}
                  </td>
                </tr>

                <tr className="border-b border-stone-400">
                  <td className="font-bold bg-stone-50 border-r border-stone-400 px-2 py-1.5 text-center text-stone-700">
                    업&nbsp;&nbsp;&nbsp;&nbsp;태
                  </td>
                  <td className="px-2.5 py-1.5 text-stone-900 border-r border-stone-400">
                    {supplierType}
                  </td>
                  <td className="font-bold bg-stone-50 border-r border-stone-400 px-1.5 py-1.5 text-center text-stone-700">
                    종&nbsp;&nbsp;목
                  </td>
                  <td className="px-2 py-1.5 text-stone-900">
                    {supplierItem}
                  </td>
                </tr>

                <tr>
                  <td className="font-bold bg-stone-50 border-r border-stone-400 px-2 py-1.5 text-center text-stone-700">
                    전화번호
                  </td>
                  <td colSpan={3} className="px-2.5 py-1.5 font-mono text-stone-900">
                    {supplierPhone}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 합계금액 (공급가액 + 세액) 강조 띠 */}
        <div className="border-2 border-stone-900 mb-3 flex items-center bg-stone-50/70">
          <div className="w-48 py-2 px-3 bg-stone-100 border-r-2 border-stone-900 font-bold text-xs text-stone-800 text-center tracking-wider">
            합계금액 (공급가액+세액)
          </div>
          <div className="flex-1 py-2 px-4 flex items-baseline justify-between">
            <span className="text-sm font-black text-stone-950 tracking-wider">
              일금&nbsp;&nbsp;{koreanTotal}&nbsp;&nbsp;원整
            </span>
            <span className="text-sm font-black font-mono text-stone-900 tracking-tight">
              (&nbsp;₩{grandTotal.toLocaleString()}&nbsp;)
            </span>
          </div>
        </div>

        {/* 본문 품목 명세서 테이블 */}
        <div className="border border-stone-900 text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-900 font-bold text-stone-800 text-center text-[11px]">
                <th className="py-2 px-2 border-r border-stone-400 w-auto">품&nbsp;&nbsp;명</th>
                <th className="py-2 px-1 border-r border-stone-400 w-12">규&nbsp;&nbsp;격</th>
                <th className="py-2 px-1 border-r border-stone-400 w-12">수&nbsp;&nbsp;량</th>
                <th className="py-2 px-2 border-r border-stone-400 w-20">단&nbsp;&nbsp;가</th>
                <th className="py-2 px-2 border-r border-stone-400 w-24">공급가액</th>
                <th className="py-2 px-2 border-r border-stone-400 w-20">세&nbsp;&nbsp;액</th>
                <th className="py-2 px-2 w-32">비&nbsp;&nbsp;고</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-stone-300 text-[11px] hover:bg-stone-50/50"
                >
                  <td className="py-1.5 px-2.5 border-r border-stone-300 font-semibold text-stone-900 text-left">
                    {row.name}
                  </td>
                  <td className="py-1.5 px-1 border-r border-stone-300 text-center text-stone-600">
                    {row.spec}
                  </td>
                  <td className="py-1.5 px-1 border-r border-stone-300 text-center font-mono font-bold text-stone-900">
                    {row.qty}
                  </td>
                  <td className="py-1.5 px-2 border-r border-stone-300 text-right font-mono text-stone-800">
                    {row.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 border-r border-stone-300 text-right font-mono font-semibold text-stone-950">
                    {row.supplyAmount.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 border-r border-stone-300 text-right font-mono text-stone-700">
                    {row.taxAmount.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-left text-[10px] text-stone-600 truncate max-w-[120px]">
                    {row.remark}
                  </td>
                </tr>
              ))}

              {/* 빈 행 패딩 */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-stone-200 text-[11px] h-7">
                  <td className="border-r border-stone-300">&nbsp;</td>
                  <td className="border-r border-stone-300">&nbsp;</td>
                  <td className="border-r border-stone-300">&nbsp;</td>
                  <td className="border-r border-stone-300">&nbsp;</td>
                  <td className="border-r border-stone-300">&nbsp;</td>
                  <td className="border-r border-stone-300">&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}

              {/* 합계행 */}
              <tr className="bg-stone-100 font-bold text-[11px] border-t-2 border-stone-900">
                <td colSpan={3} className="py-2 px-3 border-r border-stone-400 text-center text-stone-900 tracking-wider">
                  합&nbsp;&nbsp;계&nbsp;&nbsp;금&nbsp;&nbsp;액
                </td>
                <td className="py-2 px-2 border-r border-stone-400 text-right font-mono text-stone-800">
                  {totalUnitPrice.toLocaleString()}
                </td>
                <td className="py-2 px-2 border-r border-stone-400 text-right font-mono text-stone-950">
                  {totalSupply.toLocaleString()}
                </td>
                <td className="py-2 px-2 border-r border-stone-400 text-right font-mono text-stone-800">
                  {totalTax.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-right font-mono font-black text-stone-950 text-xs">
                  ₩{grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 하단 특기사항 및 안내 */}
        <div className="mt-4 border border-stone-300 p-3 rounded-lg bg-stone-50/50 text-[11px] text-stone-700 space-y-1">
          <div className="font-bold text-stone-900 flex items-center justify-between">
            <span>[참고사항 및 수령 안내]</span>
            <span className="font-normal text-stone-500">
              희망 수령일시: {order.delivery_date} {order.delivery_time}
            </span>
          </div>
          <div className="text-stone-600 text-[10.5px] leading-relaxed">
            • 본 견적서는 은달 카페 공식 견적서이며, 공급가액과 부가가치세(10%)가 포함되어 있습니다.<br />
            • 수령 장소: {order.order_type === 'pickup' ? `매장 픽업 (${order.pickup_store_name || '은달 매장'})` : `배달 (${order.delivery_address} ${order.delivery_address_detail || ''})`}<br />
            • {cafe?.quote_notice || '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려 주문 확정을 진행합니다.'}
          </div>
        </div>
      </div>
    );
  }
);

QuotationDocument.displayName = 'QuotationDocument';
