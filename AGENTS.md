# AGENTS.md

**Repository**: 99AI - Monorepo AI Platform
**Generated**: 2026-01-19
**Structure**: Service (NestJS) + Chat (Vue 3) + Admin (Vue 3)

---

## QUICK START

### Build All Modules
```bash
./build.sh           # Builds service + chat + admin to AIWebQuickDeploy/
```

### Service (Backend - NestJS + TypeORM + MySQL)
```bash
cd service
pnpm dev             # Start dev server (port 9520)
pnpm build           # Production build (runs format first)
pnpm build:test      # Build without formatting
pnpm test            # Run Jest tests
pnpm test:watch      # Watch mode
pnpm test:cov        # With coverage
pnpm format          # Prettier format
```

### Chat (Frontend - Vue 3 + Vite + Pinia)
```bash
cd chat
pnpm dev             # Start Vite dev server (port 9002)
pnpm build           # Production build
pnpm type-check      # TypeScript type checking
pnpm format          # Format all code
pnpm all             # Run service + chat in parallel
```

### Admin (Frontend - Vue 3 + Element Plus)
```bash
cd admin
pnpm dev             # Start Vite dev server (port 9000)
pnpm build           # Production build
pnpm build:test      # Test environment build
pnpm lint            # Type checking via vue-tsc
pnpm format          # Format all code
```

---

## CODE STYLE

### Formatting (Prettier)
All modules use Prettier. Always run `pnpm format` before committing.

**Service** (`service/.prettierrc`):
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "arrowParens": "avoid",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Chat** (`chat/.prettierrc`):
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "semi": false,
  "arrowParens": "avoid",
  "printWidth": 100
}
```

**Admin** (`admin/.prettierrc`):
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "arrowParens": "always",
  "printWidth": 100
}
```

### TypeScript Configuration
**Service**: Strict mode DISABLED (strictNullChecks=false, noImplicitAny=false)
- Use decorators (`@Entity`, `@Controller`, `@Service`)
- Import order: external → internal → relative

**Frontends** (chat/admin): Type checking via `vue-tsc`
- Use Composition API (`<script setup>`)
- Auto-imports configured (Vue, Pinia, VueRouter)

### Naming Conventions
- **Variables/Functions**: `camelCase` (`getUserById`, `isLoading`)
- **Classes/Components**: `PascalCase` (`UserService`, `ChatMessage`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)
- **Files**: `kebab-case` (`user.service.ts`, `chat-base.vue`)
- **Private methods**: `_camelCase` (`_calculateTokens`, `_validateConfig`)

### Error Handling
**Service (NestJS)**:
- Use global `AllExceptionsFilter` - catches all errors
- Service methods: throw business exceptions, catch in controller
- DTO validation: `class-validator` decorators with `ValidationPipe`
- HTTP status: Use standard codes via `HttpStatus` enum

**Frontends**:
- API calls: Wrap in try-catch, show user-friendly messages
- Async operations: Use `try/finally` for cleanup

### Import Style
```typescript
// Service - standard imports
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

// Frontend - use auto-imports when available
// Don't manually import Vue composition API, Pinia, VueRouter
import { useStore } from '@/store';  // Custom store imports
```

---

## ARCHITECTURE

### Service (NestJS)
**Module Pattern**:
```
module-name/
├── module-name.module.ts    # Imports, controllers, providers
├── module-name.controller.ts # API endpoints (@Get, @Post)
├── module-name.service.ts   # Business logic
├── module-name.entity.ts    # TypeORM entity
└── dto/                     # Data transfer objects
```

**Guards**:
- `JwtAuthGuard` - Standard JWT auth
- `AdminAuthGuard` - Admin role required
- `SuperAuthGuard` - Super admin only

**Response Format** (handled by `TransformInterceptor`):
```typescript
{
  code: 200,
  data: {...},
  success: true,
  message: "请求成功"
}
```

**Database**:
- All entities extend `BaseEntity` (id, createdAt, updatedAt, deletedAt)
- Use `@InjectRepository(Entity)` for dependency injection
- Enable query caching: `cache: true` in findAndCount()

**Redis**:
- JWT secrets stored in Redis
- Rate limiting via `@RateLimit()` decorator
- Verification codes cached temporarily

### Frontends (Vue 3)
**Store** (Pinia):
- Organize by module: `store/modules/chat.ts`, `store/modules/auth.ts`
- Use composition-style stores with `defineStore()`

**Components**:
- Use `<script setup>` syntax
- Props: Define with TypeScript interfaces
- Emits: Define with `defineEmits<...>()`

**Routing**:
- File-based routing in admin (vite-plugin-pages)
- Manual router config in chat

**API Layer**:
- Centralized in `api/` or `api/modules/`
- Use axios with interceptors for auth/error handling

---

## KEY PATTERNS

### Service
- **Async/await**: Always use for DB operations
- **DTOs**: Validate input with `@IsString()`, `@IsOptional()`, etc.
- **Transactions**: Use `queryRunner` for multi-step operations
- **Logging**: Use custom logger from `common/logger/`

### Frontends
- **Reactive state**: Use `ref()` and `reactive()` for component state
- **Computed**: Use `computed()` for derived values
- **Watchers**: Use `watch()` with `{ deep: true }` for objects
- **Lifecycle**: Use `onMounted()`, `onUnmounted()`

---

## TESTING

**Service**: Jest configured but no test files currently in `src/`. Run:
```bash
pnpm test              # Run all *.spec.ts files
pnpm test -- path/to/file.spec.ts  # Run single test
```

**Frontends**: No test runner currently configured.

---

## GOTCHAS

1. **Service strict mode**: TypeScript strict checks disabled. Do not enable without extensive testing.
2. **Format before build**: Service prebuild hook runs `pnpm format`.
3. **Global prefix**: All service APIs prefixed with `/api`.
4. **Static files**: Uploads served at `/file` path.
5. **Streaming responses**: Chat endpoint (`/api/chatgpt/chat-process`) uses `@Res()` for streaming.
6. **Redis dependency**: Service requires Redis for JWT secrets and rate limiting.
7. **File paths**: Windows uses `\\` - use `path.join()` for cross-platform compatibility.
8. **Vue SFC**: Frontend components are `.vue` files with `<script>`, `<template>`, `<style>`.
9. **Element Plus**: Admin UI library - use documented components only.
10. **Monorepo**: Changes in one module may affect others (e.g., shared types).

---

## COMPLEXITY NOTES

**High-complexity files** (>500 lines):
- `service/src/modules/chat/chat.service.ts` (1088 lines)
- `chat/src/views/chat/chatBase.vue` (1677 lines)
- `chat/src/views/chat/components/Footer/index.vue` (1669 lines)

**When modifying these files**: Break down into smaller functions, extract to separate services/composables if possible.
