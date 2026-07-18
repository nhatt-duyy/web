#!/usr/bin/env bash
# ============================================================================
# scripts/rollback.sh — Rollback Nhat Duy Market về version/tag cũ
#
# Usage:
#   ./scripts/rollback.sh <TAG>            # rollback toàn bộ stack về image tag
#   ./scripts/rollback.sh api <TAG>        # rollback chỉ api
#   ./scripts/rollback.sh --list          # liệt kê các tag image đã pull
#
# Ví dụ:
#   ./scripts/rollback.sh v1.2.3
#   ./scripts/rollback.sh api sha-abc123def
#
# Cách test trên staging:
#   bash -n scripts/rollback.sh           # kiểm tra syntax
#   ./scripts/rollback.sh --list          # xem tag có sẵn
#
# Lưu ý: Tag image phải đã được push từ deploy.yml (GHCR) hoặc pull về VPS.
#        Script KHÔNG xóa data Postgres (chỉ rollback code/images).
# ============================================================================
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infrastructure/docker/docker-compose.prod.yml}"
REGISTRY="${REGISTRY:-ghcr.io}"
ORG="${ORG:-nhatduy}"  # override qua env: ORG=github_repo_owner

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <TAG> | <service> <TAG> | --list" >&2
  exit 1
fi

# Chế độ liệt kê
if [[ "$1" == "--list" ]]; then
  echo "=== Image tags đã pull ==="
  docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}' | grep -E "nhatduy-market" || echo "(chưa có image nào)"
  exit 0
fi

# Xác định service + tag
if [[ $# -eq 2 ]]; then
  SERVICE="$1"
  TAG="$2"
else
  SERVICE=""
  TAG="$1"
fi

echo "[$(date)] Rollback stack về tag: $TAG ${SERVICE:+(service: $SERVICE)}"

# Tính tên image tương ứng
image_name() {
  case "$1" in
    api)   echo "${REGISTRY}/${ORG}/nhatduy-market-api" ;;
    web)   echo "${REGISTRY}/${ORG}/nhatduy-market-web" ;;
    admin) echo "${REGISTRY}/${ORG}/nhatduy-market-admin" ;;
    *)     echo "" ;;
  esac
}

# Hàm rollback 1 service
rollback_service() {
  local svc="$1"
  local img
  img="$(image_name "$svc")"
  if [[ -z "$img" ]]; then
    echo "Service không hợp lệ: $svc" >&2
    exit 1
  fi
  echo "  → Pull image $img:$TAG"
  docker pull "$img:$TAG"
  # Ghi đè tag 'latest' của service đó để compose dùng đúng version
  docker tag "$img:$TAG" "$img:latest"
}

if [[ -n "$SERVICE" ]]; then
  rollback_service "$SERVICE"
else
  for s in api web admin; do
    rollback_service "$s"
  done
fi

echo "[$(date)] Khởi động lại stack với image cũ..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[$(date)] Chờ healthcheck..."
sleep 15

# Verify
echo "Kiểm tra api health:"
curl -fsS http://localhost:3001/api/health || { echo "API health FAILED sau rollback"; exit 1; }

echo "[$(date)] Rollback hoàn tất ✅"
