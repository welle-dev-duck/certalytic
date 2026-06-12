// eslint-disable-next-line no-restricted-imports -- This is the wrapper that enforces prefetch={false}
import NextLink from "next/link";

type LinkProps = React.ComponentProps<typeof NextLink>;

/**
 * Link component with prefetch disabled by default.
 * Use this instead of next/link to avoid prefetching all links.
 */
export default function Link({ prefetch = false, ...props }: LinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
