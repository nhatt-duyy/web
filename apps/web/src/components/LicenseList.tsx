interface License {
  id: string;
  productName: string;
  keyMasked: string;
  status: 'active' | 'expired' | 'revoked';
}

interface LicenseListProps {
  licenses: License[];
}

const STATUS_LABEL: Record<License['status'], string> = {
  active: 'Đang hoạt động',
  expired: 'Hết hạn',
  revoked: 'Đã thu hồi',
};

export default function LicenseList({ licenses }: LicenseListProps) {
  if (licenses.length === 0) {
    return (
      <p className="text-sm text-muted" role="status">
        Bạn chưa có license nào.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" aria-label="Danh sách license của bạn">
      {licenses.map((license) => (
        <li
          key={license.id}
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{license.productName}</span>
            <span className="font-mono text-sm text-muted">{license.keyMasked}</span>
          </div>
          <span
            className="rounded-full bg-surface-2 px-2 py-1 text-xs font-medium text-muted"
            data-status={license.status}
          >
            {STATUS_LABEL[license.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
