// apps/api/prisma/seed.ts
// Placeholder seed script — sẽ bổ sung logic seed (User/Product/Order/License mẫu) ở Phase 1.
// Chạy qua: pnpm prisma:seed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // TODO(Phase 1): seed dữ liệu mẫu (admin user, danh mục, sản phẩm demo).
  console.log('Seed placeholder — chưa có dữ liệu mẫu.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
