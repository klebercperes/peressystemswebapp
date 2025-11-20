# Database Migrations with Alembic

## ✅ What Was Implemented

Alembic database migrations have been set up to manage database schema changes in a version-controlled, production-safe way.

### Setup Complete

1. **Alembic Initialized** - Migration system configured
2. **Initial Migration Created** - Captures current database schema
3. **Environment Configuration** - Uses `DATABASE_URL` from environment
4. **Code Updated** - Removed `Base.metadata.create_all()` from production code

## 📁 Migration Files

- **Configuration**: `backend/alembic.ini`
- **Environment**: `backend/alembic/env.py`
- **Migrations**: `backend/alembic/versions/`
- **Initial Migration**: `585407dab022_initial_migration_create_all_tables.py`

## 🚀 Usage

### Running Migrations

#### Apply All Pending Migrations
```bash
docker-compose exec backend alembic upgrade head
```

#### Apply Next Migration
```bash
docker-compose exec backend alembic upgrade +1
```

#### Rollback One Migration
```bash
docker-compose exec backend alembic downgrade -1
```

#### Rollback to Specific Revision
```bash
docker-compose exec backend alembic downgrade <revision_id>
```

#### Check Current Migration Status
```bash
docker-compose exec backend alembic current
```

#### View Migration History
```bash
docker-compose exec backend alembic history
```

### Creating New Migrations

#### Auto-generate Migration from Model Changes
```bash
docker-compose exec backend alembic revision --autogenerate -m "Description of changes"
```

#### Create Empty Migration (for manual changes)
```bash
docker-compose exec backend alembic revision -m "Description of changes"
```

## 📝 Workflow

### Making Schema Changes

1. **Modify Models** (`backend/app/models.py`)
   ```python
   class Client(Base):
       # ... existing fields ...
       new_field = Column(String)  # Add new field
   ```

2. **Generate Migration**
   ```bash
   docker-compose exec backend alembic revision --autogenerate -m "Add new_field to Client"
   ```

3. **Review Generated Migration**
   - Check `backend/alembic/versions/` for the new migration file
   - Review the `upgrade()` and `downgrade()` functions
   - Edit if needed (e.g., for data migrations)

4. **Test Migration**
   ```bash
   # Apply migration
   docker-compose exec backend alembic upgrade head
   
   # Test rollback
   docker-compose exec backend alembic downgrade -1
   
   # Re-apply
   docker-compose exec backend alembic upgrade head
   ```

5. **Commit to Version Control**
   - Commit both model changes and migration file
   - Migration files should be committed to git

## 🔧 Configuration

### Database URL

Migrations use the same `DATABASE_URL` environment variable as the application:
```env
DATABASE_URL=postgresql://msp_user:password@postgres:5432/msp_db
```

### Migration Settings

Configured in `backend/alembic.ini`:
- Script location: `alembic/`
- Version location: `alembic/versions/`
- Database URL: Read from `DATABASE_URL` env var

## ⚠️ Important Notes

### Production Deployment

1. **Always run migrations before starting the application**
   ```bash
   # In your deployment script
   alembic upgrade head
   # Then start the application
   ```

2. **Never use `Base.metadata.create_all()` in production**
   - This is now removed from `main.py`
   - Use migrations instead

3. **Backup before migrations**
   - Always backup database before running migrations in production
   - Test migrations in staging first

### Migration Best Practices

1. **Review Auto-generated Migrations**
   - Alembic's autogenerate is good but not perfect
   - Always review before applying

2. **Test Both Directions**
   - Test `upgrade` (forward)
   - Test `downgrade` (rollback)

3. **Data Migrations**
   - For complex data changes, create manual migrations
   - Use `op.execute()` for custom SQL

4. **Migration Naming**
   - Use descriptive names: `add_user_email_index`
   - Not: `migration_1`, `fix_bug`

## 🐛 Troubleshooting

### Migration Fails

1. **Check database connection**
   ```bash
   docker-compose exec backend python3 -c "from app.database import engine; engine.connect()"
   ```

2. **Check migration status**
   ```bash
   docker-compose exec backend alembic current
   ```

3. **View migration history**
   ```bash
   docker-compose exec backend alembic history
   ```

### Migration Out of Sync

If migrations are out of sync with database:

1. **Mark current revision manually**
   ```bash
   docker-compose exec backend alembic stamp head
   ```

2. **Or create a new baseline migration**
   ```bash
   docker-compose exec backend alembic revision --autogenerate -m "Baseline migration"
   ```

### Autogenerate Not Detecting Changes

1. **Ensure models are imported** in `alembic/env.py`
2. **Check model metadata** is included: `target_metadata = Base.metadata`
3. **Verify model changes** are actually in the code

## 📊 Current Status

- ✅ Alembic initialized
- ✅ Initial migration created
- ✅ Configuration complete
- ✅ `Base.metadata.create_all()` removed from production code
- ✅ Ready for schema changes

## 🔄 Example: Adding a New Field

```python
# 1. Update model (backend/app/models.py)
class Client(Base):
    # ... existing fields ...
    website = Column(String)  # New field

# 2. Generate migration
docker-compose exec backend alembic revision --autogenerate -m "Add website to Client"

# 3. Review migration file in backend/alembic/versions/

# 4. Apply migration
docker-compose exec backend alembic upgrade head

# 5. Verify
docker-compose exec backend alembic current
```

## 🚨 Production Checklist

Before deploying migrations to production:

- [ ] Test migration in staging environment
- [ ] Backup production database
- [ ] Review migration SQL (use `alembic upgrade head --sql` to preview)
- [ ] Plan rollback strategy
- [ ] Schedule maintenance window if needed
- [ ] Monitor application after migration
- [ ] Verify data integrity

## 📚 Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Migrations Guide](https://docs.sqlalchemy.org/en/20/core/metadata.html)

---

**Status**: ✅ Database migrations are fully configured and ready to use!

