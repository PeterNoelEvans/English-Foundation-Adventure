# English Foundation Adventure LMS - Future-Proof Architecture

## Overview
This LMS is designed for multi-organization, classroom-based learning with robust assessment, resource management, and session analytics. The architecture is future-proof, scalable, and secure, supporting multiple schools/organizations, classroom structures, assessment banks, and advanced analytics.

---

## Key Features
- **Multi-Organization Support:** Each school/organization runs in its own instance and database, ensuring true data isolation and security.
- **Classroom Structure:** Supports P1–P6, M1–M6, with up to 6 classes per level (e.g., P1/1, P1/2, ...).
- **Assessment Bank:** Teachers can create, manage, and assign assessments in a draft/unattached state.
- **Multiple Resources per Assessment:** Attach multiple files (audio, images, PDFs, etc.) to any assessment, with robust linking and ordering.
- **Session Tracking:** Reliable session analytics using heartbeat/ping, even if users forget to log out.
- **Automated Course Structure:** Quickly build course/unit/part/section hierarchies from textbook tables of contents.
- **Export/Print:** Export course structures for sharing or printing.
- **Advanced Security:** Role-based access, organization and classroom scoping, and secure authentication.

---

## Architecture Summary
- **Backend:** Node.js (Express), PostgreSQL (Prisma ORM), JWT authentication, PM2 for process management.
- **Frontend:** Modern React/Next.js (planned), API-driven, organization-specific branding.
- **Deployment:** Each organization has its own .env, database, and subdomain (e.g., pbs.yourdomain.com).

---

## Database Schema Highlights
- **Organization:** Top-level entity for each school/tenant.
- **Classroom:** Linked to organization, year level (P1/M1), and class number (1–6).
- **User:** Linked to organization and classroom, with roles (ADMIN, TEACHER, STUDENT, PARENT).
- **Subject, Unit, Part, Section:** Hierarchical course structure.
- **Assessment:** Can be unattached (draft/bank) or assigned; supports multiple resources and media files.
- **Resource:** Linked to assessments, units, parts, sections, and supports robust media linking.
- **UserSession:** Tracks login, logout, and activity with heartbeat for reliability.

---

## Migration & Deployment
- **Separate Databases:** Each org has its own DB for true isolation.
- **Automated Scripts:** For data migration, environment setup, and deployment.
- **PM2 & Nginx:** For process and subdomain management.
- **SSL:** Secure subdomains for each organization.

---

## Developer Notes
- **All queries must be scoped to organization and classroom.**
- **Assessment/subject mapping must use utility functions to avoid bugs.**
- **Session tracking uses a heartbeat endpoint and auto-expiry for reliability.**
- **Resources are always arrays, never single files.**
- **Assessment bank supports unattached/draft assessments.**
- **Course structure is hierarchical and supports automation/import.**

---

## See Also
- [backend-architecture.md](./backend-architecture.md): Full backend/API design
- [migration-plan.md](./migration-plan.md): Step-by-step migration and deployment
- [imported/](./imported/): Historical and planning documents

---

**For questions or contributions, see the migration plan and backend architecture docs, or contact the project maintainer.** 