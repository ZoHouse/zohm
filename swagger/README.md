# ZO API Swagger UI

Standalone Swagger UI documentation for the ZO API. This is completely independent of the main application and can be used anywhere.

## Files

- `openapi.yaml` - OpenAPI 3.0 specification for the ZO API
- `index.html` - Standalone Swagger UI interface
- `README.md` - This file

## Quick Start

### Option 1: Using a Local HTTP Server (Recommended)

Since browsers block local file access for security reasons, you need to serve the files via HTTP:

#### Using Python 3:
```bash
cd swagger
python3 -m http.server 8000
```
Then open: http://localhost:8000

#### Using Python 2:
```bash
cd swagger
python -m SimpleHTTPServer 8000
```
Then open: http://localhost:8000

#### Using Node.js (http-server):
```bash
# Install globally (one time)
npm install -g http-server

# Run server
cd swagger
http-server -p 8000
```
Then open: http://localhost:8000

#### Using PHP:
```bash
cd swagger
php -S localhost:8000
```
Then open: http://localhost:8000

#### Using npx (Node.js, no installation):
```bash
cd swagger
npx http-server -p 8000
```
Then open: http://localhost:8000

### Option 2: Deploy to Static Hosting

You can deploy the `swagger` directory to any static hosting service:

- **GitHub Pages**: Push to a `gh-pages` branch
- **Netlify**: Drag and drop the `swagger` folder
- **Vercel**: Deploy the `swagger` folder
- **AWS S3**: Upload to an S3 bucket with static website hosting
- **Any web server**: Copy files to your web root

### Option 3: Use Online Swagger Editor

1. Go to https://editor.swagger.io/
2. Click "File" → "Import file"
3. Upload `openapi.yaml`
4. Click "Generate Client" → "HTML" for a standalone version

## Features

- ✅ **Interactive API Documentation** - Try out API endpoints directly from the browser
- ✅ **Authentication Support** - Configure Bearer token authentication
- ✅ **Request/Response Examples** - See example requests and responses
- ✅ **Schema Validation** - View detailed request/response schemas
- ✅ **Standalone** - No dependencies on the main application
- ✅ **Portable** - Can be hosted anywhere or used locally

## Usage

1. **View Documentation**: Browse all available endpoints organized by tags (Authentication, Profile, Avatar)

2. **Try It Out**: 
   - Click on any endpoint to expand it
   - Click "Try it out" button
   - Fill in required parameters
   - Click "Execute" to make a real API call

3. **Authentication**:
   - Click the "Authorize" button at the top
   - Enter your Bearer token (access_token from ZO API)
   - Click "Authorize" and "Close"
   - All authenticated endpoints will now use this token

4. **Required Headers**:
   - For authenticated requests, you'll need to manually add these headers:
     - `client-key`: Your client key
     - `client-device-id`: Device ID from authentication
     - `client-device-secret`: Device secret from authentication
   - These can be added in the "Try it out" section for each endpoint

## API Base URL

The default base URL is set to:
```
https://api.io.zo.xyz
```

You can change this in `openapi.yaml` under the `servers` section if needed.

## Updating the Documentation

To update the API documentation:

1. Edit `openapi.yaml` following OpenAPI 3.0 specification
2. Refresh the browser to see changes (if using a local server)
3. For production deployments, re-upload the updated files

## Troubleshooting

### "Failed to load API specification"
- Ensure `openapi.yaml` is in the same directory as `index.html`
- Check browser console for detailed error messages
- Verify YAML syntax is correct

### CORS Errors
- The Swagger UI makes requests from your browser to the API
- If you see CORS errors, the API server needs to allow requests from your origin
- This is a server-side configuration issue, not a Swagger UI issue

### File Protocol Issues
- Opening `index.html` directly (file://) may not work due to browser security
- Always use an HTTP server (see Quick Start options above)

## API Documentation Source

This Swagger UI is generated from `Docs/ZO_API.md` in the main repository. The OpenAPI specification (`openapi.yaml`) is manually maintained but follows the same structure and details as the markdown documentation.

## License

This Swagger UI documentation is part of the Zo World project. See the main repository for license information.

