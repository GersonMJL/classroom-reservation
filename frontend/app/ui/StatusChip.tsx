import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";
const COLOR_BY_TONE: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: "#dff0e8", fg: "#1f6f5f" },
  warning: { bg: "#fce6d4", fg: "#8b4721" },
  danger:  { bg: "#fadcdc", fg: "#9b2c2c" },
  info:    { bg: "#dde9f5", fg: "#2c5a8a" },
  neutral: { bg: "#e6ebe9", fg: "#4f665f" },
};

export function StatusChip({ tone, label, size = "small", ...rest }: { tone: Tone; label: string } & Omit<ChipProps, "color">) {
  const c = COLOR_BY_TONE[tone];
  return <Chip size={size} label={label} sx={{ backgroundColor: c.bg, color: c.fg, fontWeight: 600 }} {...rest} />;
}
