import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import Markdown from '@/components/markdown';

describe('Markdown', () => {
  it('render nội dung tiêu đề (h1) từ markdown', () => {
    render(<Markdown content="# Tiêu đề bài viết" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tiêu đề bài viết' })).toBeInTheDocument();
  });

  it('render danh sách từ markdown GFM', () => {
    render(<Markdown content={'- Mục một\n- Mục hai'} />);
    expect(screen.getByText('Mục một')).toBeInTheDocument();
    expect(screen.getByText('Mục hai')).toBeInTheDocument();
  });

  it('không vi phạm a11y', async () => {
    const { container } = render(<Markdown content={'# Hello\n\nĐây là **nội dung** markdown.'} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
