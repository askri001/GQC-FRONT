# Requirements Document

## Introduction

This document defines the requirements for a fully functional Role-Based Authentication and Access Control (RBAC) system for the GAC (Gestion des Affaires Contentieuses) application — a Legal/Contentious Affairs Management System operated by BNA (Banque Nationale Agricole).

The system must allow users to authenticate with a username and password, receive a JWT, and be granted access to only the pages and API resources that correspond to their assigned role. Three roles exist: ADMIN, RESPONSABLE, and CHARGEDOSSIER. The current implementation has several broken contracts between the frontend and backend (wrong token field name, non-existent refresh/logout endpoints, missing routes, inconsistent role name strings) that must be corrected as part of this feature.

**Scope decisions:**
- Public self-registration (`POST /api/auth/register`) is out of scope. User creation is an ADMIN-only operation via the user management page.
- CHARGEDOSSIER is blocked from `/clients`, `/affaires`, and `/avocats`.
- Dashboard access follows the backend exactly: ADMIN and RESPONSABLE only.
- Minimal backend fixes are included: only field additions and logic corrections — no refactoring, no architecture changes, no schema changes.

---

## Glossary

- **AuthService**: The Angular service responsible for login, logout, token storage, and exposing the current user's identity and roles.
- **JwtInterceptor**: The Angular HTTP interceptor that attaches the Bearer token to every outgoing request and handles 401 responses.
- **RoleGuard**: The Angular route guard that checks whether the authenticated user holds a role required by a route's `data.roles` configuration.
- **AuthGuard**: The Angular route guard that checks whether a user is authenticated at all before allowing access to protected routes.
- **LoginComponent**: The Angular component that presents the login form and triggers the authentication flow.
- **SidebarComponent**: The Angular component that renders the navigation menu, filtering items by the current user's role.
- **Backend**: The Spring Boot 3.3.5 application exposing the REST API at `http://localhost:8080/api`.
- **JWT**: A JSON Web Token issued by the Backend upon successful login, containing the `sub` (username) and `roles` claims.
- **ADMIN**: The role with full access to all modules, including user and role management.
- **RESPONSABLE**: The role with access to dashboard, dossiers, risques, garanties, missions, clients, and affaires.
- **CHARGEDOSSIER**: The role with access to dossiers, missions, clients, and affaires.
- **Primary Role**: The single highest-priority role assigned to a user, determined by the order ADMIN > RESPONSABLE > CHARGEDOSSIER.
- **Token Field**: The JSON field name in the login response body that carries the JWT string. The Backend returns `token`; the Frontend must read `token`.
- **Unauthorized Page**: A dedicated Angular route (`/unauthorized`) that informs the user they lack permission to access a resource.

---

## Requirements

### Requirement 1: User Authentication via Login Form

**User Story:** As a BNA employee, I want to log in with my username and password, so that I can access the GAC application with the privileges assigned to my role.

#### Acceptance Criteria

1. WHEN a user submits valid credentials on the login form, THE LoginComponent SHALL call `POST /api/auth/login` with `{ username, password }` and receive a response containing the field `token`.
2. WHEN the Backend returns a response with a `token` field, THE AuthService SHALL store the JWT in `localStorage` under the key `access_token`.
3. WHEN the JWT is stored, THE AuthService SHALL decode the JWT payload to extract the `sub` claim as the username and the `roles` claim as the list of role names, and persist the resulting user object in `localStorage` under the key `auth_user`.
4. WHEN login succeeds and the user's Primary Role is `ROLE_ADMIN`, THE LoginComponent SHALL navigate to `/dashboard`.
5. WHEN login succeeds and the user's Primary Role is `ROLE_RESPONSABLE`, THE LoginComponent SHALL navigate to `/dashboard`.
6. WHEN login succeeds and the user's Primary Role is `ROLE_CHARGEDOSSIER`, THE LoginComponent SHALL navigate to `/dossiers`.
7. IF the Backend returns an HTTP 401 or 403 response to the login request, THEN THE LoginComponent SHALL display the error message "Identifiants invalides" to the user without navigating away.
8. IF the Backend returns any non-2xx response to the login request, THEN THE LoginComponent SHALL display a user-readable error message and remain on the login page.
9. THE AuthService SHALL expose an `isAuthenticated` signal that returns `true` when a valid JWT exists in `localStorage` and `false` otherwise.
10. WHEN the application initialises and a JWT and user object are present in `localStorage`, THE AuthService SHALL restore the authenticated session without requiring the user to log in again.

---

### Requirement 2: JWT Transport via HTTP Interceptor

**User Story:** As a BNA employee, I want my session token to be automatically attached to every API request, so that I do not have to manually manage authentication headers.

#### Acceptance Criteria

1. WHEN an authenticated user makes any HTTP request to the Backend that does not target `/api/auth/**`, THE JwtInterceptor SHALL attach the header `Authorization: Bearer <token>` to the request.
2. WHILE a valid JWT is present in `localStorage`, THE JwtInterceptor SHALL include it in every outgoing non-auth request.
3. IF the Backend returns HTTP 401 for a protected request and no refresh-token endpoint is available, THEN THE JwtInterceptor SHALL call `AuthService.logout()` and redirect the user to `/login` instead of attempting a token refresh.
4. THE JwtInterceptor SHALL NOT attach an `Authorization` header to requests targeting `/api/auth/login`.

---

### Requirement 3: Role-Based Route Protection

**User Story:** As a system administrator, I want routes to be protected by role, so that users can only navigate to pages they are authorised to access.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access any route other than `/login`, THE AuthGuard SHALL redirect the user to `/login`.
2. WHEN an authenticated user attempts to access a route whose `data.roles` list does not include any of the user's roles, THE RoleGuard SHALL redirect the user to `/unauthorized`.
3. THE route `/users` SHALL require the role `ROLE_ADMIN`.
4. THE route `/roles` SHALL require the role `ROLE_ADMIN`.
5. THE route `/prestataires` SHALL require the role `ROLE_ADMIN`.
6. THE route `/factures` SHALL require the role `ROLE_ADMIN`.
7. THE route `/dashboard` SHALL require the role `ROLE_ADMIN` or `ROLE_RESPONSABLE`.
8. THE route `/dossiers` SHALL require the role `ROLE_ADMIN`, `ROLE_RESPONSABLE`, or `ROLE_CHARGEDOSSIER`.
9. THE route `/risques` SHALL require the role `ROLE_ADMIN` or `ROLE_RESPONSABLE`.
10. THE route `/garanties` SHALL require the role `ROLE_ADMIN` or `ROLE_RESPONSABLE`.
11. THE route `/missions` SHALL require the role `ROLE_ADMIN`, `ROLE_RESPONSABLE`, or `ROLE_CHARGEDOSSIER`.
12. THE route `/clients` SHALL require the role `ROLE_ADMIN` or `ROLE_RESPONSABLE`.
13. THE route `/affaires` SHALL require the role `ROLE_ADMIN` or `ROLE_RESPONSABLE`.
14. THE route `/avocats` SHALL require the role `ROLE_ADMIN` or `ROLE_RESPONSABLE`.
15. WHEN an authenticated user navigates to `/`, THE Router SHALL redirect the user to `/dashboard` if the user holds `ROLE_ADMIN` or `ROLE_RESPONSABLE`, or to `/dossiers` if the user holds `ROLE_CHARGEDOSSIER`.

---

### Requirement 4: Role-Consistent Navigation Sidebar

**User Story:** As a BNA employee, I want the navigation menu to show only the pages I am allowed to access, so that I am not confused by links that would be blocked.

#### Acceptance Criteria

1. WHILE the user is authenticated as `ROLE_ADMIN`, THE SidebarComponent SHALL display navigation items for: Dashboard, Utilisateurs, Rôles & Permissions, Clients, Dossiers, Risques, Garanties, Affaires, Prestataires, Avocats, Missions, and Factures.
2. WHILE the user is authenticated as `ROLE_RESPONSABLE`, THE SidebarComponent SHALL display navigation items for: Dashboard, Clients, Dossiers, Risques, Garanties, Affaires, Avocats, and Missions.
3. WHILE the user is authenticated as `ROLE_CHARGEDOSSIER`, THE SidebarComponent SHALL display navigation items for: Dossiers and Missions only.
4. THE SidebarComponent SHALL use the role strings `ROLE_ADMIN`, `ROLE_RESPONSABLE`, and `ROLE_CHARGEDOSSIER` consistently when filtering navigation items, matching the strings stored in the JWT `roles` claim.
5. WHEN the user's roles change (e.g., after re-login), THE SidebarComponent SHALL re-evaluate the filtered navigation items without requiring a full page reload.

---

### Requirement 5: Role Name Consistency Across Frontend and Backend

**User Story:** As a developer, I want role name strings to be consistent between the backend JWT, the frontend guards, and the sidebar, so that access control works correctly end-to-end.

#### Acceptance Criteria

1. THE Backend JwtUtil SHALL embed role names in the JWT `roles` claim without the `ROLE_` prefix (e.g., `["ADMIN", "RESPONSABLE", "CHARGEDOSSIER"]`).
2. THE AuthService SHALL prepend `ROLE_` to each role name extracted from the JWT before storing and exposing them, producing `ROLE_ADMIN`, `ROLE_RESPONSABLE`, and `ROLE_CHARGEDOSSIER`.
3. THE RoleGuard, AuthGuard, SidebarComponent, and route `data.roles` arrays SHALL all use the prefixed form `ROLE_ADMIN`, `ROLE_RESPONSABLE`, and `ROLE_CHARGEDOSSIER`.
4. THE AuthService `getPrimaryRole()` method SHALL evaluate roles in the priority order `ROLE_ADMIN` > `ROLE_RESPONSABLE` > `ROLE_CHARGEDOSSIER` and return the highest-priority role the user holds.
5. THE `AuthResponse` model in the Frontend SHALL declare the token field as `token` (not `accessToken`) to match the Backend `AuthResponseDTO` field name.

---

### Requirement 6: Logout and Session Termination

**User Story:** As a BNA employee, I want to log out of the application, so that my session is cleared and no one else can access my account from the same browser.

#### Acceptance Criteria

1. WHEN the user triggers logout, THE AuthService SHALL remove the `access_token` and `auth_user` entries from `localStorage`.
2. WHEN the user triggers logout, THE AuthService SHALL set the `isAuthenticated` signal to `false` and the `currentUser` signal to `null`.
3. WHEN the user triggers logout, THE AuthService SHALL navigate the user to `/login`.
4. THE AuthService SHALL NOT call any backend logout endpoint, because no such endpoint exists on the Backend.
5. WHEN the user navigates to any protected route after logout, THE AuthGuard SHALL redirect the user to `/login`.

---

### Requirement 7: Unauthorized Access Page

**User Story:** As a BNA employee, I want to see a clear message when I try to access a page I am not allowed to view, so that I understand why I was redirected.

#### Acceptance Criteria

1. THE Router SHALL include a route for `/unauthorized` that loads a dedicated UnauthorizedComponent.
2. WHEN the RoleGuard blocks access to a route, THE Router SHALL navigate to `/unauthorized`.
3. THE UnauthorizedComponent SHALL display a message informing the user that they do not have permission to access the requested page.
4. THE UnauthorizedComponent SHALL provide a navigation link or button that returns the user to their role-appropriate home page (`/dashboard` for ADMIN and RESPONSABLE, `/dossiers` for CHARGEDOSSIER).

---

### Requirement 8: Backend Role Enforcement

**User Story:** As a system administrator, I want the backend API to enforce role-based access on every endpoint, so that even direct API calls cannot bypass the frontend access controls.

#### Acceptance Criteria

1. THE Backend SHALL return HTTP 403 when a user with role `ROLE_RESPONSABLE` or `ROLE_CHARGEDOSSIER` calls any endpoint under `/api/users/**`.
2. THE Backend SHALL return HTTP 403 when a user with role `ROLE_CHARGEDOSSIER` calls `GET /api/dashboard/stats`.
3. THE Backend SHALL return HTTP 403 when a user with role `ROLE_RESPONSABLE` calls `POST /api/dossiers` or `PUT /api/dossiers/{id}`.
4. THE Backend SHALL return HTTP 403 when a user with role `ROLE_CHARGEDOSSIER` calls `DELETE /api/dossiers/{id}`.
5. THE Backend SHALL return HTTP 401 when any request to a protected endpoint is made without a valid JWT.
6. WHEN the Backend returns HTTP 403, THE JwtInterceptor SHALL NOT attempt a token refresh and SHALL propagate the error to the calling component.

---

### Requirement 9: Minimal Backend Fixes for User Management

**User Story:** As an ADMIN, I want to create users with a specific role and see their full name in the user list, so that I can manage the team without needing to call multiple endpoints manually.

#### Acceptance Criteria

1. THE `UserRequestDTO` SHALL include optional fields `nom` (String) and `prenom` (String) in addition to the existing `username`, `email`, and `password` fields. No existing fields shall be removed or renamed.
2. THE `UserServiceImpl.create()` method SHALL persist `nom` and `prenom` from the request onto the `User` entity when those fields are provided.
3. THE `UserRequestDTO` SHALL include an optional `roleIds` field (List of Long) that allows the caller to specify one or more role IDs to assign to the new user.
4. WHEN `roleIds` is provided and non-empty in a `POST /api/users` request, THE `UserServiceImpl.create()` method SHALL assign those roles to the user instead of the hardcoded RESPONSABLE default.
5. WHEN `roleIds` is absent or empty in a `POST /api/users` request, THE `UserServiceImpl.create()` method SHALL fall back to assigning the RESPONSABLE role as it currently does.
6. THE `UserResponseDTO` SHALL include a `roles` field (List of role name strings) in addition to the existing `id`, `username`, and `email` fields. No existing fields shall be removed or renamed.
7. THE `UserResponseDTO` SHALL include `nom` and `prenom` fields so the frontend can display the user's full name.
8. THE `UserMapper` SHALL be updated to map `nom`, `prenom`, and `roles` between the `User` entity and the DTOs, consistent with the existing mapping style.
9. ALL changes SHALL be minimal field additions only — no refactoring of existing methods, no changes to database schema column names, no changes to existing API endpoint paths or HTTP methods.
