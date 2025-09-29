import { AppProviders } from "../src/app/providers";
import "../src/app/globals.css";

const preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    a11y: {
      element: "#storybook-root",
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f5f6f8" },
        { name: "dark", value: "#10161a" },
      ],
    },
  },
  globalTypes: {
    theme: {
      name: "Tema",
      description: "Tema do sistema",
      defaultValue: "light",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      name: "Densidade",
      description: "Controle de densidade",
      defaultValue: "compact",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "compact", title: "Compact" },
          { value: "comfortable", title: "Comfortable" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <AppProviders>
        <div data-theme={context.globals.theme} data-density={context.globals.density} className="min-w-[320px]">
          <Story />
        </div>
      </AppProviders>
    ),
  ],
};

export default preview;
