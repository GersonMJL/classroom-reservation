// frontend/app/ui/NavItem.tsx
import { Button, alpha } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { tokens } from "./tokens";

type Props = {
  path: string;
  label: string;
  variant?: "primary" | "secondary";
  onNavigate?: () => void;
};

export function NavItem({ path, label, variant = "primary", onNavigate }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname.startsWith(path);
  const tint = variant === "secondary" ? tokens.color.secondary.main : tokens.color.primary.main;

  return (
    <Button
      variant={isActive ? "contained" : "text"}
      onClick={() => { navigate(path); onNavigate?.(); }}
      aria-current={isActive ? "page" : undefined}
      sx={{
        color: isActive ? "#fff" : "text.primary",
        backgroundColor: isActive ? tint : alpha(tint, 0.08),
        "&:hover": { backgroundColor: isActive ? tint : alpha(tint, 0.14) },
      }}
    >
      {label}
    </Button>
  );
}
