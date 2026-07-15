// apps/web/src/lib/cn.ts
// Hợp nhất class name an toàn (không dependency bên ngoài).
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
