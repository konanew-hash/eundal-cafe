'use client';

import React from 'react';
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
