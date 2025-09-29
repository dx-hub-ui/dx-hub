import { DxButton } from "../Button";

const meta = {
  title: "Primitives/Button",
  component: DxButton,
  argTypes: {
    onClick: { action: "clicked" },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md"],
    },
    density: {
      control: "inline-radio",
      options: ["compact", "comfortable"],
    },
  },
  args: {
    children: "Ação",
    variant: "primary",
    size: "md",
    density: "compact",
  },
} as const;

export default meta;

export const Playground = {};

export const Loading = {
  args: {
    loading: true,
  },
};
