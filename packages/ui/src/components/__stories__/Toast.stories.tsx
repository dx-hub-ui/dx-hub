import { useState } from "react";
import { DxToast } from "../Toast";
import { DxButton } from "../Button";

const meta = {
  title: "Primitives/Toast",
  component: DxToast,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "success", "info"],
    },
  },
} as const;

export default meta;

export const Playground = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <div className="flex flex-col items-start gap-4">
        <DxButton onClick={() => setOpen(true)}>Mostrar toast</DxButton>
        <DxToast {...args} open={open} onClose={() => setOpen(false)}>
          Ação concluída
        </DxToast>
      </div>
    );
  },
  args: {
    variant: "success",
    density: "compact",
  },
};
