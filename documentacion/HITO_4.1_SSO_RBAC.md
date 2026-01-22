# Hito 4.1: SSO/SAML & RBAC

## Resumen
Sistema de identidad empresarial con Single Sign-On y control de acceso basado en roles.

## Gate
> RBAC policies enforced per sub-graph.

## Status: 🔄 PENDING

## Diseño Técnico Propuesto

### 1. SSO/SAML Integration

```yaml
Proveedores Soportados:
  - Okta
  - Azure AD
  - Google Workspace
  - OneLogin
  
Flujo de Autenticación:
  1. Usuario solicita acceso a WorkGraph
  2. Redirect a IdP (Identity Provider)
  3. IdP autentica y devuelve SAML assertion
  4. Supabase valida JWT y crea sesión
```

### 2. RBAC Schema

```sql
-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- 'admin', 'editor', 'viewer'
    permissions JSONB NOT NULL DEFAULT '[]'
);

-- User Roles
CREATE TABLE user_roles (
    user_id UUID REFERENCES auth.users(id),
    role_id UUID REFERENCES roles(id),
    project_id UUID REFERENCES projects(id),
    PRIMARY KEY (user_id, role_id, project_id)
);
```

### 3. Permission Matrix

| Role | Create Node | Edit Node | Delete Node | Manage Users | Export |
|------|-------------|-----------|-------------|--------------|--------|
| `viewer` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `editor` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `owner` | ✅ | ✅ | ✅ | ✅ | ✅ |

### 4. RLS Policies

```sql
CREATE POLICY "Users can access nodes based on role"
ON work_nodes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND ur.project_id = work_nodes.project_id
        AND r.permissions ? 'read'
    )
);
```

### 5. UI Components

- **Settings > Team**: Invitar usuarios con roles
- **Node Context Menu**: Mostrar permisos del usuario actual
- **Read-Only Mode**: Para viewers, sin controles de edición

## Tasks
- [ ] Setup SAML provider in Supabase Auth
- [ ] Implement roles and user_roles tables
- [ ] Create RLS policies for role-based access
- [ ] Build Team Management UI
- [ ] Implement permission checking middleware

## Evidence Nodes (Pending)
- `supabase/migrations/gate10_rbac.sql`
- `src/lib/auth/rbac.ts`
- `src/components/settings/TeamSettings.tsx`
