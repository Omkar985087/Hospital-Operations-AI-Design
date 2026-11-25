import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export function DataTable({
  columns,
  data,
  keyField = 'id',
  loading = false,
  emptyState,
  onRowClick,
  skeletonRows = 5,
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-card">
        <TableSkeleton rows={skeletonRows} columns={columns.length} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-card">
        {emptyState || (
          <EmptyState title="No records found" description="There are no records to display." />
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E2E8F0] text-left">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap ${
                    col.headerClassName || ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {data.map((row, rowIndex) => {
              const rowKey = typeof keyField === 'function' ? keyField(row, rowIndex) : row[keyField] ?? rowIndex;
              return (
                <tr
                  key={rowKey}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-50/90' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-[#1E293B] align-middle ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;

