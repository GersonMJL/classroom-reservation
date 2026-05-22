import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { tokens } from "./tokens";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

function paletteFor(tone: Tone) {
  const fg = tokens.color.status[tone];
  return { bg: alpha(fg, 0.15), fg };
}

export function StatusChip({ tone, label, size = "small", ...rest }: { tone: Tone; label: string } & Omit<ChipProps, "color">) {
  const c = paletteFor(tone);
  return <Chip size={size} label={label} sx={{ backgroundColor: c.bg, color: c.fg, fontWeight: 600 }} {...rest} />;
}
