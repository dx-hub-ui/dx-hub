"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent as ReactDragEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  type TableColumn,
  type TableProps,
} from "@vibe/core";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps, DxSize } from "./types";

export interface DxTableColumn extends TableColumn {
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

type TableSize = ComponentProps<typeof Table>["size"];
type VibeTableRowProps = ComponentProps<typeof TableRow> & HTMLAttributes<HTMLDivElement>;

const sizeMap: Record<DxSize, TableSize> = {
  sm: Table.sizes.SMALL,
  md: Table.sizes.MEDIUM,
};

type RowDragEvent = ReactDragEvent<HTMLDivElement>;

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

  const vibeColumns = columns.map(({ accessor, render, ...column }): TableColumn => column);

  return (
    <Table columns={vibeColumns} size={sizeMap[size]} data-density={density} {...rest}>
      <TableHeader>
        {columns.map((column) => (
          <TableHeaderCell key={column.id} title={column.title} icon={column.icon} infoContent={column.infoContent} />
        ))}
      </TableHeader>
      <TableBody>
        {orderedRows.map((row, index) => (
          <TableRow
            key={row.id}
            {...({
              highlighted: row.highlighted,
              draggable: true,
              role: "row",
              "data-row-id": row.id,
              "aria-dropeffect": "move",
              onDragStart: () => {
                dragSourceIndex.current = index;
              },
              onDragOver: (event: RowDragEvent) => {
                event.preventDefault();
              },
              onDrop: (event: RowDragEvent) => {
                event.preventDefault();
                if (dragSourceIndex.current !== null) {
                  handleReorder(dragSourceIndex.current, index);
                }
                dragSourceIndex.current = null;
              },
              onDragEnd: () => {
                dragSourceIndex.current = null;
              },
              "aria-grabbed": dragSourceIndex.current === index,
              "data-density": density,
            } as unknown as VibeTableRowProps)}
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
