import * as XLSX from 'xlsx';
import { Order } from './types';

export function exportOrdersToExcel(orders: Order[], fileNamePrefix = '은달카페_주문내역') {
  const statusMap: Record<string, string> = {
    pending: '견적대기',
    confirmed: '견적확정',
    accepted: '견적확정',
    brewing: '견적확정',
    delivering: '견적확정',
    completed: '거래완료',
    cancelled: '취소',
  };

  const rows = orders.map((order, idx) => {
    const itemsSummary = order.items
      ? order.items.map((it) => `${it.menu_name} x ${it.quantity}`).join(', ')
      : '';

    return {
      'No.': idx + 1,
      '주문번호': order.order_number,
      '접수일시': new Date(order.created_at).toLocaleString('ko-KR'),
      '견적상태': statusMap[order.status] || order.status,
      '고객성함': order.customer_name,
      '연락처': order.customer_phone,
      '배달예정일': order.delivery_date,
      '배달시간 (24h)': order.delivery_time,
      '배달지 주소': order.delivery_address,
      '상세 주소': order.delivery_address_detail || '',
      '배달거리 구간': order.selected_distance_label,
      '주문 품목': itemsSummary,
      '상품 합계(원)': order.items_total,
      '배달비(원)': order.delivery_fee,
      '총 결제금액(원)': order.total_amount,
      '요청사항': order.order_memo || '',
      '접속 위치': order.client_location || '-',
      '접속 IP': order.client_ip || '-',
      '개인정보 수집동의': order.privacy_agreed ? '동의완료' : '미동의',
      '동의일시': order.privacy_agreed_at ? new Date(order.privacy_agreed_at).toLocaleString('ko-KR') : '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 열 너비 자동 설정
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // 주문번호
    { wch: 20 }, // 접수일시
    { wch: 12 }, // 주문상태
    { wch: 12 }, // 고객성함
    { wch: 16 }, // 연락처
    { wch: 14 }, // 배달예정일
    { wch: 14 }, // 배달시간
    { wch: 30 }, // 배달지 주소
    { wch: 20 }, // 상세 주소
    { wch: 18 }, // 배달거리 구간
    { wch: 35 }, // 주문 품목
    { wch: 14 }, // 상품 합계
    { wch: 12 }, // 배달비
    { wch: 15 }, // 총 결제금액
    { wch: 25 }, // 요청사항
    { wch: 14 }, // 개인정보 수집동의
    { wch: 20 }, // 동의일시
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '주문목록');

  const today = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${today}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}
