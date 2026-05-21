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

export type ResourceAttachment = "FIXED" | "MOBILE";

export interface Resource {
  id: number;
  name: string;
  type: string;
  category: string;
  attachment_type: ResourceAttachment;
  environment_id: number | null;
  active: boolean;
}

export interface ResourceCreate {
  name: string;
  type: string;
  category: string;
  attachment_type: ResourceAttachment;
  environment_id?: number | null;
}

export interface ResourceUpdate {
  name?: string;
  type?: string;
  category?: string;
  attachment_type?: ResourceAttachment;
  environment_id?: number | null;
  active?: boolean;
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
  active: boolean;
  roles: string[];
}

export interface UserUpdate {
  name?: string;
  email?: string;
  active?: boolean;
  roles?: string[];
}

export interface UserRolesUpdate {
  roles: string[];
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  active?: boolean;
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
        active: data.active ?? true,
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

// Organizational Units

export interface OrganizationalUnit {
  id: number;
  name: string;
  type: string;
}

export interface OrganizationalUnitCreate {
  name: string;
  type: string;
}

export const organizationalUnitApi = {
  async getAll(skip = 0, limit = 100): Promise<OrganizationalUnit[]> {
    const response = await fetch(
      `${API_BASE_URL}/organizational-units?skip=${skip}&limit=${limit}`,
      { method: "GET", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar unidades organizacionais");
      throw new Error(detail);
    }
    return response.json() as Promise<OrganizationalUnit[]>;
  },

  async getById(id: number): Promise<OrganizationalUnit> {
    const response = await fetch(`${API_BASE_URL}/organizational-units/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar unidade organizacional");
      throw new Error(detail);
    }
    return response.json() as Promise<OrganizationalUnit>;
  },

  async create(data: OrganizationalUnitCreate): Promise<OrganizationalUnit> {
    const response = await fetch(`${API_BASE_URL}/organizational-units`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao criar unidade organizacional");
      throw new Error(detail);
    }
    return response.json() as Promise<OrganizationalUnit>;
  },

  async update(id: number, data: Partial<OrganizationalUnitCreate>): Promise<OrganizationalUnit> {
    const response = await fetch(`${API_BASE_URL}/organizational-units/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao atualizar unidade organizacional");
      throw new Error(detail);
    }
    return response.json() as Promise<OrganizationalUnit>;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/organizational-units/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao excluir unidade organizacional");
      throw new Error(detail);
    }
  },
};

// Qualifications

export interface Qualification {
  id: number;
  name: string;
  description: string;
}

export interface QualificationCreate {
  name: string;
  description: string;
}

export interface UserQualification {
  id: number;
  user_id: number;
  qualification_id: number;
  valid_until: string;
}

export interface UserQualificationCreate {
  user_id: number;
  qualification_id: number;
  valid_until: string;
}

export const qualificationApi = {
  async getAll(skip = 0, limit = 100): Promise<Qualification[]> {
    const response = await fetch(
      `${API_BASE_URL}/qualifications?skip=${skip}&limit=${limit}`,
      { method: "GET", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar qualificações");
      throw new Error(detail);
    }
    return response.json() as Promise<Qualification[]>;
  },

  async getById(id: number): Promise<Qualification> {
    const response = await fetch(`${API_BASE_URL}/qualifications/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar qualificação");
      throw new Error(detail);
    }
    return response.json() as Promise<Qualification>;
  },

  async create(data: QualificationCreate): Promise<Qualification> {
    const response = await fetch(`${API_BASE_URL}/qualifications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao criar qualificação");
      throw new Error(detail);
    }
    return response.json() as Promise<Qualification>;
  },

  async update(id: number, data: Partial<QualificationCreate>): Promise<Qualification> {
    const response = await fetch(`${API_BASE_URL}/qualifications/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao atualizar qualificação");
      throw new Error(detail);
    }
    return response.json() as Promise<Qualification>;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/qualifications/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao excluir qualificação");
      throw new Error(detail);
    }
  },

  async listUserQualifications(userId: number): Promise<UserQualification[]> {
    const response = await fetch(`${API_BASE_URL}/qualifications/users/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao buscar qualificações do usuário");
      throw new Error(detail);
    }
    return response.json() as Promise<UserQualification[]>;
  },

  async assignToUser(data: UserQualificationCreate): Promise<UserQualification> {
    const response = await fetch(`${API_BASE_URL}/qualifications/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao atribuir qualificação");
      throw new Error(detail);
    }
    return response.json() as Promise<UserQualification>;
  },

  async removeFromUser(userQualificationId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/qualifications/users/${userQualificationId}`,
      { method: "DELETE", headers: getAuthHeaders() }
    );
    if (!response.ok) {
      const detail = await parseErrorDetail(response, "Falha ao remover qualificação");
      throw new Error(detail);
    }
  },
};

// ========== Reservas ==========

export type ReservationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "PRE_BLOCKED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "IN_USE"
  | "COMPLETED"
  | "NO_SHOW"
  | "EXPIRED";

export type ReservationType =
  | "SIMPLE"
  | "RECURRING"
  | "COMPOSITE_PARENT"
  | "COMPOSITE_CHILD";

export type SupportType =
  | "IT_SUPPORT"
  | "AUDIOVISUAL"
  | "LAB_TECHNICIAN"
  | "SECURITY"
  | "CLEANING";

export interface ReservationResourceRead {
  id: number;
  resource_id: number;
}

export interface ReservationSupportRead {
  id: number;
  support_type: SupportType;
  responsible_staff_id: number | null;
}

export interface Reservation {
  id: number;
  environment_id: number;
  requester_id: number;
  responsible_id: number;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  type: ReservationType;
  purpose: string;
  participant_count: number;
  checkin_at: string | null;
  checkout_at: string | null;
  resources: ReservationResourceRead[];
  support: ReservationSupportRead[];
}

export interface ReservationResourceCreate {
  resource_id: number;
}

export interface ReservationSupportCreate {
  support_type: SupportType;
  responsible_staff_id?: number | null;
}

export interface ReservationCreate {
  environment_id: number;
  requester_id: number;
  responsible_id: number;
  start_time: string;
  end_time: string;
  purpose: string;
  participant_count: number;
  type?: ReservationType;
  resources?: ReservationResourceCreate[];
  support?: ReservationSupportCreate[];
}

export interface ReservationUpdate {
  environment_id?: number;
  responsible_id?: number;
  start_time?: string;
  end_time?: string;
  purpose?: string;
  participant_count?: number;
  resources?: ReservationResourceCreate[];
  support?: ReservationSupportCreate[];
}

export interface ReservationConflictDetail {
  type: string;
  detail: string;
}

export class ReservationConflictError extends Error {
  conflicts: ReservationConflictDetail[];
  constructor(message: string, conflicts: ReservationConflictDetail[]) {
    super(message);
    this.name = "ReservationConflictError";
    this.conflicts = conflicts;
  }
}

const parseReservationError = async (
  response: Response,
  fallbackMessage: string
): Promise<string> => {
  if (response.status === 401) {
    clearAuthTokens();
    return "Sua sessão expirou. Faça login novamente.";
  }
  try {
    const body = (await response.json()) as { detail: unknown };
    if (
      response.status === 409 &&
      body.detail &&
      typeof body.detail === "object"
    ) {
      const detail = body.detail as {
        message?: string;
        conflicts?: ReservationConflictDetail[];
      };
      throw new ReservationConflictError(
        detail.message || "Conflito detectado",
        detail.conflicts ?? []
      );
    }
    if (typeof body.detail === "string") {
      return body.detail;
    }
    return fallbackMessage;
  } catch (err) {
    if (err instanceof ReservationConflictError) {
      throw err;
    }
    return fallbackMessage;
  }
};

export interface ReservationDecisionInput {
  comments?: string;
}

export interface ReservationListParams {
  skip?: number;
  limit?: number;
  environment_id?: number;
  requester_id?: number;
  status_filter?: ReservationStatus;
  start_after?: string;
  end_before?: string;
}

const buildQuery = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export const reservationApi = {
  async list(params: ReservationListParams = {}): Promise<Reservation[]> {
    const response = await fetch(
      `${API_BASE_URL}/reservas${buildQuery(params as Record<string, unknown>)}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao listar reservas"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation[]>;
  },

  async getById(id: number): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao buscar reserva"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation>;
  },

  async create(data: ReservationCreate): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao criar reserva"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation>;
  },

  async update(id: number, data: ReservationUpdate): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao atualizar reserva"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation>;
  },

  async cancel(id: number, reason: string): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}/cancelar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao cancelar reserva"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation>;
  },

  async listPending(skip = 0, limit = 100): Promise<Reservation[]> {
    const response = await fetch(
      `${API_BASE_URL}/reservas/pendentes/lista?skip=${skip}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao listar reservas pendentes"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation[]>;
  },

  async approve(id: number, comments?: string): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}/aprovar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ comments } satisfies ReservationDecisionInput),
    });
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao aprovar reserva"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation>;
  },

  async reject(id: number, comments: string): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}/rejeitar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ comments } satisfies ReservationDecisionInput),
    });
    if (!response.ok) {
      const detail = await parseReservationError(
        response,
        "Falha ao rejeitar reserva"
      );
      throw new Error(detail);
    }
    return response.json() as Promise<Reservation>;
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
