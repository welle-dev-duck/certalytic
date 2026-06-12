import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Certalytic/i);
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(
      page.getByRole("heading", { name: "Log in to your account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(
      page.getByRole("heading", { name: "Create an account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(
      page.getByRole("heading", { name: "Forgot your password?" }),
    ).toBeVisible();
  });
});

test.describe("authenticated routes", () => {
  test("protected billing route gates unauthenticated access", async ({
    page,
  }) => {
    await page.goto("/billing");

    await expect(
      page
        .getByText("Verifying session...")
        .or(page.getByRole("heading", { name: "Log in to your account" })),
    ).toBeVisible({ timeout: 15_000 });
  });
});
