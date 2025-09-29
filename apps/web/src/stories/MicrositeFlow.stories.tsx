import type { Meta, StoryObj } from "@storybook/react";
import MicrositesPage from "@/app/microsites/page";
import { MicrositePublicClient } from "@/app/m/[orgId]/[slug]/MicrositePublicClient";
import { AppProviders } from "@/app/providers";
import { type ReactNode, useEffect } from "react";

const meta = {
  title: "Microsites/Fluxo",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "📚 [Vibe Docs — Form](https://monday.com/vibe/components/form)",
          "📚 [Vibe Docs — Dialog](https://monday.com/vibe/components/dialog)",
          "📚 [Vibe Docs — Toast](https://monday.com/vibe/components/toast)",
          "📚 [Vibe Docs — Card](https://monday.com/vibe/components/card)"
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function StoryWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.localStorage.removeItem("dxhub:microsites:leads");
    window.localStorage.removeItem("dxhub:microsites:rate-limit:demo-horizonte-tech");
  }, []);

  return <AppProviders>{children}</AppProviders>;
}

export const AdminDashboard: Story = {
  render: () => (
    <StoryWrapper>
      <MicrositesPage />
    </StoryWrapper>
  ),
};

export const PublicForm: Story = {
  render: () => (
    <StoryWrapper>
      <MicrositePublicClient orgId="org-demo-001" slug="demo-horizonte-tech" />
    </StoryWrapper>
  ),
};
