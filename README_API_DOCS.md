# ZO House API Documentation

This directory contains interactive API documentation powered by Swagger UI and OpenAPI 3.0 specifications.

## Documentation Pages

### Internal APIs (`/api-docs`)
Interactive documentation for the ZO House application's internal API endpoints:
- **URL**: http://localhost:3000/api-docs (development)
- **Specification**: `/public/openapi-internal.yaml`
- **Endpoints**:
  - NFT ownership verification
  - User inventory, progress, reputations, and streaks
  - Quest completion
  - Leaderboards
  - Calendar events
  - City data

### External ZO Backend APIs (`/api-docs/zo`)
Interactive documentation for the external ZO backend APIs that the application consumes:
- **URL**: http://localhost:3000/api-docs/zo (development)
- **Specification**: `/public/openapi-external.yaml`
- **Endpoints**:
  - Authentication (OTP send/verify, token refresh, login check)
  - Profile management (get, update)
  - Avatar generation and status

## Using Swagger UI

### Features
- **Try It Out**: Click "Try it out" on any endpoint to make test requests
- **Search**: Use the search bar to filter endpoints
- **Deep Linking**: Share direct links to specific endpoints
- **Persistent Authorization**: Saved tokens persist across page reloads
- **Response Duration**: See how long each request takes

### Testing Internal APIs

1. Navigate to http://localhost:3000/api-docs
2. Find the endpoint you want to test
3. Click "Try it out"
4. Fill in required parameters
5. Click "Execute"
6. View the response below

**Example: Get Leaderboard**
```
GET /api/leaderboard?scope=global&limit=10
```

### Testing External ZO APIs

⚠️ **Important**: External ZO APIs require authentication credentials from the ZO team.

1. Navigate to http://localhost:3000/api-docs/zo
2. Click "Authorize" in the top right
3. Enter your credentials:
   - Bearer token (from login response)
   - client-key header
   - client-device-id header
   - client-device-secret header
4. Test endpoints as described above

**Note**: For comprehensive code examples and integration guides, see [ZO_API.md](../../ZO_API.md).

## Updating the OpenAPI Specifications

### When to Update

Update the OpenAPI specs whenever you:
- Add a new API endpoint
- Modify request/response schemas
- Change endpoint parameters
- Update authentication requirements

### How to Update

#### For Internal APIs (`openapi-internal.yaml`)

1. Open `/public/openapi-internal.yaml`
2. Add/modify the endpoint under `paths:`
3. Add/update schemas under `components.schemas:` if needed
4. Verify the specification:
   ```bash
   # Upload to https://editor.swagger.io/ to validate
   ```
5. Reload the Swagger UI page to see changes

#### For External ZO APIs (`openapi-external.yaml`)

1. Open `/public/openapi-external.yaml`
2. Make necessary changes based on ZO_API.md updates
3. Validate as above
4. Update ZO_API.md if needed to reference the Swagger docs

### Best Practices

1. **Keep in sync**: Ensure OpenAPI specs match actual implementations
2. **Use references**: Use `$ref` for reusable schemas to avoid duplication
3. **Add examples**: Include realistic example values for all fields
4. **Document errors**: Specify all possible error responses (400, 404, 500, etc.)
5. **Version properly**: Update the `version` field when making breaking changes

## Validation

### Online Validation
1. Go to https://editor.swagger.io/
2. File → Import File
3. Select `openapi-internal.yaml` or `openapi-external.yaml`
4. Fix any validation errors shown

### Local Validation
```bash
# Using pnpm swagger CLI (if installed)
pnpm swagger-cli validate public/openapi-internal.yaml
pnpm swagger-cli validate public/openapi-external.yaml
```

## ⚠️ Critical: Accept Header Requirement

When making direct API calls (curl, Postman, or programmatically), you **MUST** use the correct `Accept` header:

```bash
# ✅ CORRECT - This works
curl -X POST 'https://api.io.zo.xyz/api/v1/auth/login/mobile/otp/' \
  -H 'Content-Type: application/json' \
  -H 'Accept: */*' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'client-key: YOUR_CLIENT_KEY' \
  -H 'client-device-id: web-1234567890-abc123' \
  -H 'client-device-secret: your-device-secret' \
  -d '{"mobile_country_code": "91", "mobile_number": "9876543210", "message_channel": ""}'

# ❌ WRONG - This causes "Missing captcha response" error
curl -X POST ... -H 'Accept: application/json' ...
```

**Why?** The ZO API backend checks the `Accept` header and requires captcha for requests with `Accept: application/json`. Using `Accept: */*` bypasses this check.

## Security Considerations

### Internal APIs
- No special credentials needed for local development
- In production, consider adding authentication middleware

### External ZO APIs
- **Never commit** `client-key`, `client-device-id`, or `client-device-secret` to version control
- Store credentials in environment variables
- **Do not** include real credential values in OpenAPI examples
- Use placeholder text like `"YOUR_CLIENT_KEY"` instead

## Troubleshooting

### Swagger UI not loading
- Ensure you're using dynamic import (`dynamic(() => import('swagger-ui-react'), { ssr: false })`)
- Check browser console for errors
- Verify YAML files are in the `/public` directory

### YAML syntax errors
- Validate YAML at https://www.yamllint.com/
- Check for incorrect indentation (use 2 spaces, not tabs)
- Ensure all strings with special characters are quoted

### Endpoints not matching documentation
1. Review actual route implementation in `/src/app/api/`
2. Update OpenAPI spec to match
3. OR update implementation to match spec (if spec is correct)

### CORS errors when testing
- Internal APIs should work fine (same origin)
- External ZO APIs may require CORS configuration on their end

## Additional Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/)
- [ZO API Documentation](../../ZO_API.md) - Comprehensive markdown guide
- [Swagger Editor](https://editor.swagger.io/) - Online spec editor/validator

## Support

For issues with:
- **Internal API documentation**: Check `/src/app/api/` for actual implementation
- **External ZO API documentation**: Contact dev@zo.xyz or refer to ZO_API.md
- **Swagger UI issues**: Check the [Swagger UI GitHub](https://github.com/swagger-api/swagger-ui/issues)
