"use client";
import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  // FIX 1: Import necessary types from the library
  ColumnDef,
  HeaderGroup,
  Header,
  Row,
  Cell,
} from '@tanstack/react-table';
import styles from './DataTable.module.scss';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

// FIX 2: Define a generic type for the data (TData)
// and define the props interface
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[]; // Use ColumnDef type
  topContent?: React.ReactNode; // Type topContent as optional ReactNode
}

// FIX 3: Apply the generic type and props interface
const DataTable = <TData,>({ data = [], columns = [], topContent }: DataTableProps<TData>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // You might need to add other options like state, sorting, filtering later
  });

  return (
    <div className={styles.tableCard}>
      {topContent && ( // Render topContent only if it exists
        <div className={styles.tableHeader}>
          {topContent}
        </div>
      )}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            {/* FIX 4: Add type for headerGroup */}
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
              <tr key={headerGroup.id}>
                {/* FIX 5: Add type for header */}
                {headerGroup.headers.map((header: Header<TData, unknown>) => (
                  <th key={header.id} style={{ width: header.getSize() !== 0 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              // FIX 6: Add type for row
              table.getRowModel().rows.map((row: Row<TData>) => (
                <tr key={row.id}>
                  {/* FIX 7: Add type for cell */}
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                    <td key={cell.id} style={{ width: cell.column.getSize() !== 0 ? cell.column.getSize() : undefined }}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className={styles.noData}>
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Basic Pagination Example */}
      <div className={styles.pagination}>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={styles.pageButton}
        >
          <MdChevronLeft /> Previous
        </button>
        <span>
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>{' '}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={styles.pageButton}
        >
          Next <MdChevronRight />
        </button>
      </div>
    </div>
  );
};

export default DataTable;