import { api, qs, Page } from './api';

// ── API response shape (matching UserResponse.java) ───────────────────────────
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;       // 'admin' | 'member' | 'blacklisted'
  isActive: boolean;
}

// ── Update request (matching UserUpdateRequest.java) ─────────────────────────
export interface UserUpdateRequest {
  fullName?: string;
  email?: string;
  password?: string;  // optional re-set
  isActive?: boolean;
}

// ── Filter params (all name/email based — UUID never typed by user) ───────────
export interface UserSearchParams {
  search?: string;      // free-text: matches name or email
  email?: string;
  fullName?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}

// ── User service ──────────────────────────────────────────────────────────────
export const userService = {
  /**
   * GET /user — returns paginated users.
   * Admin → all users. Member → only own profile (backend enforces this).
   */
  async list(params: UserSearchParams = {}): Promise<Page<UserResponse>> {
    const query = qs({
      search:   params.search,
      email:    params.email,
      fullName: params.fullName,
      role:     params.role,
      isActive: params.isActive,
      page:     params.page ?? 0,
      size:     params.size ?? 20,
    });
    return api.get<Page<UserResponse>>(`/user${query}`);
  },

  /**
   * Convenience: find users by display name for internal ID resolution.
   * Returns first 30 results; UUID comes from the response — never from user input.
   */
  async findByName(name: string): Promise<UserResponse[]> {
    const page = await userService.list({ search: name, size: 30 });
    return page.content;
  },

  /** GET /user?userId={id} — fetch a specific user by internal UUID */
  async getById(id: string): Promise<UserResponse | null> {
    const page = await api.get<Page<UserResponse>>(`/user?userId=${id}`);
    return page.content[0] ?? null;
  },

  /**
   * PUT /user/{id} — update profile.
   * ID is always obtained from list/search results, never typed by user.
   */
  async update(id: string, req: UserUpdateRequest): Promise<UserResponse> {
    return api.put<UserResponse>(`/user/${id}`, req);
  },

  /**
   * DELETE /user/{id} — admin soft-deactivate (sets is_active = false).
   */
  async deactivate(id: string): Promise<void> {
    return api.delete(`/user/${id}`);
  },
};
