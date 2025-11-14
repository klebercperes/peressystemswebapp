# Docker Commands Reference

## Check Container Status
```bash
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose ps
EOF
```

## View Logs
```bash
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
EOF
```

## Stop Containers
```bash
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose down
EOF
```

## Start Containers
```bash
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose up -d
EOF
```

## Restart Containers
```bash
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose restart
EOF
```

## Rebuild and Restart
```bash
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose up -d --build
EOF
```

## Access Container Shell
```bash
newgrp docker << 'EOF'
# Backend container
docker exec -it msp_backend bash

# Frontend container
docker exec -it msp_frontend sh

# PostgreSQL container
docker exec -it msp_postgres psql -U msp_user -d msp_db
EOF
```

## Clean Up (Remove containers and volumes)
```bash
newgrp docker << 'EOF'
cd /home/kleber/peres_systems
docker-compose down -v
EOF
```

## Note
After logging out and logging back in via SSH, you won't need `newgrp docker` anymore - you can run `docker-compose` commands directly!

