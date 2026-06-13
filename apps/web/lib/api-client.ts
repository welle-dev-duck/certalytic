const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type ApiValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get validationErrors(): ApiValidationErrors | null {
    if (
      this.status === 422 &&
      typeof this.body === "object" &&
      this.body !== null &&
      "errors" in this.body &&
      typeof (this.body as { errors: unknown }).errors === "object"
    ) {
      return (this.body as { errors: ApiValidationErrors }).errors;
    }

    return null;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(
  path: string,
  params?: ApiRequestOptions["params"],
): string {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, API_URL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function api<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, params, headers, ...init } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(buildUrl(path, params), {
    credentials: "include",
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const nestedError =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "object" &&
      (payload as { error: unknown }).error !== null
        ? (payload as { error: { message?: unknown; code?: unknown } }).error
        : null;

    const message =
      typeof nestedError?.message === "string"
        ? nestedError.message
        : typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof (payload as { message: unknown }).message === "string"
          ? (payload as { message: string }).message
          : `Request failed with status ${response.status}`;

    const code =
      typeof nestedError?.code === "string" ? nestedError.code : undefined;

    throw new ApiError(message, response.status, payload, code);
  }

  return payload as T;
}

export function apiUrl(path: string): string {
  return buildUrl(path);
}
