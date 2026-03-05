import React from 'react';
import styles from './Table.module.css';

// The configuration object for each column
export interface Column<T> {
  header: string;
  accessor: keyof T | string; // The key in the data object, or a generic string if using a custom render
  render?: (row: T) => React.ReactNode; // Optional function for custom UI (like adding buttons or badges)
}

// The generic table properties
export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export function Table<T extends Record<string, any>>({ columns, data, onRowClick }: TableProps<T>) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={styles.th}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyState}>
                No data available.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={onRowClick ? styles.trInteractive : styles.tr}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={styles.td}>
                    {col.render ? col.render(row) : row[col.accessor as keyof T]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}