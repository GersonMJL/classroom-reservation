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

export type EnvironmentType =
  | "CLASSROOM"
  | "LABORATORY"
  | "AUDITORIUM"
  | "MEETING_ROOM"
  | "STUDIO"
  | "MULTIPURPOSE";

export type EnvironmentCriticality = "COMMON" | "CONTROLLED" | "RESTRICTED";

export interface Environment {
  id: number;
  name: string;
  type: EnvironmentType;
  criticality: EnvironmentCriticality;
  capacity: number;
  location_id: number;
  operating_hours: string;
  requires_approval: boolean;
}

export interface EnvironmentCreate {
  name: string;
  type: EnvironmentType;
  criticality: EnvironmentCriticality;
  capacity: number;
  location_id: number;
  operating_hours: string;
  requires_approval: boolean;
}

export type EnvironmentUpdate = Partial<EnvironmentCreate>;

export interface Location {
  id: number;
  campus: string;
  building: string;
  floor: string;
}

export type Room = Environment;
export type RoomCreate = EnvironmentCreate;
export type RoomCriticality = EnvironmentCriticality;

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
  name: string;
  is_active: boolean;
  roles: string[];
}

export interface UserUpdate {
  name?: string;
  email?: string;
  is_active?: boolean;
  roles?: string[];
}

export interface UserRolesUpdate {
  roles: string[];
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  is_active?: boolean;
  roles?: string[];
}

export interface ApiError {
  detail: string;
}

type TokenPayload = {
  exp?: unknown;
  roles?: unknown;
};

export const AUTH_LOGOUT_EVENT = "auth:logout";

const parseTokenPayload = (token: string): TokenPayload | null => {
  if (typeof atob === "undefined") {
    return null;
  }

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
};

const isAccessTokenExpired = (token: string): boolean => {
  const payload = parseTokenPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return Date.now() >= payload.exp * 1000;
};

const parseErrorDetail = async (response: Response, fallbackMessage: string) => {
  if (response.status === 401) {
    clearAuthTokens();
    return "Sua sessão expirou. Faça login novamente.";
  }

  try {
    const error = (await response.json()) as ApiError;
    return error.detail || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const isBrowser = typeof window !== "undefined";

export const clearAuthTokens = () => {
  if (!isBrowser) {
    return;
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
};

export const hasValidAccessToken = (): boolean => {
  if (!isBrowser) {
    return false;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    return false;
  }

  if (isAccessTokenExpired(token)) {
    clearAuthTokens();
    return false;
  }

  return true;
};

const getAccessToken = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }

  if (isAccessTokenExpired(token)) {
    clearAuthTokens();
    return null;
  }

  return token;
};

const getAuthHeaders = () => {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Room API endpoints
export const environmentApi = {
  async getAllRooms(skip = 0, limit = 100) {
    const response = await fetch(
      `${API_BASE_URL}/environments?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar ambientes");
      throw new Error(detail);
    }
    return response.json() as Promise<Room[]>;
  },

  async getRoomById(roomId: number) {
    const response = await fetch(`${API_BASE_URL}/environments/${roomId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar ambiente");
      throw new Error(detail);
    }
    return response.json() as Promise<Room>;
  },

  async createRoom(room: RoomCreate) {
    const response = await fetch(`${API_BASE_URL}/environments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(room),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao criar ambiente");
      throw new Error(detail);
    }
    return response.json() as Promise<Room>;
  },

  async updateRoom(roomId: number, data: Partial<RoomCreate>) {
    const response = await fetch(`${API_BASE_URL}/environments/${roomId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao atualizar ambiente");
      throw new Error(detail);
    }
    return response.json() as Promise<Room>;
  },

  async deleteRoom(roomId: number) {
    const response = await fetch(`${API_BASE_URL}/environments/${roomId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao excluir ambiente");
      throw new Error(detail);
    }
  },

  async searchByCapacity(minCapacity: number, skip = 0, limit = 100) {
    const environments = await this.getAllRooms(skip, limit);
    return environments.filter((environment) => environment.capacity >= minCapacity);
  },

  async searchByLocation(locationId: number, skip = 0, limit = 100) {
    const environments = await this.getAllRooms(skip, limit);
    return environments.filter((environment) => environment.location_id === locationId);
  },
};

export const locationApi = {
  async getAllLocations(skip = 0, limit = 100) {
    const response = await fetch(
      `${API_BASE_URL}/locations?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar localizações");
      throw new Error(detail);
    }
    return response.json() as Promise<Location[]>;
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
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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
  if (!isBrowser) {
    return [];
  }

  const token = getAccessToken();
  if (!token) {
    return [];
  }

  const payload = parseTokenPayload(token);
  if (!payload) {
    return [];
  }

  return Array.isArray(payload.roles)
    ? payload.roles.filter((role): role is string => typeof role === "string")
    : [];
};
