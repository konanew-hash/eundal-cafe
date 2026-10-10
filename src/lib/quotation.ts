import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Order, CafeInfo, OrderItem } from './types';

// 숫자를 한글 금액 표기로 변환 (예: 2585000 -> "이백오십팔만오천")
export function numberToKoreanCurrency(num: number): string {
  if (!num || num === 0) return '영';
  const units = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const smallUnits = ['', '십', '백', '천'];
  const bigUnits = ['', '만', '억', '조'];
  let result = '';
  let bigIdx = 0;
  let n = Math.floor(Math.abs(num));

  while (n > 0) {
    const chunk = n % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      let temp = chunk;
      for (let i = 0; i < 4; i++) {
        const digit = temp % 10;
        if (digit > 0) {
          const digitWord = (i > 0 && digit === 1) ? '' : units[digit];
          chunkStr = digitWord + smallUnits[i] + chunkStr;
        }
        temp = Math.floor(temp / 10);
      }
      result = chunkStr + bigUnits[bigIdx] + result;
    }
    bigIdx++;
    n = Math.floor(n / 10000);
  }

  return result || '영';
}

export interface QuotationRow {
  name: string; // 품명
  spec: string; // 규격
  qty: number; // 수량
  unitPrice: number; // 단가 (공급단가)
  supplyAmount: number; // 공급가액
  taxAmount: number; // 세액 (10%)
  remark: string; // 비고
}

// 주문 내역을 공급가액과 세액(VAT 10%)으로 정밀 분리 계산
export function calculateQuotationDetails(order: Order) {
  const rows: QuotationRow[] = [];

  // 1. 주문 상품 품목들
  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      const subtotal = item.subtotal;
      const qty = item.quantity || 1;
      const supply = Math.round(subtotal / 1.1);
      const tax = subtotal - supply;
      const unitPrice = Math.round(supply / qty);

      let remark = '';
      if (item.set_details) {
        const comps = item.set_details.components?.map((c) => `${c.menu_name} x${c.quantity}`).join(', ');
        remark = comps ? `세트: ${comps}` : '맞춤세트';
      }

      rows.push({
        name: item.menu_name,
        spec: item.set_details ? '세트' : '1',
        qty,
        unitPrice,
        supplyAmount: supply,
        taxAmount: tax,
        remark,
      });
    });
  }

  // 2. 포장용기 / 선물 박스
  if (order.packaging_box && order.packaging_box.price > 0) {
    const subtotal = order.packaging_box.price;
    const qty = 1;
    const supply = Math.round(subtotal / 1.1);
    const tax = subtotal - supply;
    rows.push({
      name: `포장: ${order.packaging_box.name}`,
      spec: '박스',
      qty,
      unitPrice: supply,
      supplyAmount: supply,
      taxAmount: tax,
      remark: '선물/단체 포장용기',
    });
  }

  // 3. 포장 옵션 (캔시머, 리본 등)
  if (order.packaging_options && order.packaging_options.length > 0) {
    order.packaging_options.forEach((opt) => {
      if (opt.price > 0) {
        const supply = Math.round(opt.price / 1.1);
        const tax = opt.price - supply;
        rows.push({
          name: `옵션: ${opt.name}`,
          spec: '1',
          qty: 1,
          unitPrice: supply,
          supplyAmount: supply,
          taxAmount: tax,
          remark: '선택 옵션',
        });
      }
    });
  }

  // 4. 배송비
  if (order.order_type === 'delivery' && order.delivery_fee > 0) {
    const subtotal = order.delivery_fee;
    const supply = Math.round(subtotal / 1.1);
    const tax = subtotal - supply;
    rows.push({
      name: '배송비',
      spec: '1',
      qty: 1,
      unitPrice: supply,
      supplyAmount: supply,
      taxAmount: tax,
      remark: order.selected_distance_label || '배달 운임',
    });
  }

  const totalSupply = rows.reduce((sum, r) => sum + r.supplyAmount, 0);
  const totalTax = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const totalUnitPrice = rows.reduce((sum, r) => sum + r.unitPrice, 0);
  const grandTotal = totalSupply + totalTax;
  const koreanTotal = numberToKoreanCurrency(grandTotal);

  return {
    rows,
    totalSupply,
    totalTax,
    totalUnitPrice,
    grandTotal,
    koreanTotal,
  };
}

// 엑셀(.xlsx) 파일 생성 및 다운로드 (SheetJS 기반 정통 견적서 양식)
export function exportQuotationToExcel(order: Order, cafe?: CafeInfo | null, fileNamePrefix = '견적서') {
  const { rows, totalSupply, totalTax, totalUnitPrice, grandTotal, koreanTotal } = calculateQuotationDetails(order);

  // 공급자 정보 (관리자 설정값 연동)
  const supplierNum = cafe?.business_number || '569-06-01382';
  const supplierTitle = cafe?.name || '은달 카페';
  const supplierOwner = cafe?.owner_name || '김은달';
  const supplierAddr = cafe?.address || '경기도 수원시 장안구 조원로 16';
  const supplierType = cafe?.business_type || '음식점업';
  const supplierItem = cafe?.business_item || '커피, 디저트, 샌드위치';
  const supplierPhone = cafe?.phone || '010-9986-2418';

  const orderDate = order.created_at ? new Date(order.created_at) : new Date();
  const dateStr = `${orderDate.getFullYear()}년 ${orderDate.getMonth() + 1}월 ${orderDate.getDate()}일`;

  // 워크시트 2차원 배열 데이터 구성
  const sheetData: any[][] = [
    [`NO. ${order.order_number}`, '', '', '', '', '', ''],
    ['', '', '견    적    서', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    [`${dateStr}`, '', '', '공', '등록번호', supplierNum, ''],
    [`${order.customer_name}  귀하`, '', '', '급', '상  호', supplierTitle, `성 명: ${supplierOwner} (인)`],
    ['', '', '', '자', '사업장주소', supplierAddr, ''],
    ['아래와같이 견적합니다.', '', '', '', '업  태', supplierType, `종 목: ${supplierItem}`],
    ['', '', '', '', '전화번호', supplierPhone, ''],
    ['', '', '', '', '', '', ''],
    ['합계금액 (공급가액+세액)', '', `일금 ${koreanTotal} 원整 ( ₩${grandTotal.toLocaleString()} )`, '', '', '', ''],
    ['품  명', '규  격', '수  량', '단  가', '공급가액', '세  액', '비  고'],
  ];

  // 데이터 행 추가
  rows.forEach((r) => {
    sheetData.push([
      r.name,
      r.spec,
      r.qty,
      r.unitPrice,
      r.supplyAmount,
      r.taxAmount,
      r.remark,
    ]);
  });

  // 빈 줄 추가 (기본 12줄 규격 맞춤)
  const emptyRowCount = Math.max(0, 10 - rows.length);
  for (let i = 0; i < emptyRowCount; i++) {
    sheetData.push(['', '', '', '', '', '', '']);
  }

  // 합계금액 행 추가
  sheetData.push([
    '합계금액',
    '',
    '',
    totalUnitPrice,
    totalSupply,
    totalTax,
    `총액: ₩${grandTotal.toLocaleString()}`,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 열 너비 지정
  ws['!cols'] = [
    { wch: 24 }, // 품명
    { wch: 8 },  // 규격
    { wch: 8 },  // 수량
    { wch: 14 }, // 단가
    { wch: 16 }, // 공급가액
    { wch: 14 }, // 세액
    { wch: 22 }, // 비고
  ];

  // 셀 병합(Merges) 정의
  ws['!merges'] = [
    // 제목: 행 1 (0-indexed) 열 2~4
    { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },
    // 날짜: 행 3 열 0~2
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    // 등록번호 값: 행 3 열 5~6
    { s: { r: 3, c: 5 }, e: { r: 3, c: 6 } },
    // 고객명 귀하: 행 4 열 0~2
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    // 공급자 주소 값: 행 5 열 5~6
    { s: { r: 5, c: 5 }, e: { r: 5, c: 6 } },
    // 전화번호 값: 행 7 열 5~6
    { s: { r: 7, c: 5 }, e: { r: 7, c: 6 } },
    // 공급자 세로 헤더 '공급자': 행 3~7 열 3
    { s: { r: 3, c: 3 }, e: { r: 7, c: 3 } },
    // 아래와같이 견적합니다: 행 6 열 0~2
    { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },
    // 합계금액 레이블: 행 9 열 0~1
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
    // 합계금액 한글/숫자: 행 9 열 2~6
    { s: { r: 9, c: 2 }, e: { r: 9, c: 6 } },
    // 하단 합계금액 레이블: 마지막 행 열 0~2
    { s: { r: sheetData.length - 1, c: 0 }, e: { r: sheetData.length - 1, c: 2 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '견적서');

  const safeFileName = `${fileNamePrefix}_${order.order_number || '주문'}.xlsx`;
  XLSX.writeFile(wb, safeFileName);
}

// PDF 다운로드 (DOM 엘리먼트를 고해상도 A4 PDF로 변환)
export async function downloadQuotationPdf(element: HTMLElement, fileName: string) {
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(fileName);
}
