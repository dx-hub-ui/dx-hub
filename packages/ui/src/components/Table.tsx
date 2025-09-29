"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Table from "@vibe/core/dist/components/Table/Table/Table";
import type { TableProps } from "@vibe/core/dist/components/Table/Table/Table";
import TableHeader from "@vibe/core/dist/components/Table/TableHeader/TableHeader";
import TableHeaderCell from "@vibe/core/dist/components/Table/TableHeaderCell/TableHeaderCell";
import TableBody from "@vibe/core/dist/components/Table/TableBody/TableBody";
import TableRow from "@vibe/core/dist/components/Table/TableRow/TableRow";
import TableCell from "@vibe/core/dist/components/Table/TableCell/TableCell";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps } from "./types";

export interface DxTableColumn extends TableProps["columns"][number] {
  accessor: string;
  render?: (row: DxTableRow) => ReactNode;
}

export interface DxTableRow {
  id: string;
  cells: Record<string, ReactNode>;
  highlighted?: boolean;
}

export interface DxTableProps
  extends Omit<TableProps, "columns" | "size" | "children">,
    DxComponentBaseProps {
  columns: DxTableColumn[];
  rows: DxTableRow[];
  onReorder?: (from: number, to: number, rows: DxTableRow[]) => void;
}

const sizeMap = {
  sm: Table.sizes.SMALL,
  md: Table.sizes.MEDIUM,
} as const;

export function DxTable({
  size = "md",
  variant = "primary",
  density = "compact",
  telemetryId,
  columns,
  rows,
  onReorder,
  ...rest
}: DxTableProps) {
  const { trackReorder } = useInteractionEvents();
  const [orderedRows, setOrderedRows] = useState(rows);
  const dragSourceIndex = useRef<number | null>(null);

  useEffect(() => {
    setOrderedRows(rows);
  }, [rows]);

  const handleReorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0) {
        return;
      }

      setOrderedRows((current) => {
        const next = [...current];
        if (from >= next.length || to >= next.length) {
          return current;
        }
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        trackReorder("table", {
          component: "table",
          density,
          variant,
          telemetryId,
          from,
          to,
        });
        onReorder?.(from, to, next);
        return next;
      });
    },
    [density, onReorder, telemetryId, trackReorder, variant],
  );

  return (
    <Table
      columns={columns.map(({ accessor, render, ...column }) => column)}
      size={sizeMap[size]}
      data-density={density}
      {...rest}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableHeaderCell key={column.id} title={column.title} icon={column.icon} infoContent={column.infoContent} />
        ))}
      </TableHeader>
      <TableBody>
        {orderedRows.map((row, index) => (
          <TableRow
            key={row.id}
            highlighted={row.highlighted}
            draggable
            role="row"
            data-row-id={row.id}
            aria-dropeffect="move"
            onDragStart={() => {
              dragSourceIndex.current = index;
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragSourceIndex.current !== null) {
                handleReorder(dragSourceIndex.current, index);
              }
              dragSourceIndex.current = null;
            }}
            onDragEnd={() => {
              dragSourceIndex.current = null;
            }}
            aria-grabbed={dragSourceIndex.current === index}
            data-density={density}
          >
            {columns.map((column) => (
              <TableCell key={`${row.id}-${column.id}`}>
                {column.render ? column.render(row) : row.cells[column.accessor]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
