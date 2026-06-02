import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { notificationApi, type Notification } from "../services/api";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await notificationApi.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleClick(item: Notification) {
    if (!item.read) {
      await notificationApi.markRead(item.id);
      await load();
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Notificações
      </Typography>
      <Paper>
        <List>
          {!loading && items.length === 0 && (
            <ListItemText sx={{ p: 2 }} primary="Nenhuma notificação." />
          )}
          {items.map((item) => (
            <ListItemButton key={item.id} onClick={() => handleClick(item)}>
              <ListItemText primary={item.title} secondary={item.body} />
              {!item.read && <Chip size="small" color="primary" label="Nova" />}
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
