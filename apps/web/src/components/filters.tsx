import { cn } from '@/lib/cn';
import { Select } from '@/components/ui/primitives';

interface FiltersProps {
  categories: { slug: string; name: string }[];
  category: string; // current selected category slug (empty string for all)
  sortBy: 'createdAt' | 'price';
  sortOrder: 'asc' | 'desc';
  onCategoryChange: (slug: string) => void;
  onSortChange: (by: 'createdAt' | 'price', order: 'asc' | 'desc') => void;
}

const sortOptions = [
  { value: 'createdAt-desc', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
];

export default function Filters({
  categories,
  category,
  sortBy,
  sortOrder,
  onCategoryChange,
  onSortChange,
}: FiltersProps) {
  const currentSortValue = `${sortBy}-${sortOrder}`;

  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      {/* Category chips */}
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

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-select" className="shrink-0 text-sm font-medium text-muted">
          Sắp xếp
        </label>
        <Select
          id="sort-select"
          value={currentSortValue}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-') as [
              'createdAt' | 'price',
              'asc' | 'desc',
            ];
            onSortChange(by, order);
          }}
          className="sm:w-48"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
