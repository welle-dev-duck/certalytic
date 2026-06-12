import { useMemo } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

const chartThemes = {
    light: {
        primary: 'oklch(0.3098 0.0436 173.4222)',
        border: 'oklch(0.8926 0.0129 179.4486)',
        mutedForeground: 'oklch(0.5276 0.0255 178.4128)',
    },
    dark: {
        primary: 'oklch(0.7534 0.0902 170.3217)',
        border: 'oklch(0.3196 0.0252 177.3664)',
        mutedForeground: 'oklch(0.6987 0.0241 178.8503)',
    },
} as const;

export function useChartTheme() {
    const { resolvedAppearance } = useAppearance();

    return useMemo(
        () => chartThemes[resolvedAppearance],
        [resolvedAppearance],
    );
}
