import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-client";
import { mapValidationErrors } from "@/lib/mutation-errors";

describe("mapValidationErrors", () => {
  it("maps the first message per field", () => {
    expect(
      mapValidationErrors({
        name: ["Name is required", "Too short"],
        email: ["Invalid email"],
      }),
    ).toEqual({
      name: "Name is required",
      email: "Invalid email",
    });
  });
});

describe("ApiError", () => {
  it("extracts validation errors from 422 responses", () => {
    const error = new ApiError("Validation failed", 422, {
      message: "Validation failed",
      errors: { name: ["Required"] },
    });

    expect(error.validationErrors).toEqual({ name: ["Required"] });
  });
});
