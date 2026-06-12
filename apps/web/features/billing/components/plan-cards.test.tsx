import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EnterprisePlanCard,
  SubscriptionPlanCard,
} from "@/features/billing/components/plan-cards";

describe("SubscriptionPlanCard", () => {
  it("renders plan label, price, and features", () => {
    render(
      <SubscriptionPlanCard
        plan={{
          value: "starter",
          label: "Starter",
          price: 159,
          recommendation: "For small teams",
          includesPlan: null,
          features: ["20 screenings / month"],
          incrementalFeatures: [],
        }}
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
    render(
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
