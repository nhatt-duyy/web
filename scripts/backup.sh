#!/usr/bin/env bash
# ============================================================================
# scripts/backup.sh — Backup Postgres cho Nhat Duy Market (production)
# Chạy định kỳ trên VPS qua cron (ví dụ: 0 2 * * * /opt/nhatduy-market/scripts/backup.sh)
#
# Cách test trên staging:
#   bash -n scripts/backup.sh          # kiểm tra syntax
#   ./scripts/backup.sh                # chạy thử (cần postgres container chạy)
#
# Biến môi trường (đọc từ .env.production hoặc export trước khi chạy):
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   BACKUP_DIR   (mặc định: /opt/nhatduy-market/backups)
#   DB_CONTAINER (mặc định: tên container postgres trong compose)
#   RETAIN_DAYS  (mặc định: 7)
# ============================================================================
set -euo pipefail

# Load env từ file .env.production nếu tồn tại (KHÔNG commit file thật)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/../infrastructure/docker/.env.production}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

POSTGRES_USER="${POSTGRES_USER:-sourceban}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-sourceban}"
POSTGRES_DB="${POSTGRES_DB:-sourceban}"
BACKUP_DIR="${BACKUP_DIR:-/opt/nhatduy-market/backups}"
DB_CONTAINER="${DB_CONTAINER:-nhatduy-market-postgres-1}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
BACKUP_GZ="${BACKUP_FILE}.gz"

echo "[$(date)] Bắt đầu backup DB ${POSTGRES_DB}..."

# pg_dump qua docker exec (dùng biến môi trường PGPASSWORD)
if docker exec "$DB_CONTAINER" sh -c \
  "PGPASSWORD='$POSTGRES_PASSWORD' pg_dump -U '$POSTGRES_USER' -d '$POSTGRES_DB' -F p" > "$BACKUP_FILE"; then
  # Nén để tiết kiệm dung lượng
  gzip -f "$BACKUP_FILE"
  echo "[$(date)] Backup thành công: $BACKUP_GZ"
else
  echo "[$(date)] LỖI: pg_dump thất bại" >&2
  exit 1
fi

# Xoay vòng: xóa file cũ hơn RETAIN_DAYS
echo "[$(date)] Dọn backup cũ hơn ${RETAIN_DAYS} ngày..."
find "$BACKUP_DIR" -name 'backup_*.sql.gz' -type f -mtime "+${RETAIN_DAYS}" -delete

echo "[$(date)] Hoàn tất. Danh sách backup hiện tại:"
ls -lh "$BACKUP_DIR" | tail -n +2
