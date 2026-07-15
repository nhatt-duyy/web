import { cn } from '@/lib/cn';
import { Select, Input } from '@/components/ui/primitives';

export interface LanguageOption {
  value: string;
  label: string;
}

interface FiltersProps {
  categories: { slug: string; name: string }[];
  category: string;
  languages?: LanguageOption[];
  language?: string;
  sortBy: 'createdAt' | 'price' | '_text_match';
  sortOrder: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  onCategoryChange: (slug: string) => void;
  onLanguageChange?: (value: string) => void;
  onSortChange: (by: 'createdAt' | 'price' | '_text_match', order: 'asc' | 'desc') => void;
  onPriceChange?: (min?: number, max?: number) => void;
}

const sortOptions = [
  { value: 'createdAt-desc', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: '_text_match-desc', label: 'Phù hợp nhất' },
];

export default function Filters({
  categories,
  category,
  languages = [],
  language = '',
  sortBy,
  sortOrder,
  minPrice,
  maxPrice,
  onCategoryChange,
  onLanguageChange,
  onSortChange,
  onPriceChange,
}: FiltersProps) {
  const currentSortValue = `${sortBy}-${sortOrder}`;

  return (
    <div className="mb-8 flex flex-col gap-5">
      {/* Danh mục */}
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => onCategoryChange('')}
          aria-pressed={category === ''}
          className={cn('chip cursor-pointer', category === '' && 'chip-active')}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onCategoryChange(cat.slug)}
            aria-pressed={category === cat.slug}
            className={cn('chip cursor-pointer', category === cat.slug && 'chip-active')}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Ngôn ngữ + khoảng giá + sắp xếp */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          {/* Ngôn ngữ */}
          {languages.length > 0 && onLanguageChange && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lang-select" className="text-sm font-medium text-muted">
                Ngôn ngữ
              </label>
              <Select
                id="lang-select"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="sm:w-44"
              >
                <option value="">Tất cả</option>
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Khoảng giá */}
          {onPriceChange && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Khoảng giá (VND)</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  aria-label="Giá thấp nhất"
                  placeholder="Từ"
                  value={minPrice ?? ''}
                  onChange={(e) =>
                    onPriceChange(
                      e.target.value ? Number(e.target.value) : undefined,
                      maxPrice,
                    )
                  }
                  className="w-28"
                />
                <span className="text-muted">—</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  aria-label="Giá cao nhất"
                  placeholder="Đến"
                  value={maxPrice ?? ''}
                  onChange={(e) =>
                    onPriceChange(
                      minPrice,
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-28"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sắp xếp */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="shrink-0 text-sm font-medium text-muted">
            Sắp xếp
          </label>
          <Select
            id="sort-select"
            value={currentSortValue}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-') as [
                'createdAt' | 'price' | '_text_match',
                'asc' | 'desc',
              ];
              onSortChange(by, order);
            }}
            className="sm:w-52"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
