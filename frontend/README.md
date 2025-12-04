# Stores Management Frontend

A modern React frontend for the Stores REST API.

## Features

- 🔐 User authentication (Login, Register, Logout)
- 🏪 Store management (Create, View, Delete)
- 📦 Item management (Create, Read, Update, Delete)
- 🏷️ Tag management and linking to items
- 🎨 Modern, responsive UI
- 🔄 Automatic token refresh

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional):
```
VITE_API_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## API Configuration

By default, the frontend expects the backend API to be running at `http://localhost:5000`. You can change this by setting the `VITE_API_URL` environment variable.

## Features Overview

### Authentication
- Register new users
- Login with username and password
- Automatic token refresh
- Protected routes

### Stores
- View all stores
- Create new stores
- Delete stores (cascades to items and tags)

### Items
- View all items with their store and tags
- Create new items (requires authentication)
- Update existing items
- Delete items (requires admin privileges)

### Tags
- View tags by store
- Create tags for stores
- Link/unlink tags to/from items
- Delete tags (only if not linked to items)

