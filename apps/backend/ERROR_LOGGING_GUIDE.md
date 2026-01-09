# Error Logging System Documentation

## Overview
Comprehensive error tracking and logging system that automatically captures, categorizes, and stores errors from both frontend and backend in MongoDB. Includes an admin dashboard for monitoring and resolving errors.

## Features

### Backend
- ✅ Automatic error capture via middleware
- ✅ Intelligent error categorization and severity detection
- ✅ Error deduplication (tracks occurrences of same error)
- ✅ Request/response context capture
- ✅ User identification and tracking
- ✅ Browser/OS/device detection
- ✅ Comprehensive metadata and stack traces

### Frontend
- ✅ Global error and unhandled rejection capture
- ✅ ErrorBoundary component for React errors
- ✅ Queue-based error logging (prevents server overload)
- ✅ Automatic categorization
- ✅ Manual error logging with context

### Admin Dashboard
- ✅ Real-time error statistics
- ✅ Advanced filtering (severity, source, category, status)
- ✅ Pagination and search
- ✅ Error resolution workflow
- ✅ Detailed error view with full context

## API Endpoints

### Log an Error
```
POST /api/v1/errors/log
```
**Request Body:**
```json
{
  "error": {
    "name": "TypeError",
    "message": "Cannot read property 'x' of undefined",
    "stack": "Error stack trace...",
    "code": "ERR_CODE"
  },
  "source": "frontend",
  "severity": "error",
  "category": "ui_render",
  "metadata": {
    "componentName": "MyComponent",
    "userAction": "clicked button"
  },
  "fileKey": "optional-figma-file-key",
  "nodeId": "optional-figma-node-id"
}
```

### Get Error Logs
```
GET /api/v1/errors?page=1&limit=50&severity=error&source=frontend
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `severity` - Filter by severity (critical|error|warning|info)
- `source` - Filter by source (frontend|backend|api|database|auth|external)
- `category` - Filter by category
- `resolved` - Filter by resolution status (true|false)
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `userId` - Filter by user ID
- `search` - Search in error message/name/code

### Get Error Statistics
```
GET /api/v1/errors/stats?startDate=2024-01-01&severity=critical
```

### Get Error Details
```
GET /api/v1/errors/:errorId
```

### Mark Error as Resolved
```
PATCH /api/v1/errors/:errorId/resolve
```
**Request Body:**
```json
{
  "resolutionNotes": "Fixed by deploying patch v1.2.3",
  "resolvedBy": "admin@example.com"
}
```

### Delete Error Log
```
DELETE /api/v1/errors/:errorId
```

### Get Recent Error Summary
```
GET /api/v1/errors/recent/summary?hours=24
```

## Frontend Usage

### Automatic Error Logging
Errors are automatically logged when:
1. Global JavaScript errors occur
2. Unhandled promise rejections happen
3. React components throw errors (when wrapped in ErrorBoundary)

### Manual Error Logging
```typescript
import { logError } from '@/lib/errorLogger';

try {
  // Your code
} catch (error) {
  logError(error as Error, {
    severity: 'error',
    category: 'user_action',
    metadata: {
      action: 'submit_form',
      formData: { ... }
    },
    fileKey: 'figma-file-key',
    componentName: 'FormComponent'
  });
}
```

### Using ErrorBoundary Component
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorUI />} // Optional
      onError={(error, errorInfo) => {
        // Optional callback
        console.error('Error caught:', error);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Error Schema

### Severity Levels
- `critical` - System-breaking errors (database failures, auth failures)
- `error` - Significant errors affecting functionality
- `warning` - Minor issues or validation errors
- `info` - Informational messages

### Sources
- `frontend` - Client-side JavaScript errors
- `backend` - Server-side Node.js errors
- `api` - External API errors
- `database` - Database operation errors
- `auth` - Authentication/authorization errors
- `external` - Third-party service errors

### Categories
- `authentication` - Login, token, auth issues
- `authorization` - Permission, access control issues
- `validation` - Input validation errors
- `database` - Database query/connection errors
- `network` - Network connectivity issues
- `figma_api` - Figma API related errors
- `code_generation` - Code generation errors
- `file_processing` - File handling errors
- `ui_render` - React rendering errors
- `user_action` - User-triggered errors
- `unknown` - Uncategorized errors

## Admin Dashboard

Access the error logs dashboard at:
```
http://localhost:3000/admin/errors
```

### Features:
1. **Statistics Cards** - Overview of total errors, occurrences, and types
2. **Filters** - Filter by severity, source, category, and resolution status
3. **Error List** - Paginated table of all errors
4. **Actions** - View details, mark as resolved, or delete
5. **Error Details Modal** - Full context including stack traces, request data, etc.

## Best Practices

### 1. Log Context-Rich Errors
```typescript
logError(error, {
  severity: 'error',
  metadata: {
    userId: user.id,
    action: 'create_component',
    figmaFileKey: fileKey,
    nodeId: nodeId,
    // Add any relevant context
  }
});
```

### 2. Use Appropriate Severity
- Use `critical` sparingly for truly system-breaking issues
- Use `error` for functionality-breaking issues
- Use `warning` for non-breaking issues
- Use `info` for logging purposes only

### 3. Include User Context
Always include user information when available to help debug user-specific issues.

### 4. Don't Log Sensitive Data
Avoid logging passwords, tokens, or other sensitive information in error metadata.

### 5. Review and Resolve Regularly
Regularly check the admin dashboard and mark errors as resolved after fixing.

## Monitoring & Alerts

### Quick Health Check
```bash
curl http://localhost:8080/api/v1/errors/recent/summary?hours=1
```

### Check for Critical Errors
```bash
curl "http://localhost:8080/api/v1/errors?severity=critical&resolved=false"
```

## Database Schema

Errors are stored in MongoDB with the following structure:
- Automatic deduplication (same error increases `occurrenceCount`)
- Indexed for fast queries on timestamp, severity, source, category
- Tracks first and last occurrence
- Resolution workflow (resolved, resolvedAt, resolvedBy, resolutionNotes)

## Troubleshooting

### Error Logging Not Working
1. Check MongoDB connection
2. Verify error logging middleware is added to server
3. Check browser console for frontend errors
4. Verify API endpoint is accessible

### High Error Volume
1. Check error stats to identify patterns
2. Look for repeated errors (high `occurrenceCount`)
3. Use filters to focus on critical/unresolved errors

### Missing Context
1. Ensure proper context is passed when logging
2. Check middleware is capturing request data
3. Verify user authentication info is available

## Example: Accessing Error Logs Programmatically

You can access error logs directly from Claude Code by making API requests:

```bash
# Get recent critical errors
curl http://localhost:8080/api/v1/errors/recent/summary

# Get unresolved errors
curl "http://localhost:8080/api/v1/errors?resolved=false&limit=10"

# Get error details
curl http://localhost:8080/api/v1/errors/:errorId
```

This allows Claude Code to directly query and analyze errors to help debug issues!
