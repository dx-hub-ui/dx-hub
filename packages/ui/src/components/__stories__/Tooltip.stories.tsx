import { DxTooltip } from "../Tooltip";
import { DxButton } from "../Button";

const meta = {
  title: "Primitives/Tooltip",
  component: DxTooltip,
  args: {
    content: "Informação contextual",
    children: <DxButton>Ver dica</DxButton>,
  },
} as const;

export default meta;

export const Playground = {};
