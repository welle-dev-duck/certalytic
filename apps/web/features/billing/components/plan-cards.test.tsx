import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  EnterprisePlanCard,
  SubscriptionPlanCard,
} from "@/features/billing/components/plan-cards";
import { SUBSCRIPTION_PLANS } from "@/features/billing/plans";
import { I18nProvider } from "@/lib/i18n/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

function renderWithI18n(ui: React.ReactNode) {
  return render(<I18nProvider locale="en">{ui}</I18nProvider>);
}

describe("SubscriptionPlanCard", () => {
  it("renders plan label, price, and features", () => {
    const plan = SUBSCRIPTION_PLANS.find((entry) => entry.value === "starter")!;

    renderWithI18n(
      <SubscriptionPlanCard
        plan={plan}
        footer={<button type="button">Choose plan</button>}
        highlighted
        badge="Popular"
      />,
    );

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("€159")).toBeInTheDocument();
    expect(screen.getByText("20 screenings / month")).toBeInTheDocument();
    expect(screen.getByText("Popular")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose plan" })).toBeInTheDocument();
  });
});

describe("EnterprisePlanCard", () => {
  it("renders enterprise features", () => {
    renderWithI18n(
      <EnterprisePlanCard
        footer={<a href="mailto:sales@example.com">Contact sales</a>}
      />,
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact sales" }),
    ).toBeInTheDocument();
  });
});
