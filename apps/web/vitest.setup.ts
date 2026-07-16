import '@testing-library/jest-dom';
import { expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

// Dùng matcher của vitest-axe (tương thích vitest) thay cho jest-axe,
// vì jest-axe gây lỗi "expectAssertion.call is not a function" trong vitest.
expect.extend(axeMatchers);
