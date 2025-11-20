# Frontend Production Build Setup

## ✅ What Was Implemented

### 1. Production Dockerfile (`Dockerfile.frontend.prod`)
- **Multi-stage build** for optimized image size
- **Stage 1**: Build the React application with Vite
- **Stage 2**: Serve static files with nginx
- Build-time environment variables for API URLs

### 2. Nginx Configuration (`nginx.conf`)
- **Gzip compression** enabled for all text-based files
- **Security headers**:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
- **Static asset caching** (1 year for images, CSS, JS, fonts)
- **SPA routing support** - All routes serve `index.html`
- **Health check endpoint** at `/health`

### 3. Vite Production Configuration
- **Minification** with esbuild (faster than terser)
- **Code splitting** - Vendor chunks for React/React-DOM
- **No sourcemaps** in production (smaller builds)
- **Optimized output** directory structure

### 4. Docker Compose Updates
- Frontend now runs on **port 80** (standard HTTP port)
- Uses production Dockerfile
- Build arguments for environment variables

## 🚀 Usage

### Building the Production Frontend

```bash
docker-compose build frontend
```

### Running Production Frontend

```bash
docker-compose up -d frontend
```

### Accessing the Application

- **Frontend**: http://localhost:80 (or http://localhost)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Health Check**: http://localhost:80/health (frontend) or http://localhost:8000/health (backend)

**Note**: All hardcoded IP addresses have been removed. Configuration uses environment variables:
- `CORS_ORIGINS` for backend CORS
- `VITE_API_URL` for frontend API connection

## 📊 Performance Improvements

### Before (Development)
- Development server with hot reload
- No minification
- Large bundle sizes
- No compression
- No caching

### After (Production)
- ✅ Optimized static files
- ✅ Minified JavaScript/CSS
- ✅ Gzip compression
- ✅ Long-term caching for static assets
- ✅ Code splitting for better loading
- ✅ Smaller bundle sizes

## 🔒 Security Improvements

- ✅ Security headers configured
- ✅ No sourcemaps in production
- ✅ Optimized build process
- ✅ Production-grade web server (nginx)

## 📝 Environment Variables

The frontend build uses these environment variables (set in `.env`):

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_GEMINI_API_KEY` - Optional Gemini AI API key

These are baked into the build at build time, not runtime.

## 🔄 Development vs Production

### Development
- Use `Dockerfile.frontend` (dev server on port 5173)
- Hot reload enabled
- Sourcemaps enabled
- Larger bundle sizes

### Production
- Use `Dockerfile.frontend.prod` (nginx on port 80)
- Optimized static files
- No sourcemaps
- Smaller bundle sizes
- Better performance

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify `vite.config.ts` is correct
- Check Docker build logs: `docker-compose build frontend`

### Frontend Not Loading
- Check nginx logs: `docker-compose logs frontend`
- Verify port 80 is not in use: `netstat -tuln | grep 80`
- Test health endpoint: `curl http://localhost:80/health`

### API Connection Issues
- Verify `VITE_API_URL` is set correctly in `.env`
- Rebuild frontend after changing `VITE_API_URL`: `docker-compose build frontend`
- Check browser console for CORS errors

## 📈 Next Steps

1. **Add HTTPS/SSL** - Configure SSL certificates for production
2. **CDN Integration** - Serve static assets from CDN
3. **Monitoring** - Add frontend error tracking (Sentry, etc.)
4. **Performance Monitoring** - Add Web Vitals tracking

---

**Status**: ✅ Production frontend build is complete and working!

