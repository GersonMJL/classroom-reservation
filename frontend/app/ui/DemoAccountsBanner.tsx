import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import BuildIcon from "@mui/icons-material/Build";

export type DemoAccount = {
  role: string;
  label: string;
  email: string;
  pass: string;
  desc: string;
  icon: typeof AdminPanelSettingsIcon;
  color: "primary" | "secondary" | "default" | "warning" | "info" | "success";
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    label: "Administrador",
    email: "admin@reservas.com",
    pass: "admin123",
    desc: "Gestão total, configurações, auditoria e usuários",
    icon: AdminPanelSettingsIcon,
    color: "primary",
  },
  {
    role: "PROFESSOR",
    label: "Professor",
    email: "professor@reservas.com",
    pass: "prof123",
    desc: "Aulas regulares, reservas recorrentes e compostas",
    icon: SchoolIcon,
    color: "info",
  },
  {
    role: "STUDENT",
    label: "Aluno / Usuário Comum",
    email: "aluno@reservas.com",
    pass: "aluno123",
    desc: "Consulta de horários e solicitações de salas",
    icon: PersonIcon,
    color: "success",
  },
  {
    role: "TECHNICIAN",
    label: "Técnico de Suporte",
    email: "tecnico@reservas.com",
    pass: "tec123",
    desc: "Apoio operacional, bloqueios e incidentes",
    icon: BuildIcon,
    color: "warning",
  },
];

type Props = {
  onSelectAccount?: (account: DemoAccount) => void;
  selectedEmail?: string;
  compact?: boolean;
};

export function DemoAccountsBanner({ onSelectAccount, selectedEmail, compact = false }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 2 : 2.5,
        borderRadius: 3,
        bgcolor: "rgba(31, 111, 95, 0.04)",
        borderColor: "rgba(31, 111, 95, 0.18)",
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: compact ? "0.85rem" : "0.95rem",
              color: "#17322d",
              letterSpacing: "0.02em",
            }}
          >
            ⚡ Contas de Demonstração (1-Clique)
          </Typography>
          <Typography variant="caption" sx={{ color: "#4f665f" }}>
            Clique em qualquer perfil para preencher
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: compact ? "1fr" : "repeat(2, 1fr)" },
            gap: 1.2,
          }}
        >
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = selectedEmail === acc.email;
            const Icon = acc.icon;

            return (
              <Box
                key={acc.email}
                role="button"
                tabIndex={0}
                onClick={() => onSelectAccount?.(acc)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectAccount?.(acc);
                  }
                }}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: isSelected ? "primary.main" : "rgba(0, 0, 0, 0.08)",
                  bgcolor: isSelected ? "rgba(31, 111, 95, 0.12)" : "background.paper",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover, &:focus-visible": {
                    outline: "none",
                    borderColor: "primary.main",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(23, 50, 45, 0.08)",
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                }}
              >
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.5 }}>
                  <Icon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#17322d" }}>
                    {acc.label}
                  </Typography>
                  <Chip
                    size="small"
                    label={acc.role}
                    color={acc.color}
                    variant="outlined"
                    sx={{ ml: "auto", height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                  />
                </Stack>
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.75rem" }}>
                  {acc.desc}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontFamily: "monospace",
                    color: "primary.dark",
                    fontWeight: 600,
                    mt: 0.5,
                    fontSize: "0.74rem",
                  }}
                >
                  {acc.email} • {acc.pass}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Paper>
  );
}
