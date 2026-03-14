// API configuration and utilities
const API_BASE_URL = "http://localhost:8000/api/v1";

export interface RoomResourceAssignment {
  resource_id: number;
  quantity: number;
}

export interface RoomResourceItem {
  id: number;
  resource_id: number;
  resource_code: string;
  name: string;
  resource_type: string;
  quantity: number;
}

export type RoomCriticality = "common" | "controlled" | "restricted";

export interface Room {
  id: number;
  room_id: string;
  room_type: string;
  location: string;
  capacity: number;
  accessibility: boolean;
  allowed_purposes: string[];
  criticality: RoomCriticality;
  supervisor_user_id: number | null;
  type_attributes: Record<string, unknown>;
  fixed_resources: RoomResourceItem[];
  optional_resources: RoomResourceItem[];
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
  criticality: RoomCriticality;
  supervisor_user_id?: number | null;
  type_attributes: Record<string, unknown>;
  fixed_resources: RoomResourceAssignment[];
  optional_resources: RoomResourceAssignment[];
}

export interface Resource {
  id: number;
  resource_code: string;
  name: string;
  resource_type: string;
  availability_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceCreate {
  resource_code: string;
  name: string;
  resource_type: string;
  availability_notes?: string | null;
}

export interface Purpose {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurposeCreate {
  name: string;
}

export interface PurposeUpdate {
  name?: string;
  is_active?: boolean;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
}

export interface UserUpdate {
  email: string;
  is_active: boolean;
}

export interface UserRolesUpdate {
  roles: string[];
}

export interface UserCreateInput {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
}

export interface ApiError {
  detail: string;
}

const isBrowser = typeof window !== "undefined";

const getAuthHeaders = () => {
  const token = isBrowser ? localStorage.getItem("accessToken") : null;
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
      throw new Error(error.detail || "Falha ao buscar ambientes");
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
      throw new Error(error.detail || "Falha ao buscar ambiente");
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
      throw new Error(error.detail || "Falha ao criar ambiente");
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
      throw new Error(error.detail || "Falha ao atualizar ambiente");
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
      throw new Error(error.detail || "Falha ao excluir ambiente");
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
      throw new Error(error.detail || "Falha ao pesquisar ambientes por capacidade");
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
      throw new Error(error.detail || "Falha ao pesquisar ambientes por localização");
    }
    return response.json() as Promise<Room[]>;
  },
};

export const resourceApi = {
  async getAllResources(skip = 0, limit = 100, activeOnly = true) {
    const response = await fetch(
      `${API_BASE_URL}/resources?skip=${skip}&limit=${limit}&active_only=${activeOnly}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao buscar recursos");
    }
    return response.json() as Promise<Resource[]>;
  },

  async getResourceById(resourceId: number) {
    const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao buscar recurso");
    }
    return response.json() as Promise<Resource>;
  },

  async createResource(resource: ResourceCreate) {
    const response = await fetch(`${API_BASE_URL}/resources`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(resource),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao criar recurso");
    }
    return response.json() as Promise<Resource>;
  },

  async updateResource(resourceId: number, data: Partial<ResourceCreate>) {
    const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao atualizar recurso");
    }
    return response.json() as Promise<Resource>;
  },

  async deleteResource(resourceId: number) {
    const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao excluir recurso");
    }
  },
};

export const purposeApi = {
  async getAllPurposes(skip = 0, limit = 100, activeOnly = true) {
    const response = await fetch(
      `${API_BASE_URL}/purposes?skip=${skip}&limit=${limit}&active_only=${activeOnly}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao buscar finalidades");
    }
    return response.json() as Promise<Purpose[]>;
  },

  async createPurpose(purpose: PurposeCreate) {
    const response = await fetch(`${API_BASE_URL}/purposes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(purpose),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao criar finalidade");
    }
    return response.json() as Promise<Purpose>;
  },

  async getPurposeById(purposeId: number) {
    const response = await fetch(`${API_BASE_URL}/purposes/${purposeId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao buscar finalidade");
    }
    return response.json() as Promise<Purpose>;
  },

  async updatePurpose(purposeId: number, data: PurposeUpdate) {
    const response = await fetch(`${API_BASE_URL}/purposes/${purposeId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao atualizar finalidade");
    }
    return response.json() as Promise<Purpose>;
  },

  async deletePurpose(purposeId: number) {
    const response = await fetch(`${API_BASE_URL}/purposes/${purposeId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao excluir finalidade");
    }
  },
};

export const userApi = {
  async createUser(data: UserCreateInput) {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        is_active: data.is_active ?? true,
      }),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao criar usuário");
    }
    return response.json() as Promise<User>;
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao buscar usuário atual");
    }
    return response.json() as Promise<User>;
  },

  async getAllUsers(skip = 0, limit = 100) {
    const response = await fetch(
      `${API_BASE_URL}/users?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao buscar usuários");
    }
    return response.json() as Promise<User[]>;
  },

  async updateUser(userId: number, data: UserUpdate) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao atualizar usuário");
    }
    return response.json() as Promise<User>;
  },

  async updateUserRoles(userId: number, data: UserRolesUpdate) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/roles`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao atualizar perfis do usuário");
    }
    return response.json() as Promise<User>;
  },

  async deleteUser(userId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || "Falha ao excluir usuário");
    }
  },
};

export const getTokenRoles = (): string[] => {
  if (!isBrowser || typeof atob === "undefined") {
    return [];
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    return [];
  }

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) {
      return [];
    }

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as { roles?: unknown };

    return Array.isArray(payload.roles)
      ? payload.roles.filter((role): role is string => typeof role === "string")
      : [];
  } catch {
    return [];
  }
};
