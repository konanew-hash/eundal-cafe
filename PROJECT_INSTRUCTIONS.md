# 은달 카페(Eundal Cafe) 프로젝트 지침 및 인프라 명세

## 1. 프로젝트 개요
- **서비스명**: 은달 카페 주문 & 관리 플랫폼 (Eundal Cafe)
- **목적**: 모바일 반응형 고객 주문 및 견적 웹 + 관리자/매니저 전용 주문·운영 관리 포털
- **프레임워크**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS

## 2. 인프라 식별 정보 (DoRms 연수 규정 준수)
- **GitHub 저장소**: `https://github.com/konanew-hash/eundal-cafe`
- **Supabase Project Name**: `eundal-cafe`
- **Supabase Project Ref**: `fldcouaymmbbiugexvwj`
- **Supabase Region**: `ap-northeast-2` (Seoul)
- **Supabase Project URL**: `https://fldcouaymmbbiugexvwj.supabase.co`
- **Vercel Project ID**: `prj_uG4G32HbST8hM68WRZ00ufmpufLp`
- **Vercel Org ID**: `team_vuXymHPqr1grVbY1EJjUOo9G`
- **Vercel Project Name**: `eundal`

## 3. 핵심 기능 명세
1. **고객 모바일 반응형 웹 (`/`)**:
   - 은달 카페 브랜드 감성 최신 트렌드 모바일 UI
   - 메뉴 탐색 및 실시간 견적 산정 (수량 증감, 실시간 합계, 전체 비우기 초기화)
   - 배달비 정책 실시간 연동 (관리자 설정 기준 실시간 계산 및 무료배달 혜택 안내)
   - 주문자 정보 기입: 성함, 연락처, 배달 장소(기본/상세)
   - **배달 희망 일시**: 24시간제(00~23시) 기준 및 **30분 단위(00분, 30분)** 필수 기입
   - **개인정보보호법상 동의**: 제15조 준수 필수 동의 체크박스 및 전문 보기 모달
   - 주문 완료 및 영수증 확인

2. **관리자 및 매니저 포털 (`/admin`)**:
   - 아이디/패스워드 기반 보안 로그인 (`/admin/login`)
   - 실시간 주문 대시보드 (`/admin/orders`): 접수, 제조, 배달 상태 제어 및 주문 알림음
   - **주문 내역 엑셀 다운로드**: `.xlsx` 형식 내보내기 지원
   - 메뉴 & 카테고리 관리 (`/admin/menus`): 메뉴 CRUD 및 실시간 품절 토글
   - **배달비 책정 메뉴 (`/admin/delivery`)**: 거리 구간별 할증 및 주문금액 기준 조절 -> 고객 화면 즉시 연동
   - 카페 소개 & 비주얼 관리 (`/admin/cafe-info`): 대표 배너 이미지, 로고 아이콘, 소개글 실시간 변경 및 **1호점(조원)·2호점(파장) 영업시간 및 매장 주소 개별 분리 관리**
   - **주변 카페 제품 및 가격 비교 (`/admin/competitors`)**: 은달 1호점, 2호점 인근 5km 로컬 경쟁사(체인점 제외) 네이버 플레이스 메뉴, 가격, 평점(인지도), 댓글수 비교 대시보드, 픽업 매장관리 지도 정보 연동, 저작권 보호 이미지 변조 처리, 상호명 검색 자동 완성 신규 등록 및 일일 단위 예약 업데이트(Cron) 지원
   - **관리자/매니저 계정 관리 (`/admin/staff`)**: 신규 매니저 추가 등록, 비밀번호 관리, **알림 수신 전화번호 등록 및 푸시/문자 알림 연동**

## 4. 보안 및 비밀값 관리
- `.env.local`, `.vercel`, 비밀키는 Git에 일체 커밋하지 않음
- 비밀번호는 bcrypt 단방향 암호화 해시로 저장
- 관리자 인증은 HttpOnly JWT 세션 쿠키로 보호
- 데이터베이스 테이블 전체에 Row Level Security (RLS) 적용 완료
