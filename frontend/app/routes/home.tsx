import { Box, Button, Container, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router";

export const meta = () => {
  return [
    { title: "Classroom Reservation" },
    { name: "description", content: "Welcome to Classroom Reservation System!" },
  ];
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          Classroom Reservation System
        </Typography>
        <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
          Manage your classroom reservations efficiently and securely
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
