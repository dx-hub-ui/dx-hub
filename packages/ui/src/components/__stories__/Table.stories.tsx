import { useState } from "react";
import { DxTable } from "../Table";

const meta = {
  title: "Primitives/Table",
  component: DxTable,
};

export default meta;

const columns = [
  { id: "name", accessor: "name", title: "Nome" },
  { id: "stage", accessor: "stage", title: "Etapa" },
];

const initialRows = [
  { id: "1", cells: { name: "Contato A", stage: "Descoberta" } },
  { id: "2", cells: { name: "Contato B", stage: "Qualificação" } },
];

export const Playground = {
  render: () => {
    const [rows] = useState(initialRows);
    return (
      <DxTable
        columns={columns}
        rows={rows}
        emptyState={<div className="px-4 py-6 text-sm text-gray-600">Sem dados</div>}
        errorState={<div className="px-4 py-6 text-sm text-red-700">Erro ao carregar</div>}
        dataState={{ isLoading: false, isError: false }}
      />
    );
  },
};
