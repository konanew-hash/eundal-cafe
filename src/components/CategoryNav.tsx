'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/lib/types';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export default function CategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 스크롤 가능 여부 체크
  const checkScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft: sLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(sLeft > 6);
      setCanScrollRight(sLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    checkScrollState();
    const handleResize = () => checkScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);

  // 마우스 드래그 시작 (mousedown)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  // 마우스 드래그 이동 (mousemove)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // 드래그 반응 감도
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
    checkScrollState();
  };

  // 마우스 드래그 해제 (mouseup / mouseleave)
  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
    // 드래그 직후 클릭 오동작 방지를 위해 짧은 딜레이 후 해제
    setTimeout(() => setHasMoved(false), 50);
  };

  // 마우스 휠 세로 회전을 가로 스크롤로 자연스럽게 변환
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 이미 가로 휠 스크롤인 경우
    scrollRef.current.scrollLeft += e.deltaY * 0.8;
    checkScrollState();
  };

  // 좌우 스크롤 화살표 버튼
  const handleScrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScrollState, 250);
    }
  };

  const handleTabClick = (categoryId: string) => {
    if (hasMoved) return; // 드래그 중인 경우 클릭 무시
    onSelectCategory(categoryId);
  };

  return (
    <div className="sticky top-16 z-20 glass-panel border-b border-stone-200/70 py-2.5 select-none">
      <div className="max-w-md mx-auto px-2 sm:px-4 relative group">
        {/* PC 좌측 스크롤 화살표 버튼 */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScrollBy(-140)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 shadow-md border border-stone-300 text-stone-700 items-center justify-center hover:bg-stone-100 transition-all -ml-1 cursor-pointer"
            aria-label="이전 탭 보기"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* 탭 스크롤 컨테이너 (모바일 터치 스와이프 + PC 마우스 드래그 & 휠) */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
          onScroll={checkScrollState}
          className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 cursor-grab active:cursor-grabbing ${
            isMouseDown ? 'cursor-grabbing' : ''
          }`}
          style={{ scrollBehavior: isMouseDown ? 'auto' : 'smooth' }}
        >
          {/* 단체 납품사례 바로가기 탭 */}
          <Link
            href="/portfolio"
            title="실제 단체 납품 & 케이터링 포트폴리오 보기"
            onClick={(e) => {
              if (hasMoved) e.preventDefault();
            }}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1 shrink-0 shadow-2xs"
          >
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>납품사례</span>
          </Link>

          {/* 전체 메뉴 탭 */}
          <button
            type="button"
            onClick={() => handleTabClick('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100/90 text-stone-600 hover:bg-stone-200'
            }`}
          >
            전체 메뉴
          </button>

          {/* 카테고리 탭 목록 */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleTabClick(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100/90 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* PC 우측 스크롤 화살표 버튼 */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScrollBy(140)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 shadow-md border border-stone-300 text-stone-700 items-center justify-center hover:bg-stone-100 transition-all -mr-1 cursor-pointer"
            aria-label="다음 탭 보기"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
