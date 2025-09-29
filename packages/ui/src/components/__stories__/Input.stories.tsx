import { DxInput } from "../Input";

const meta = {
  title: "Primitives/Input",
  component: DxInput,
  args: {
    placeholder: "Pesquisar contato",
    size: "md",
    density: "compact",
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

export const ErrorState = {
  args: {
    validationStatus: "error",
  },
};
