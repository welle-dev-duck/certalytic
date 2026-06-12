export type ScanAsset = {
  name: string;
  text: string;
};

export type RoleContext = {
  title: string | null;
  description: string | null;
  contextMetadata?: Record<string, unknown> | null;
  scanAssets: ScanAsset[];
};

export function roleContextToPromptArray(context: RoleContext): Record<string, unknown> {
  return {
    title: context.title,
    description: context.description,
    context_metadata: context.contextMetadata ?? null,
    scan_assets: context.scanAssets,
  };
}
