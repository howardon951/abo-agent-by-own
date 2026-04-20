export type DataTableColumn<T> = {
  key: keyof T;
  label: string;
};

export function DataTable<T extends Record<string, string | number | null>>({
  columns,
  rows
}: {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
}) {
  return (
    <div className="panel card" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={String(column.key)}>{row[column.key] ?? "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
