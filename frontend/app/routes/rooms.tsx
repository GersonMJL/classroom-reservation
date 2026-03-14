import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router";
import { roomApi, Room, RoomCreate } from "../services/api";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

export default function RoomsManagement() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchType, setSearchType] = useState<"capacity" | "location">("capacity");
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState<RoomCreate>({
    room_id: "",
    room_type: "",
    location: "",
    capacity: 0,
    accessibility: false,
    allowed_purposes: [],
  });

  const [purposeInput, setPurposeInput] = useState("");

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        // For now, we'll assume admin if token exists
        // In a real app, you'd decode the token to check roles
        setIsAdmin(true);
      } catch (err) {
        console.error("Auth check error:", err);
        navigate("/login");
      }
    };

    checkAdmin();
  }, [navigate]);

  // Load rooms
  const loadRooms = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const skip = (page - 1) * itemsPerPage;
      const data = await roomApi.getAllRooms(skip, itemsPerPage);
      setRooms(data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!formData.room_id.trim()) {
      setError("Room ID is required");
      return;
    }
    if (!formData.room_type.trim()) {
      setError("Room type is required");
      return;
    }
    if (!formData.location.trim()) {
      setError("Location is required");
      return;
    }
    if (formData.capacity <= 0) {
      setError("Capacity must be greater than 0");
      return;
    }
    if (formData.allowed_purposes.length === 0) {
      setError("At least one allowed purpose is required");
      return;
    }

    setLoading(true);
    try {
      await roomApi.createRoom(formData);
      setOpenCreateDialog(false);
      setFormData({
        room_id: "",
        room_type: "",
        location: "",
        capacity: 0,
        accessibility: false,
        allowed_purposes: [],
      });
      setPurposeInput("");
      setError("");
      loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      setLoading(true);
      try {
        await roomApi.deleteRoom(roomId);
        loadRooms();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete room");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddPurpose = () => {
    if (purposeInput.trim() && !formData.allowed_purposes.includes(purposeInput)) {
      setFormData((prev) => ({
        ...prev,
        allowed_purposes: [...prev.allowed_purposes, purposeInput],
      }));
      setPurposeInput("");
    }
  };

  const handleRemovePurpose = (purpose: string) => {
    setFormData((prev) => ({
      ...prev,
      allowed_purposes: prev.allowed_purposes.filter((p) => p !== purpose),
    }));
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError("Please enter a search value");
      return;
    }

    setLoading(true);
    try {
      let results;
      if (searchType === "capacity") {
        const capacity = parseInt(searchValue);
        if (isNaN(capacity) || capacity <= 0) {
          setError("Please enter a valid capacity number");
          return;
        }
        results = await roomApi.searchByCapacity(capacity);
      } else {
        results = await roomApi.searchByLocation(searchValue);
      }
      setRooms(results);
      setOpenSearchDialog(false);
      setSearchValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Ambiente Management
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              New Room
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => setOpenSearchDialog(true)}
          >
            Search
          </Button>
        </Stack>

        {loading && <CircularProgress />}

        {!loading && rooms.length > 0 && (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>Room ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">Capacity</TableCell>
                    <TableCell>Accessibility</TableCell>
                    <TableCell>Purposes</TableCell>
                    {isAdmin && <TableCell align="center">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{room.room_id}</TableCell>
                      <TableCell>{room.room_type}</TableCell>
                      <TableCell>{room.location}</TableCell>
                      <TableCell align="right">{room.capacity}</TableCell>
                      <TableCell>
                        {room.accessibility ? (
                          <Chip label="Yes" color="success" size="small" />
                        ) : (
                          <Chip label="No" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {room.allowed_purposes.map((purpose) => (
                            <Chip key={purpose} label={purpose} size="small" />
                          ))}
                        </Stack>
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={Math.ceil(rooms.length / itemsPerPage)}
                page={currentPage}
                onChange={(_, page) => loadRooms(page)}
              />
            </Box>
          </>
        )}

        {!loading && rooms.length === 0 && (
          <Alert severity="info">No rooms found</Alert>
        )}
      </Box>

      {/* Create Room Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Room ID"
            value={formData.room_id}
            onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
            fullWidth
            placeholder="e.g., SALA001"
          />
          <TextField
            label="Room Type"
            value={formData.room_type}
            onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
            fullWidth
            placeholder="e.g., Classroom, Lab, Conference Room"
          />
          <TextField
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            fullWidth
            placeholder="e.g., Building A, 3rd Floor"
          />
          <TextField
            label="Capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
            fullWidth
            inputProps={{ min: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Accessibility</InputLabel>
            <Select
              value={formData.accessibility.toString()}
              onChange={(e) => setFormData({ ...formData, accessibility: e.target.value === "true" })}
              label="Accessibility"
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Allowed Purposes
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                label="Add purpose"
                value={purposeInput}
                onChange={(e) => setPurposeInput(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Teaching, Studying"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddPurpose();
                  }
                }}
              />
              <Button variant="outlined" onClick={handleAddPurpose}>
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {formData.allowed_purposes.map((purpose) => (
                <Chip
                  key={purpose}
                  label={purpose}
                  onDelete={() => handleRemovePurpose(purpose)}
                />
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRoom} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={openSearchDialog} onClose={() => setOpenSearchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Search Rooms</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Search Type</InputLabel>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "capacity" | "location")}
              label="Search Type"
            >
              <MenuItem value="capacity">by Capacity</MenuItem>
              <MenuItem value="location">by Location</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={searchType === "capacity" ? "Minimum Capacity" : "Location"}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            fullWidth
            type={searchType === "capacity" ? "number" : "text"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSearchDialog(false)}>Cancel</Button>
          <Button onClick={handleSearch} variant="contained">
            Search
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
