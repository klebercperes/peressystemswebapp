# Common Issues & Quick Fixes

## Connection Errors

### "Failed to fetch" / "Connection Error"

**Symptoms:**
- Red error in browser console
- Network tab shows failed requests

**Quick Fix:**
1. Check backend is running: `docker ps | grep backend`
2. Check backend logs: `docker logs msp_backend --tail 20`
3. Clear browser storage and login again
4. Check CORS configuration in `.env`

**See**: [Debugging Guide](DEBUGGING.md) for detailed steps

---

## Authentication Issues

### "Incorrect username or password"

**Quick Fix:**
1. Verify credentials are correct
2. Check if user exists: `docker exec msp_postgres psql -U msp_user -d msp_db -c "SELECT email, username FROM users;"`
3. Try password reset: Click "Forgot Password?" on login page
4. Admin can reset password: Login as admin → Users → Reset Password

### "401 Not authenticated" After Login

**Quick Fix:**
1. Clear browser Local Storage
2. Login again
3. Check Network tab - verify token is being sent in headers
4. Check backend logs for JWT validation errors

---

## Password Reset Issues

### "Forgot Password" Button Not Working

**Quick Fix:**
1. Check browser console for errors
2. Verify frontend is up to date (rebuild if needed)
3. Check Network tab for `/api/auth/forgot-password` request

### Reset Email Not Received

**Quick Fix:**
1. Check SMTP credentials in `.env`
2. Check backend logs: `docker logs msp_backend | grep -i smtp`
3. Check if email is logged (if SMTP not configured, link is logged)
4. Verify `FRONTEND_URL` is correct in `.env`

---

## Frontend Not Updating

### Changes Not Visible in Production

**Quick Fix:**
1. **Push changes to GitHub first**:
   ```bash
   cd /tmp/PeresSystemWebAppNew2
   git push origin main
   ```

2. **Rebuild frontend**:
   ```bash
   cd /home/kleber/peres_systems
   docker-compose -f docker-compose.https-domain.github.yml build --no-cache frontend
   docker-compose -f docker-compose.https-domain.github.yml up -d frontend
   ```

3. **Clear browser cache**: Ctrl+F5 or Cmd+Shift+R

---

## Database Issues

### Database Connection Error

**Quick Fix:**
1. Check postgres is running: `docker ps | grep postgres`
2. Check DATABASE_URL in `.env` uses correct hostname (`msp_postgres`)
3. Restart backend: `docker restart msp_backend`

### Migration Errors

**Quick Fix:**
1. Check migration status: `docker exec msp_backend alembic current`
2. Run migrations: `docker exec msp_backend alembic upgrade head`
3. Check database schema: `docker exec msp_postgres psql -U msp_user -d msp_db -c "\d users"`

---

## Docker Issues

### Container Won't Start

**Quick Fix:**
1. Check logs: `docker logs msp_backend` (or container name)
2. Check if port is in use: `netstat -tulpn | grep 8000`
3. Remove and recreate: `docker rm msp_backend && docker-compose up -d backend`

### "ContainerConfig" Error

**Quick Fix:**
1. Remove old container: `docker rm msp_backend`
2. Recreate: `docker-compose -f docker-compose.https-domain.github.yml up -d backend`

---

## Email Issues

### SMTP Connection Failed

**Quick Fix:**
1. Verify SMTP credentials in `.env`
2. Check Gmail app password (not regular password)
3. Verify SMTP port (587 for TLS, 465 for SSL)
4. Check firewall/network restrictions

---

## Quick Diagnostic Commands

```bash
# Check all services
docker ps | grep msp_

# Check backend health
curl https://peres.systems/api/health

# View backend logs
docker logs msp_backend --tail 50

# View frontend logs
docker logs msp_frontend --tail 50

# Test database connection
docker exec msp_postgres psql -U msp_user -d msp_db -c "SELECT 1;"

# Check environment variables
docker exec msp_backend env | grep -E "DATABASE_URL|SMTP"
```

---

**See Also**: [Debugging Guide](DEBUGGING.md) for comprehensive troubleshooting

**Last Updated**: November 15, 2025
