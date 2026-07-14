interface FiltersProps {
  categories: { slug: string; name: string }[];
  category: string; // current selected category slug (empty string for all)
  sortBy: 'createdAt' | 'price';
  sortOrder: 'asc' | 'desc';
  onCategoryChange: (slug: string) => void;
  onSortChange: (by: 'createdAt' | 'price', order: 'asc' | 'desc') => void;
}

export default function Filters({
  categories,
  category,
  sortBy,
  sortOrder,
  onCategoryChange,
  onSortChange,
}: FiltersProps) {
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [by, order] = e.target.value.split('-') as [
      'createdAt' | 'price',
      'asc' | 'desc'
    ];
    onSortChange(by, order);
  };

  // Map sort options to display text and value
  const sortOptions = [
    { value: 'createdAt-desc', label: 'Mới nhất' },
    { value: 'price-asc', label: 'Giá tăng dần' },
    { value: 'price-desc', label: 'Giá giảm dần' },
  ];

  const currentSortValue = `${sortBy}-${sortOrder}`;

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Filter */}
        <div className="w-full sm:w-auto">
          <label htmlFor="category-filter" className="mb-2 block text-sm font-medium text-gray-700">
            Danh mục
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={handleCategoryChange}
            className="block w-full rounded-md border-0 py-1.5 pl-2 pr-3 text-right text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:max-w-xs"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Select */}
        <div className="w-full sm:w-auto">
          <label htmlFor="sort-select" className="mb-2 block text-sm font-medium text-gray-700">
            Sắp xếp
          </label>
          <select
            id="sort-select"
            value={currentSortValue}
            onChange={handleSortChange}
            className="block w-full rounded-md border-0 py-1.5 pl-2 pr-3 text-right text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:max-w-xs"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}