import XLSX from 'xlsx-js-style';
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

// 엑셀(.xlsx) 파일 생성 및 다운로드 (xlsx-js-style 기반 PDF 수준 고급 비즈니스 서식)
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
    [`${dateStr}`, '', '', '공\n\n급\n\n자', '등록번호', supplierNum, ''],
    [`${order.customer_name}  귀하`, '', '', '', '상  호', supplierTitle, `성 명: ${supplierOwner} (인)`],
    ['', '', '', '', '사업장주소', supplierAddr, ''],
    ['아래와 같이 견적합니다.', '', '', '', '업  태', supplierType, `종 목: ${supplierItem}`],
    ['', '', '', '', '전화번호', supplierPhone, ''],
    ['', '', '', '', '', '', ''],
    ['합계금액 (공급가액+세액)', '', `일금 ${koreanTotal} 원整 ( ₩${grandTotal.toLocaleString()} )`, '', '', '', ''],
    ['품  명', '규  격', '수  량', '단  가', '공급가액', '세  액', '비  고'],
  ];

  // 품목 데이터 행 추가
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

  // 빈 줄 추가 (최소 6줄 규격 유지)
  const emptyRowCount = Math.max(0, 6 - rows.length);
  for (let i = 0; i < emptyRowCount; i++) {
    sheetData.push(['', '', '', '', '', '', '']);
  }

  // 합계금액 행
  const totalRowIndex = sheetData.length;
  sheetData.push([
    '합계금액',
    '',
    '',
    totalUnitPrice,
    totalSupply,
    totalTax,
    `₩${grandTotal.toLocaleString()}`,
  ]);

  // 하단 참고사항 행
  sheetData.push(['', '', '', '', '', '', '']);
  sheetData.push([
    `[참고사항] 희망 수령일시: ${order.delivery_date} ${order.delivery_time} / 수령방법: ${order.order_type === 'pickup' ? `매장 픽업 (${order.pickup_store_name || '은달 매장'})` : `배달 (${order.delivery_address} ${order.delivery_address_detail || ''})`}`,
    '', '', '', '', '', '',
  ]);
  sheetData.push([
    `• 본 견적서는 은달 카페 공식 견적서이며, 공급가액과 부가가치세(10%)가 분리 기재되어 있습니다.`,
    '', '', '', '', '', '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 셀 너비 (wch)
  ws['!cols'] = [
    { wch: 26 }, // 품명
    { wch: 9 },  // 규격
    { wch: 9 },  // 수량
    { wch: 15 }, // 단가
    { wch: 16 }, // 공급가액
    { wch: 15 }, // 세액
    { wch: 25 }, // 비고
  ];

  // 행 높이 (hpt)
  const rowHeights: { hpt: number }[] = [];
  rowHeights[0] = { hpt: 20 }; // NO
  rowHeights[1] = { hpt: 38 }; // 견적서 타이틀
  rowHeights[2] = { hpt: 12 }; // 공백
  rowHeights[3] = { hpt: 22 }; // 등록번호
  rowHeights[4] = { hpt: 24 }; // 고객명 / 상호
  rowHeights[5] = { hpt: 22 }; // 주소
  rowHeights[6] = { hpt: 22 }; // 아래와같이 / 업태
  rowHeights[7] = { hpt: 22 }; // 전화번호
  rowHeights[8] = { hpt: 12 }; // 공백
  rowHeights[9] = { hpt: 28 }; // 합계금액 띠
  rowHeights[10] = { hpt: 24 }; // 테이블 헤더

  // 품목 행 높이
  for (let r = 11; r < totalRowIndex; r++) {
    rowHeights[r] = { hpt: 22 };
  }
  rowHeights[totalRowIndex] = { hpt: 26 }; // 합계행
  rowHeights[totalRowIndex + 1] = { hpt: 12 };
  rowHeights[totalRowIndex + 2] = { hpt: 20 };
  rowHeights[totalRowIndex + 3] = { hpt: 20 };
  ws['!rows'] = rowHeights;

  // 셀 병합(Merges) 정의
  ws['!merges'] = [
    // 제목: 행 1 (0-indexed) 열 2~4
    { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },
    // 일자: 행 3 열 0~2
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    // 공급자 세로 헤더 '공급자': 행 3~7 열 3
    { s: { r: 3, c: 3 }, e: { r: 7, c: 3 } },
    // 등록번호 값: 행 3 열 5~6
    { s: { r: 3, c: 5 }, e: { r: 3, c: 6 } },
    // 고객명 귀하: 행 4 열 0~2
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    // 공급자 주소 값: 행 5 열 5~6
    { s: { r: 5, c: 5 }, e: { r: 5, c: 6 } },
    // 아래와 같이 견적합니다: 행 6 열 0~2
    { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },
    // 전화번호 값: 행 7 열 5~6
    { s: { r: 7, c: 5 }, e: { r: 7, c: 6 } },
    // 합계금액 라벨: 행 9 열 0~1
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
    // 합계금액 한글/숫자: 행 9 열 2~6
    { s: { r: 9, c: 2 }, e: { r: 9, c: 6 } },
    // 테이블 하단 합계 라벨: 행 totalRowIndex 열 0~2
    { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 2 } },
    // 참고사항 안내:
    { s: { r: totalRowIndex + 2, c: 0 }, e: { r: totalRowIndex + 2, c: 6 } },
    { s: { r: totalRowIndex + 3, c: 0 }, e: { r: totalRowIndex + 3, c: 6 } },
  ];

  // 스타일 프리셋 정의
  const borderThin = {
    top: { style: 'thin', color: { rgb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
    left: { style: 'thin', color: { rgb: 'D1D5DB' } },
    right: { style: 'thin', color: { rgb: 'D1D5DB' } },
  };

  const borderDarkThin = {
    top: { style: 'thin', color: { rgb: '1F2937' } },
    bottom: { style: 'thin', color: { rgb: '1F2937' } },
    left: { style: 'thin', color: { rgb: '1F2937' } },
    right: { style: 'thin', color: { rgb: '1F2937' } },
  };

  // 모든 셀에 서식 입히기
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:G30');

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }
      const cell = ws[cellRef];

      // 기본 폰트
      const font = { name: '맑은 고딕', sz: 9.5, color: { rgb: '1F2937' } };
      let alignment: any = { vertical: 'center', horizontal: 'left' };
      let fill: any = undefined;
      let border: any = undefined;
      let numFmt: string | undefined = undefined;

      // 0행: 문서번호
      if (R === 0 && C === 0) {
        font.sz = 9;
        (font as any).bold = true;
        (font as any).color = { rgb: '6B7280' };
      }

      // 1행: 메인 타이틀 "견    적    서"
      if (R === 1) {
        font.sz = 18;
        (font as any).bold = true;
        (font as any).color = { rgb: '111827' };
        alignment = { horizontal: 'center', vertical: 'center' };
      }

      // 3~7행 좌측 (일자 / 고객명 귀하 / 아래와 같이 견적합니다)
      if (R >= 3 && R <= 7 && C <= 2) {
        if (R === 3 && C === 0) {
          (font as any).bold = true;
          font.sz = 10;
        } else if (R === 4 && C === 0) {
          (font as any).bold = true;
          font.sz = 14;
          (font as any).color = { rgb: '111827' };
        } else if (R === 6 && C === 0) {
          (font as any).bold = true;
          font.sz = 10;
          (font as any).color = { rgb: '374151' };
        }
      }

      // 3~7행 우측 공급자 테이블
      if (R >= 3 && R <= 7 && C >= 3 && C <= 6) {
        border = borderDarkThin;
        if (C === 3) {
          // 공급자 세로 헤더
          fill = { fgColor: { rgb: 'E5E7EB' } };
          (font as any).bold = true;
          font.sz = 10;
          alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
        } else if (C === 4) {
          // 등록번호, 상호 등 라벨
          fill = { fgColor: { rgb: 'F3F4F6' } };
          (font as any).bold = true;
          font.sz = 9;
          alignment = { horizontal: 'center', vertical: 'center' };
        } else {
          // 공급자 값
          font.sz = 9;
          alignment = { horizontal: 'left', vertical: 'center' };
          if (R === 3) (font as any).bold = true; // 등록번호 강조
        }
      }

      // 9행: 합계금액 띠
      if (R === 9) {
        border = borderDarkThin;
        if (C <= 1) {
          fill = { fgColor: { rgb: '374151' } };
          (font as any).bold = true;
          (font as any).color = { rgb: 'FFFFFF' };
          font.sz = 10;
          alignment = { horizontal: 'center', vertical: 'center' };
        } else {
          fill = { fgColor: { rgb: 'F9FAFB' } };
          (font as any).bold = true;
          (font as any).color = { rgb: '111827' };
          font.sz = 11;
          alignment = { horizontal: 'left', vertical: 'center' };
        }
      }

      // 10행: 품목 테이블 헤더
      if (R === 10) {
        border = borderDarkThin;
        fill = { fgColor: { rgb: 'E5E7EB' } };
        (font as any).bold = true;
        (font as any).color = { rgb: '111827' };
        font.sz = 9.5;
        alignment = { horizontal: 'center', vertical: 'center' };
      }

      // 11행 ~ totalRowIndex - 1: 품목 데이터 및 빈 행
      if (R >= 11 && R < totalRowIndex) {
        border = borderThin;
        if (C === 0) {
          alignment = { horizontal: 'left', vertical: 'center' };
        } else if (C === 1) {
          alignment = { horizontal: 'center', vertical: 'center' };
        } else if (C === 2) {
          alignment = { horizontal: 'center', vertical: 'center' };
          if (typeof cell.v === 'number') numFmt = '#,##0';
        } else if (C >= 3 && C <= 5) {
          alignment = { horizontal: 'right', vertical: 'center' };
          if (typeof cell.v === 'number') numFmt = '#,##0';
        } else {
          alignment = { horizontal: 'left', vertical: 'center' };
          font.sz = 8.5;
          (font as any).color = { rgb: '4B5563' };
        }
      }

      // totalRowIndex: 합계행
      if (R === totalRowIndex) {
        fill = { fgColor: { rgb: 'F3F4F6' } };
        (font as any).bold = true;
        border = {
          top: { style: 'medium', color: { rgb: '111827' } },
          bottom: { style: 'medium', color: { rgb: '111827' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } },
        };
        if (C <= 2) {
          alignment = { horizontal: 'center', vertical: 'center' };
          font.sz = 10;
        } else if (C >= 3 && C <= 5) {
          alignment = { horizontal: 'right', vertical: 'center' };
          if (typeof cell.v === 'number') numFmt = '#,##0';
          font.sz = 10;
        } else {
          alignment = { horizontal: 'right', vertical: 'center' };
          font.sz = 10.5;
          (font as any).color = { rgb: '111827' };
        }
      }

      // 참고사항 행
      if (R >= totalRowIndex + 2) {
        font.sz = 8.5;
        (font as any).color = { rgb: '6B7280' };
        alignment = { horizontal: 'left', vertical: 'center' };
      }

      cell.s = {
        font,
        alignment,
        ...(fill ? { fill } : {}),
        ...(border ? { border } : {}),
        ...(numFmt ? { numFmt } : {}),
      };
    }
  }

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
