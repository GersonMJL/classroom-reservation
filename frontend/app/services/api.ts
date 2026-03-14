// API configuration and utilities
const API_BASE_URL = "http://localhost:8000/api/v1";

export interface Room {
  id: number;
  room_id: string;
  room_type: string;
  location: string;
  capacity: number;
  accessibility: boolean;
  allowed_purposes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomCreate {
  room_id: string;
  room_type: string;
  location: string;
  capacity: number;
  accessibility: boolean;
  allowed_purposes: string[];
}

export interface ApiError {
  detail: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

// Room API endpoints
export const roomApi = {
  // Get all rooms
  async getAllRooms(skip = 0, limit = 100, activeOnly = true) {
    const response = await fetch(
      `${API_BASE_URL}/rooms?skip=${skip}&limit=${limit}&active_only=${activeOnly}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Failed to fetch rooms");
    }
    return response.json() as Promise<Room[]>;
  },

  // Get room by ID
  async getRoomById(roomId: number) {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Failed to fetch room");
    }
    return response.json() as Promise<Room>;
  },

  // Create new room
  async createRoom(room: RoomCreate) {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(room),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Failed to create room");
    }
    return response.json() as Promise<Room>;
  },

  // Update room
  async updateRoom(roomId: number, data: Partial<RoomCreate>) {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Failed to update room");
    }
    return response.json() as Promise<Room>;
  },

  // Delete room
  async deleteRoom(roomId: number) {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Failed to delete room");
    }
  },

  // Search by capacity
  async searchByCapacity(minCapacity: number, skip = 0, limit = 100) {
    const response = await fetch(
      `${API_BASE_URL}/rooms/search/capacity?min_capacity=${minCapacity}&skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Failed to search rooms by capacity");
    }
    return response.json() as Promise<Room[]>;
  },

  // Search by location
  async searchByLocation(location: string, skip = 0, limit = 100) {
    const response = await fetch(
      `${API_BASE_URL}/rooms/search/location?location=${encodeURIComponent(location)}&skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Failed to search rooms by location");
    }
    return response.json() as Promise<Room[]>;
  },
};
