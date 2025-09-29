import { DxCard } from "../Card";

const meta = {
  title: "Primitives/Card",
  component: DxCard,
  args: {
    children: (
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-[#111827]">Resumo</h3>
        <p className="text-sm text-[#4b5563]">Conteúdo padronizado utilizando tokens do Vibe.</p>
      </div>
    ),
    density: "compact",
    size: "md",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md"],
    },
    density: {
      control: "inline-radio",
      options: ["compact", "comfortable"],
    },
  },
} as const;

export default meta;

export const Playground = {};
