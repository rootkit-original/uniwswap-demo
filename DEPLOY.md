# Deploy Instructions for Fly.io

## Prerequisites

1. **Install Fly CLI**:
   ```bash
   # Windows (PowerShell as Administrator)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # Alternative: Download from GitHub releases
   # https://github.com/superfly/flyctl/releases
   ```

2. **Create Fly.io account**: https://fly.io/app/sign-up

## Backend Deploy Steps

### 1. Navigate to project root
```bash
cd c:\uniwswap\meu-projeto\site
```

### 2. Login to Fly.io
```bash
flyctl auth login
```

### 3. Create and configure the app
```bash
# This will use the existing fly.toml configuration
flyctl launch --no-deploy

# Set environment variables
flyctl secrets set MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/uniwswap?retryWrites=true&w=majority"
flyctl secrets set NODE_ENV="production"
flyctl secrets set FRONTEND_URL="https://your-vercel-app.vercel.app"
```

### 4. Deploy the backend
```bash
flyctl deploy
```

### 5. Check deployment
```bash
# View app status
flyctl status

# View logs
flyctl logs

# Open in browser
flyctl open
```

## After Backend Deployment

### 1. Get your Fly.io URL
After deployment, you'll get a URL like: `https://your-app-name.fly.dev`

### 2. Update frontend configuration
Update the file `frontend/.env.local`:
```env
VITE_API_BASE_URL=https://your-app-name.fly.dev
VITE_SOCKET_URL=https://your-app-name.fly.dev
```

### 3. Deploy frontend to Vercel
```bash
# Navigate to frontend directory
cd frontend

# Deploy to Vercel (if not connected via GitHub)
vercel --prod

# Or connect GitHub repo to Vercel dashboard
# https://vercel.com/new
```

### 4. Update CORS in backend
Update the `FRONTEND_URL` environment variable in Fly.io with your Vercel URL:
```bash
flyctl secrets set FRONTEND_URL="https://your-vercel-app.vercel.app"
```

## MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/atlas
2. Create a new cluster (M0 free tier)
3. Create database user
4. Add IP whitelist (0.0.0.0/0 for now, restrict later)
5. Get connection string
6. Update `MONGODB_URI` secret in Fly.io

## Troubleshooting

### Common Issues:

1. **App not starting**:
   ```bash
   flyctl logs
   ```

2. **Database connection issues**:
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Check database user permissions

3. **CORS errors**:
   - Verify `FRONTEND_URL` environment variable
   - Check frontend URL configuration

4. **WebSocket connection issues**:
   - Verify both HTTP and WebSocket are using same domain
   - Check browser network tab for connection attempts

### Useful Commands:

```bash
# Scale app
flyctl scale count 1

# View secrets
flyctl secrets list

# Remove app (if needed)
flyctl apps destroy your-app-name

# Update deployment
flyctl deploy

# View metrics
flyctl metrics
```

## Architecture After Deploy

```
Frontend (Vercel)     Backend (Fly.io)     Database (Atlas)
   React/TS      ←→     Node.js/Express   ←→   MongoDB
   Build/CDN            WebSocket/HTTP         Cloud Cluster
```

## Performance Tips

1. **Enable compression**: Already configured in backend
2. **Use CDN**: Vercel provides this automatically
3. **Monitor metrics**: Use `flyctl metrics`
4. **Set up health checks**: Already configured
5. **Use connection pooling**: Already configured in Mongoose

## Security Checklist

- [x] Helmet.js for security headers
- [x] CORS properly configured
- [x] Environment variables for secrets
- [x] Non-root user in Docker
- [x] Health checks enabled
- [ ] IP restrictions (add if needed)
- [ ] Rate limiting (add if needed)
- [ ] SSL/TLS (handled by Fly.io)

## Cost Monitoring

- **Fly.io**: Monitor usage at https://fly.io/dashboard
- **MongoDB Atlas**: Monitor at https://cloud.mongodb.com
- **Vercel**: Monitor at https://vercel.com/dashboard

Both services have generous free tiers suitable for this project.