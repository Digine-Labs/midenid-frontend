import { useTheme } from "@/components/ThemeProvider";
import { getDarkModeFilter } from "@/utils/theme";

interface ThemedIconProps {
  src: string;
  alt: string;
  className?: string;
}

export function ThemedIcon({ src, alt, className = "h-4 w-4" }: ThemedIconProps) {
  const { resolvedTheme } = useTheme();

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={getDarkModeFilter(resolvedTheme === 'dark')}
    />
  );
}
