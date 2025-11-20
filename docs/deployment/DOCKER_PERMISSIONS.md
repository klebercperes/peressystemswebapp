# Docker Permissions Fix

You're getting permission errors because the docker group membership requires a new login session.

## Quick Fix Options:

### Option 1: Use `newgrp docker` (Temporary)
Run this before any docker command:
```bash
newgrp docker
cd /home/kleber/peres_systems
docker-compose ps
```

### Option 2: Log Out and Log Back In (Permanent - Recommended)
1. Log out of your SSH session
2. Log back in
3. Then docker commands will work without `newgrp`

### Option 3: Use the Helper Script
I've created a script that handles this automatically:
```bash
bash check-containers.sh
```

## Verify Docker Group Membership
After logging back in, verify you're in the docker group:
```bash
groups | grep docker
```

If you see "docker" in the output, you're good to go!

## Check if Containers are Running
Even with permission errors, the containers might still be running. Try accessing:
- Frontend: http://10.0.1.122:5173
- Backend: http://10.0.1.122:8000
- API Docs: http://10.0.1.122:8000/docs

If these work, your containers are running fine!

