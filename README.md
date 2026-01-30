# Looker MCP Server

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-blue)](https://primrose.dev/mcp/looker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for integrating with Looker, the enterprise data platform. This server enables AI assistants to run queries, access dashboards, and manage content through Looker's API.

## Features

- **Look Management** - Create, run, and manage saved Looks
- **Dashboard Management** - Access and manage dashboards
- **Query Execution** - Run inline and saved queries
- **Folder Management** - Organize content in folders
- **User Management** - Access user information
- **Scheduled Plan Management** - Manage scheduled deliveries

## Quick Start

The easiest way to get started is using the [Primrose SDK](https://github.com/primrose-ai/primrose-mcp):

```bash
npm install primrose-mcp
```

```typescript
import { PrimroseClient } from 'primrose-mcp';

const client = new PrimroseClient({
  service: 'looker',
  headers: {
    'X-Looker-Base-URL': 'https://company.looker.com',
    'X-Looker-Client-ID': 'your-client-id',
    'X-Looker-Client-Secret': 'your-client-secret'
  }
});
```

## Manual Installation

```bash
# Clone and install
git clone https://github.com/primrose-ai/primrose-mcp-looker.git
cd primrose-mcp-looker
npm install

# Build
npm run build

# Run locally
npm run dev
```

## Configuration

### Required Headers

| Header | Description |
|--------|-------------|
| `X-Looker-Base-URL` | Looker instance URL (e.g., https://company.looker.com) |
| `X-Looker-Client-ID` | OAuth client ID |
| `X-Looker-Client-Secret` | OAuth client secret |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-Looker-Access-Token` | Pre-authenticated access token (skips OAuth) |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHARACTER_LIMIT` | 50000 | Maximum response character limit |
| `DEFAULT_PAGE_SIZE` | 20 | Default pagination size |
| `MAX_PAGE_SIZE` | 100 | Maximum pagination size |

## Available Tools

### Look Tools
- List Looks
- Get Look details
- Run a Look
- Create Looks
- Update Looks
- Delete Looks

### Dashboard Tools
- List dashboards
- Get dashboard details
- Access dashboard elements
- Run dashboard queries

### Query Tools
- Run inline queries
- Create saved queries
- Get query results
- Manage query slugs

### Folder Tools
- List folders
- Get folder contents
- Create folders
- Move content

### User Tools
- Get current user
- List users
- Search users
- Get user credentials

### Scheduled Plan Tools
- List scheduled plans
- Create scheduled plans
- Update schedules
- Delete schedules

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run type checking
npm run typecheck
```

## Related Resources

- [Primrose SDK Documentation](https://primrose.dev/docs)
- [Looker API Documentation](https://cloud.google.com/looker/docs/reference/looker-api)
- [Looker Developer Portal](https://developers.looker.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

MIT
