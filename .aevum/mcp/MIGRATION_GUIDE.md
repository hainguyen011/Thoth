# MCP Server Migration Guide

## Overview
Các migrations sau đây được thêm vào để hỗ trợ MCP Server Manager trong các version mới của Aevum (v1.7.0+).

## Migration List

### 1. `mcp_server_init_v1.7` - MCP Server Initialization & Config
**Status**: Automatic (Applied on first startup)

**Purpose**: 
- Khởi tạo cấu trúc thư mục MCP Server (`.aevum/mcp/`)
- Tạo file cấu hình MCP mặc định (`.aevum/mcp.json`)

**What it does**:
- Creates `mcp.json` với cấu trúc mặc định:
  ```json
  {
    "serverUrl": "http://localhost:3344/sse",
    "port": 3344,
    "status": "inactive",
    "version": "1.7.0",
    "fallbackPorts": [3345, 3346, 3347, 3348, 3349],
    "features": {
      "resources": ["index", "memory", "persona"],
      "prompts": ["bootstrap"],
      "tools": ["aevum_mark_plan_done", "aevum_assign_plan", "aevum_sync_index"]
    }
  }
  ```

**When it runs**: 
- Lần đầu tiên extension activate với project đã có `.aevum/`

---

### 2. `mcp_resources_registry_v1.7` - MCP Resources Registry & Schema
**Status**: Automatic (Applied on first startup)

**Purpose**:
- Tạo registry of tất cả MCP Resources và Tools
- Giúp Agent biết được những resources và tools có sẵn

**What it creates** (`.aevum/mcp/resources.json`):
```json
{
  "version": "1.7.0",
  "resources": [
    {
      "id": "index",
      "uri": "aevum://context/index.json",
      "name": "Project Index",
      "description": "Project structure, domains, features, and plans",
      "mimeType": "application/json"
    },
    ...
  ],
  "prompts": [...],
  "tools": [...]
}
```

**Benefits**:
- Agent có thể discover tất cả available resources
- Dễ dàng track / update resources khi version thay đổi

---

### 3. `mcp_port_config_v1.7` - MCP Port Management & Fallback Strategy
**Status**: Automatic (Applied on first startup)

**Purpose**:
- Quản lý port allocation strategy cho MCP Server
- Hỗ trợ fallback ports khi primary port bị dùng
- Giúp tránh port conflicts

**What it creates** (`.aevum/mcp/port-config.json`):
```json
{
  "version": "1.7.0",
  "strategy": "hybrid_port_strategy",
  "primaryPort": 3344,
  "fallbackPorts": [3345, 3346, 3347, 3348, 3349],
  "minPort": 3340,
  "maxPort": 3400,
  "portPool": {
    "reserved": [...],
    "available": [...],
    "history": []
  }
}
```

**How MCP Server uses this**:
1. Try port 3344 (primary)
2. If fails → try fallback ports (3345-3349)
3. If all fail → use random port

---

## Migration Execution Flow

```
Extension Activate
    ↓
AevumBridge.init()
    ↓
setImmediate() → Background Tasks
    ↓
MigrationManager.syncProjectContext(workspaceRoot)
    ├─ Check aevum_version.json
    ├─ Find pending migrations
    ├─ Run all 4 MCP migrations
    │  ├─ mcp_server_init_v1.7
    │  ├─ mcp_resources_registry_v1.7
    │  ├─ mcp_port_config_v1.7
    │  └─ knowledge_registry_v1.7
    └─ Update aevum_version.json
    ↓
McpServerManager.init(context, workspaceRoot)
    ├─ Read port config from .aevum/mcp/port-config.json
    ├─ Try starting server on configured ports
    └─ Write connection info to .aevum/mcp.json
    ↓
Ready for MCP Agent Connection
```

## Version Compatibility

| Aevum Version | MCP Support | Notes |
|---|---|---|
| < 1.7.0 | No | MCP not available |
| 1.7.0 | ✅ Basic | MCP Server SSE + 3 tools |
| 1.8.0+ | ✅ Extended | (Planned) Additional tools, advanced resource management |

## Troubleshooting

### Issue: Port conflicts (3344-3349 all in use)
**Solution**: 
- Update `port-config.json` maxPort to higher value
- MCP Server will use random port as last resort

### Issue: `mcp.json` shows "inactive"
**Solution**:
- This is normal until Extension is fully loaded
- Check VS Code Output panel for "[Aevum] MCP Server listening on port..."
- File will update when server successfully starts

### Issue: Resources not available in MCP Agent
**Solution**:
- Check `.aevum/mcp/resources.json` exists
- Verify resource URIs match actual file paths
- Restart VS Code to re-run migrations if needed

## Adding New Migrations

To add a new MCP migration in future versions:

1. Add new migration object to `MIGRATIONS[]` array in `src/core/upgrades.ts`:
```typescript
{
    id: 'mcp_new_feature_v2.0',
    name: 'MCP New Feature Description',
    run: async (workspaceRoot: string) => {
        // Migration logic here
        return changed; // boolean
    }
}
```

2. Migration will automatically run on next activation if id not in `appliedMigrations`

3. Track applied migrations in `.aevum/aevum_version.json`:
```json
{
  "version": "1.7.0",
  "appliedMigrations": [
    "mcp_server_init_v1.7",
    "mcp_resources_registry_v1.7",
    "mcp_port_config_v1.7",
    "mcp_new_feature_v2.0"
  ]
}
```

## Files Created/Modified

| File | Type | Purpose |
|---|---|---|
| `.aevum/mcp/` | Directory | MCP Server configuration directory |
| `.aevum/mcp.json` | Config | Active MCP Server connection info |
| `.aevum/mcp/resources.json` | Registry | Resource discovery registry |
| `.aevum/mcp/port-config.json` | Config | Port management strategy |
| `.aevum/aevum_version.json` | Metadata | Tracks applied migrations |
| `src/core/upgrades.ts` | Source | Migration implementation |

---

**Last Updated**: 2026-04-02  
**Aevum Version**: 1.7.0+
