import { describe, expect, it } from "vitest";

import { forgotPasswordSchema } from "@/features/auth/schemas/forgot-password-schema";
import { resetPasswordSchema } from "@/features/auth/schemas/reset-password-schema";
import { signInSchema } from "@/features/auth/schemas/sign-in-schema";
import { signUpSchema } from "@/features/auth/schemas/sign-up-schema";

describe("auth schemas", () => {
  it("validates sign-in credentials", () => {
    expect(
      signInSchema.safeParse({
        email: "user@example.com",
        password: "password1",
      }).success,
    ).toBe(true);
    expect(
      signInSchema.safeParse({ email: "not-an-email", password: "" }).success,
    ).toBe(false);
  });

  it("validates sign-up password confirmation", () => {
    expect(
      signUpSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        confirmPassword: "password123",
      }).success,
    ).toBe(true);
    expect(
      signUpSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("validates forgot and reset password forms", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        password: "new-password",
        confirmPassword: "new-password",
      }).success,
    ).toBe(true);
  });
});
