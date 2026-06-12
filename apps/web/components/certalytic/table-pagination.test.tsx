import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TablePagination } from "@/components/certalytic/table-pagination";

describe("TablePagination", () => {
  it("shows row range and page size selector", () => {
    render(
      <TablePagination
        meta={{
          limit: 25,
          from: 1,
          to: 25,
          hasNextPage: true,
          nextCursor: "cursor-2",
        }}
        hasPrevPage={false}
        onNextPage={vi.fn()}
        onPrevPage={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Showing 1–25")).toBeInTheDocument();
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();
  });

  it("calls navigation handlers", async () => {
    const user = userEvent.setup();
    const onNextPage = vi.fn();
    const onPrevPage = vi.fn();

    render(
      <TablePagination
        meta={{
          limit: 10,
          from: 11,
          to: 20,
          hasNextPage: true,
          nextCursor: "cursor-3",
        }}
        hasPrevPage
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        onPageSizeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(onNextPage).toHaveBeenCalledOnce();
    expect(onPrevPage).toHaveBeenCalledOnce();
  });
});
