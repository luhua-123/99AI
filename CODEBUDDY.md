# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Structure

99AI is a commercial AI platform with three main components:

### Service (Backend)
- **Tech Stack**: NestJS with TypeORM
- **Location**: `service/`
- **Database**: MySQL with TypeORM
- **Cache**: Redis
- **Default Port**: 9520

### Chat (Frontend - User Interface)
- **Tech Stack**: Vue 3 + Vite + Pinia
- **Location**: `chat/`
- **Dev Port**: 9002
- **Features**: AI chat interface, markdown editor, code highlighting, charts (Mermaid/Markmap)

### Admin (Frontend - Management)
- **Tech Stack**: Vue 3 + Vite + Element Plus (based on Fantastic Admin)
- **Location**: `admin/`
- **Dev Port**: 9000
- **Features**: User management, model configuration, statistics, payment management

## Development Commands

### Full Build
Build all modules:
```bash
./build.sh
```
This script builds all three components and copies them to `AIWebQuickDeploy/`.

### Service (Backend)
Located in `service/` directory:
- `pnpm dev` - Start development server with watch mode
- `pnpm build` - Build for production (runs format first)
- `pnpm build:test` - Build without formatting
- `pnpm test` - Run Jest tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Run tests with coverage
- `pnpm format` - Format code with Prettier
- `pnpm start` - Start with PM2
- `pnpm start:debug` - Start with debug mode

### Chat (Frontend)
Located in `chat/` directory:
- `pnpm dev` - Start Vite dev server on port 9002
- `pnpm build` - Production build
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format all code
- `pnpm all` - Run both backend (service) and frontend (chat) in parallel

### Admin (Frontend)
Located in `admin/` directory:
- `pnpm dev` - Start Vite dev server on port 9000
- `pnpm build` - Production build
- `pnpm build:test` - Build for test environment
- `pnpm lint` - Run TypeScript type checking
- `pnpm format` - Format all code

## Architecture Overview

### Backend Module Structure (service/src/modules/)
The backend follows NestJS modular architecture with these key modules:

- **auth**: JWT authentication, login/register, password management
- **chat**: Core chat processing, AI model integration, message handling
- **chatLog**: Chat history and conversation logging
- **chatGroup**: Group conversation management
- **user**: User management, profiles, status control
- **userBalance**: Balance, billing, credit system
- **models**: AI model configuration and management
- **app**: Custom application presets and categories
- **crami**: Package/coupon code system
- **pay**: Payment integration (WeChat Pay, etc.)
- **order**: Order management
- **upload**: File upload handling
- **globalConfig**: System configuration management
- **statistic**: Usage statistics and analytics
- **badWords**: Content filtering and violation detection
- **autoReply**: Auto-reply configuration
- **verification**: SMS/email verification
- **official**: WeChat Official Account integration
- **plugin**: Plugin system
- **redisCache**: Redis caching layer
- **rateLimit**: Rate limiting middleware
- **signin**: Daily check-in system
- **share**: Share link functionality
- **spa**: Single page application routes

### Key Backend Patterns

**Module Structure**: Each module typically contains:
- `{name}.module.ts` - Module definition
- `{name}.controller.ts` - REST API endpoints
- `{name}.service.ts` - Business logic
- `{name}.entity.ts` - TypeORM database entity
- `dto/` - Data transfer objects with validation

**Authentication Flow**:
- JWT-based authentication via `jwtAuth.guard.ts`
- Super admin access via `superAuth.guard.ts`
- Admin access via `adminAuth.guard.ts`

**API Response Format**:
All APIs follow standard response format with `code`, `data`, `success`, `message` fields (defined in `src/common/result/index.ts`)

### Frontend Architecture

**Chat Frontend (chat/src/)**:
- **Store**: Pinia stores in `store/modules/` (chat, auth, settings, prompt, app, global, users)
- **Views**: Main views in `views/chat/`
- **Components**: Reusable UI components
- **API**: API service layer in `api/`
- **Utils**: Utility functions in `utils/`

**Admin Frontend (admin/src/)**:
- **Store**: Pinia stores in `store/modules/` (user, menu, route, settings, tabbar, keepAlive)
- **Router**: Route configuration in `router/` with modular menus
- **API**: API service layer in `api/modules/`
- **Composables**: Reusable Vue composition functions in `utils/composables/`

**Build Output**:
- Admin builds to `admin/dist/`
- Chat builds to `chat/dist/`
- Service builds to `service/dist/`
- All deployed to `AIWebQuickDeploy/` via build script

### Database Schema

The database uses TypeORM entities defined in each module's `{module}.entity.ts` files. Key entities include:
- User, UserBalance, Balance, AccountLog (user management)
- ChatLog, ChatGroup (conversations)
- Models (AI model configurations)
- App, AppCats, UserApps (applications)
- Crami, CramiPackage (billing system)
- Order, Pay (transactions)
- Config (system configuration)

Database initialization is handled by `service/src/modules/database/initDatabase.ts` which creates tables automatically on startup.

### Integration Points

**AI Model Integration**:
- Supports multiple AI providers (OpenAI, Google, etc.)
- LangChain integration for advanced features
- Streaming response handling
- Token counting and usage tracking

**File Handling**:
- Multiple storage backends (Aliyun OSS, AWS S3, Tencent COS, local)
- File upload handling in `upload` module
- Supported formats: images, documents (PDF, Word, Excel, PPT)

**Payment System**:
- WeChat Pay integration
- Package/code system (Crami)
- Balance/credit management
- Order tracking

**Content Processing**:
- Markdown rendering with math (KaTeX)
- Code syntax highlighting (Highlight.js)
- Chart generation (Mermaid, Markmap)
- Document parsing (PDF, Word, Excel, PPT)

## Environment Configuration

**Service**: `.env` file in `service/` directory with:
- Database connection (MySQL)
- Redis connection
- JWT secret (auto-generated if not in Redis)
- API keys for AI services
- Payment credentials
- Storage configuration

**Frontends**: Environment variables prefixed with `VITE_`:
- `VITE_APP_API_BASE_URL` - Backend API URL
- `VITE_BASE_PATH` - Base path for deployment

## Important Notes

- The project uses pnpm as the package manager
- All code formatting is done with Prettier (run `pnpm format` before builds)
- Type checking is available for frontends via vue-tsc
- Swagger API documentation is available at `/api-docs` when `ISDEV=true`
- The backend serves static files for both frontends:
  - Chat at `/` (root)
  - Admin at `/admin`
  - Uploads at `/file`
- Streaming chat responses are handled via `/api/chatgpt/chat-process` endpoint
- Rate limiting is implemented as a middleware
- Bad words filtering and content moderation are built-in
