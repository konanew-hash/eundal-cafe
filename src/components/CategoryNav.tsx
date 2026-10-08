'use client';

import React from 'react';
import Link from 'next/link';
import { Award } from 'lucide-react';
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
  return (
    <div className="sticky top-16 z-20 glass-panel border-b border-stone-200/70 py-2.5">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* 단체 납품사례 바로가기 탭 */}
          <Link
            href="/portfolio"
            title="실제 단체 납품 & 케이터링 포트폴리오 보기"
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1 shrink-0 shadow-2xs"
          >
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>납품사례</span>
          </Link>

          {/* 전체 메뉴 탭 */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all ${
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
                onClick={() => onSelectCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all ${
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
      </div>
    </div>
  );
}
