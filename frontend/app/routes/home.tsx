import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, GlobalStyles, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import {
  AUTH_LOGOUT_EVENT,
  clearAuthTokens,
  environmentApi,
  getTokenRoles,
  hasValidAccessToken,
  reservationApi,
} from "../services/api";

export const meta = () => {
  return [
    { title: "Reserva de Salas" },
    { name: "description", content: "Bem-vindo ao Sistema de Reserva de Salas!" },
  ];
};

// Earthy palette (mirrors ui/tokens.ts — kept inline so the home page reads as one piece).
const PINE = "#1f6f5f";
const TERRA = "#b25e2e";
const TERRA_LIGHT = "#d98b58";
const INK = "#17322d";
const MUTED = "#4f665f";
const BORDER = "rgba(31, 111, 95, 0.16)";
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

// Faint blueprint grid + subtle grain, layered over the body's atmospheric glows.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Destination = {
  n: string;
  label: string;
  to: string;
  desc: string;
};

type DaySummary = {
  pending: number | null;
  today: number | null;
  environments: number | null;
};

// "—" when a metric couldn't load; "99+" caps the API page size (limit 100).
const formatCount = (n: number | null | undefined): string =>
  n === null || n === undefined ? "—" : n >= 100 ? "99+" : String(n);

const METRICS: {
  key: keyof DaySummary;
  label: string;
  desc: string;
  to: string;
  accent?: boolean;
}[] = [
  { key: "pending", label: "Aprovações", desc: "pendentes de decisão", to: "/aprovacoes", accent: true },
  { key: "today", label: "Reservas", desc: "agendadas para hoje", to: "/reservas" },
  { key: "environments", label: "Ambientes", desc: "cadastrados no sistema", to: "/environments" },
];

const PILLARS = [
  { k: "Clareza", v: "Disponibilidade e conflitos visíveis antes de reservar." },
  { k: "Controle", v: "Aprovações guiadas pela criticidade de cada ambiente." },
  { k: "Fluxo", v: "Recursos, bloqueios e penalidades em um só lugar." },
];

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [now, setNow] = useState(() => dayjs());
  // Time-derived output is rendered only after mount to avoid SSR hydration mismatches.
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const syncAuthState = () => {
      const authenticated = hasValidAccessToken();
      setIsAuthenticated(authenticated);
      setIsAdmin(authenticated && getTokenRoles().includes("admin"));
    };

    syncAuthState();

    const authInterval = window.setInterval(syncAuthState, 30000);
    // Keep the masthead dateline fresh across a midnight rollover.
    const clockInterval = window.setInterval(() => setNow(dayjs()), 60000);
    window.addEventListener("focus", syncAuthState);
    window.addEventListener("storage", syncAuthState);
    window.addEventListener(AUTH_LOGOUT_EVENT, syncAuthState as EventListener);

    return () => {
      window.clearInterval(authInterval);
      window.clearInterval(clockInterval);
      window.removeEventListener("focus", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener(AUTH_LOGOUT_EVENT, syncAuthState as EventListener);
    };
  }, []);

  const handleLogout = () => {
    clearAuthTokens();
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate("/");
  };

  // Editorial index of destinations; doubles as primary navigation (home has no AppShell).
  const destinations = useMemo<Destination[]>(() => {
    const base: Destination[] = [
      { n: "01", label: "Reservas", to: "/reservas", desc: "Crie e acompanhe solicitações" },
      { n: "02", label: "Ambientes", to: "/environments", desc: "Salas, laboratórios e auditórios" },
      { n: "03", label: "Aprovações", to: "/aprovacoes", desc: "Decida com base na criticidade" },
      { n: "04", label: "Recursos", to: "/resources", desc: "Equipamentos, kits e licenças" },
      { n: "05", label: "Bloqueios", to: "/bloqueios", desc: "Manutenções, feriados e eventos" },
    ];
    base.push(
      isAdmin
        ? { n: "06", label: "Usuários", to: "/users", desc: "Pessoas, papéis e acessos" }
        : { n: "06", label: "Auditoria", to: "/auditoria", desc: "Trilha de decisões e mudanças" }
    );
    return base;
  }, [isAdmin]);

  const dateline = useMemo(() => {
    const formatted = now.format("dddd, D [de] MMMM [de] YYYY");
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [now]);

  // Live "resumo de hoje" metrics — only fetched when signed in (protected endpoints).
  // Promise.allSettled so one failing/forbidden endpoint degrades to "—" instead of all.
  useEffect(() => {
    if (!isAuthenticated) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setSummaryLoading(true);
    const load = async () => {
      const startOfDay = dayjs().startOf("day").toISOString();
      const endOfDay = dayjs().endOf("day").toISOString();
      const results = await Promise.allSettled([
        reservationApi.listPending(0, 100),
        reservationApi.list({ start_after: startOfDay, end_before: endOfDay, limit: 100 }),
        environmentApi.getAllRooms(0, 500),
      ]);
      if (cancelled) return;
      setSummary({
        pending: results[0].status === "fulfilled" ? results[0].value.length : null,
        today: results[1].status === "fulfilled" ? results[1].value.length : null,
        environments: results[2].status === "fulfilled" ? results[2].value.length : null,
      });
      setSummaryLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <Box sx={{ position: "relative", minHeight: "100dvh", overflow: "hidden" }}>
      <GlobalStyles
        styles={{
          "@keyframes home-rise": {
            from: { opacity: 0, transform: "translateY(14px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
          ".home-rise": {
            animation: `home-rise 640ms ${EASE} both`,
          },
          "@media (prefers-reduced-motion: reduce)": {
            ".home-rise": { animation: "none" },
          },
        }}
      />

      {/* Background: blueprint grid + grain, on top of the body's earthy glows */}
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `
            linear-gradient(${BORDER} 1px, transparent 1px),
            linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: "36px 36px, 36px 36px",
          maskImage:
            "radial-gradient(circle at 70% 22%, rgba(0,0,0,0.5), transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle at 70% 22%, rgba(0,0,0,0.5), transparent 72%)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.05,
          mixBlendMode: "multiply",
          backgroundImage: GRAIN,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{ position: "relative", zIndex: 1, py: { xs: 4, md: 7 } }}
      >
        {/* Masthead */}
        <Box
          className="home-rise"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: TERRA,
                boxShadow: `0 0 0 4px ${TERRA_LIGHT}33`,
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                letterSpacing: "0.32em",
                fontSize: "0.82rem",
                color: INK,
              }}
            >
              RESERVA
            </Typography>
            <Box sx={{ width: 1, height: 14, bgcolor: BORDER }} />
            <Typography
              sx={{ fontSize: "0.82rem", color: MUTED, letterSpacing: "0.04em" }}
            >
              Gestão de Espaços
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "0.78rem",
              color: MUTED,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
            }}
          >
            {mounted ? dateline : " "}
          </Typography>
        </Box>

        <Box
          className="home-rise"
          sx={{ height: "2px", bgcolor: INK, opacity: 0.85, mt: 2.5, mb: { xs: 4, md: 6 } }}
        />

        {/* Hero + live day-rail */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.55fr 1fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "start",
          }}
        >
          {/* Editorial headline */}
          <Box>
            <Box
              className="home-rise"
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}
            >
              <Typography
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: PINE,
                }}
              >
                Edição diária
              </Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: BORDER, maxWidth: 120 }} />
              <Typography sx={{ fontSize: "0.78rem", color: MUTED }}>
                Painel de gestão
              </Typography>
            </Box>

            <Typography
              component="h1"
              className="home-rise"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: INK,
                lineHeight: 0.98,
                letterSpacing: "-0.02em",
                fontSize: { xs: "2.7rem", sm: "3.6rem", md: "4.6rem" },
                animationDelay: "60ms",
              }}
            >
              O espaço certo,
              <br />
              no{" "}
              <Box
                component="span"
                sx={{
                  fontStyle: "italic",
                  color: TERRA,
                  position: "relative",
                  whiteSpace: "nowrap",
                }}
              >
                tempo certo
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "0.08em",
                    height: "0.09em",
                    bgcolor: TERRA_LIGHT,
                    borderRadius: 2,
                  }}
                />
              </Box>
              .
            </Typography>

            <Typography
              className="home-rise"
              sx={{
                mt: 3,
                maxWidth: 520,
                fontSize: { xs: "1rem", md: "1.12rem" },
                lineHeight: 1.6,
                color: MUTED,
                animationDelay: "120ms",
              }}
            >
              Ambientes, recursos, aprovações e bloqueios em um só painel —
              pensado para a operação do dia a dia, sem atrito e com decisões
              embasadas.
            </Typography>

            {/* Auth-aware actions */}
            <Box
              className="home-rise"
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
                mt: 4,
                animationDelay: "180ms",
              }}
            >
              {isAuthenticated ? (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/reservas")}
                    sx={{ px: 3 }}
                  >
                    Nova reserva
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleLogout}
                    sx={{ px: 3, borderColor: BORDER, color: INK }}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    href="/login"
                    sx={{ px: 3 }}
                  >
                    Entrar no painel
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    href="/register"
                    sx={{ px: 3, borderColor: BORDER, color: INK }}
                  >
                    Criar conta
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {/* Right column: live "resumo de hoje" (signed in) or value pillars (visitors) */}
          <Box
            className="home-rise"
            sx={{
              animationDelay: "240ms",
              position: "relative",
              borderRadius: "18px",
              border: `1px solid ${BORDER}`,
              bgcolor: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 18px 48px rgba(23, 50, 45, 0.12)",
              p: { xs: 3, md: 3.5 },
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: INK,
                fontSize: "1rem",
              }}
            >
              {isAuthenticated ? "Resumo de hoje" : "Por que usar"}
            </Typography>

            <Box sx={{ mt: 1 }}>
              {isAuthenticated
                ? METRICS.map((m, i) => (
                    <Box
                      key={m.to}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(m.to)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(m.to);
                        }
                      }}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        alignItems: "center",
                        gap: 2,
                        py: 2,
                        cursor: "pointer",
                        borderRadius: 2,
                        borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                        transition: `background-color 200ms ${EASE}`,
                        "&:hover, &:focus-visible": {
                          outline: "none",
                          bgcolor: "rgba(31,111,95,0.05)",
                        },
                        "&:hover .home-arrow, &:focus-visible .home-arrow": {
                          transform: "translate(3px, -3px)",
                          color: TERRA,
                        },
                        "&:active": { transform: "scale(0.99)" },
                      }}
                    >
                      {summaryLoading ? (
                        <Box
                          aria-hidden
                          sx={{
                            width: 46,
                            height: 34,
                            borderRadius: 1.5,
                            bgcolor: "rgba(31,111,95,0.10)",
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Space Grotesk", sans-serif',
                            fontWeight: 700,
                            fontSize: "2rem",
                            lineHeight: 1,
                            color: m.accent ? TERRA : INK,
                            fontVariantNumeric: "tabular-nums",
                            minWidth: "1.6ch",
                          }}
                        >
                          {formatCount(summary?.[m.key])}
                        </Typography>
                      )}
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: '"Space Grotesk", sans-serif',
                            fontWeight: 700,
                            fontSize: "1.02rem",
                            color: INK,
                            lineHeight: 1.15,
                          }}
                        >
                          {m.label}
                        </Typography>
                        <Typography sx={{ fontSize: "0.82rem", color: MUTED }}>
                          {m.desc}
                        </Typography>
                      </Box>
                      <Typography
                        className="home-arrow"
                        aria-hidden
                        sx={{
                          fontSize: "1.2rem",
                          color: MUTED,
                          transition: `transform 200ms ${EASE}, color 200ms ${EASE}`,
                        }}
                      >
                        ↗
                      </Typography>
                    </Box>
                  ))
                : PILLARS.map((f, i) => (
                    <Box
                      key={f.k}
                      sx={{ py: 2, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}
                    >
                      <Typography
                        sx={{
                          fontFamily: '"Space Grotesk", sans-serif',
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color: INK,
                        }}
                      >
                        {f.k}
                      </Typography>
                      <Typography
                        sx={{ mt: 0.5, fontSize: "0.88rem", color: MUTED, lineHeight: 1.5 }}
                      >
                        {f.v}
                      </Typography>
                    </Box>
                  ))}
            </Box>
          </Box>
        </Box>

        {/* Index of destinations (navigation) — only when signed in */}
        {isAuthenticated && (
          <Box sx={{ mt: { xs: 6, md: 9 } }}>
            <Box
              className="home-rise"
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, animationDelay: "120ms" }}
            >
              <Typography
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  fontSize: "0.78rem",
                  color: PINE,
                }}
              >
                ÍNDICE
              </Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: BORDER }} />
            </Box>

            <Box>
              {destinations.map((d, i) => (
                <Box
                  key={d.to}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(d.to)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(d.to);
                    }
                  }}
                  className="home-rise"
                  sx={{
                    animationDelay: `${160 + i * 50}ms`,
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: { xs: "auto 1fr auto", md: "64px 1fr auto" },
                    alignItems: "center",
                    gap: { xs: 2, md: 3 },
                    py: { xs: 2, md: 2.5 },
                    px: { xs: 1, md: 2 },
                    cursor: "pointer",
                    borderTop: `1px solid ${BORDER}`,
                    ...(i === destinations.length - 1 && {
                      borderBottom: `1px solid ${BORDER}`,
                    }),
                    transition: `background-color 200ms ${EASE}, padding-left 200ms ${EASE}`,
                    "&:hover, &:focus-visible": {
                      outline: "none",
                      bgcolor: "rgba(31,111,95,0.05)",
                      pl: { xs: 2, md: 3.5 },
                    },
                    "&:hover .home-arrow, &:focus-visible .home-arrow": {
                      transform: "translate(4px, -4px)",
                      color: TERRA,
                    },
                    "&:active": { transform: "scale(0.995)" },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 700,
                      fontSize: { xs: "1rem", md: "1.15rem" },
                      color: TERRA,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {d.n}
                  </Typography>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontWeight: 700,
                        fontSize: { xs: "1.25rem", md: "1.6rem" },
                        color: INK,
                        lineHeight: 1.1,
                      }}
                    >
                      {d.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.86rem", color: MUTED, mt: 0.25 }}>
                      {d.desc}
                    </Typography>
                  </Box>
                  <Typography
                    className="home-arrow"
                    aria-hidden
                    sx={{
                      fontSize: "1.4rem",
                      color: MUTED,
                      transition: `transform 200ms ${EASE}, color 200ms ${EASE}`,
                    }}
                  >
                    ↗
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
