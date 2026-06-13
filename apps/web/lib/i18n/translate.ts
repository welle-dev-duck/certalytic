type MessageTree = Record<string, string | MessageTree>;

function readPath(tree: MessageTree, key: string): string | undefined {
  const value = key.split(".").reduce<string | MessageTree | undefined>(
    (current, segment) => {
      if (typeof current !== "object" || current === null) return undefined;
      return current[segment];
    },
    tree,
  );

  return typeof value === "string" ? value : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;

  return Object.entries(params).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function createTranslator(messages: MessageTree) {
  return function translate(
    key: string,
    params?: Record<string, string | number>,
  ): string {
    const value = readPath(messages, key);
    if (!value) return key;
    return interpolate(value, params);
  };
}

export type Translator = ReturnType<typeof createTranslator>;
