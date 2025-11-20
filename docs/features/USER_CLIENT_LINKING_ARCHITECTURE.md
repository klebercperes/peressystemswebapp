# User-Client Linking Architecture

## Current Situation

**Current Architecture:**
- User and Client are separate entities
- Linked by **email matching** (1:1 relationship)
- When a user signs up, a Client is created with the same email
- Problem: If Client is deleted, user loses access (now fixed to recreate)

**Issues:**
1. ✅ **FIXED**: Client recreation when deleted
2. ⚠️ **TODO**: Multiple users per company (many-to-one)
3. ⚠️ **TODO**: Company details collection during signup

---

## Architecture Options

### Option A: Add `client_id` to User Model (Recommended)

**Changes:**
- Add `client_id` foreign key to `User` model
- Users can be linked to existing clients
- During signup: ask if joining existing company or creating new one

**Pros:**
- Clean many-to-one relationship
- Supports multiple users per company
- Easy to query "all users for a client"
- Maintains data integrity

**Cons:**
- Requires database migration
- Need to handle existing data

**Implementation:**
```python
class User(Base):
    # ... existing fields ...
    client_id = Column(String, ForeignKey("clients.id"), nullable=True)  # Nullable for team users
```

**Signup Flow:**
1. User signs up
2. Ask: "Are you joining an existing company?"
   - If YES: Search/select company → Link user to existing client
   - If NO: Create new Client → Link user to new client
3. If Google OAuth: Check if email matches existing client → Link automatically

---

### Option B: Keep Email-Based Linking (Simpler, Less Flexible)

**Changes:**
- Keep current email-based linking
- Allow multiple users with same email domain
- Create "Company" entity separate from Client

**Pros:**
- Minimal changes
- No migration needed

**Cons:**
- Less flexible
- Harder to manage multiple users per company
- Email domain matching is imprecise

---

### Option C: Separate Company Entity

**Changes:**
- Create new `Company` entity
- Link both `User` and `Client` to `Company`
- Client becomes "billing/contact info" for Company

**Pros:**
- Most flexible
- Clear separation of concerns

**Cons:**
- Most complex
- Requires significant refactoring
- Overkill for current needs

---

## Recommendation: Option A

**Why:**
- Best balance of simplicity and flexibility
- Supports your use case (multiple users per company)
- Clean database design
- Easy to implement

---

## Implementation Plan

### Phase 1: Fix Current Issues (DONE ✅)
- ✅ Client recreation when deleted
- ✅ Ensure Client exists for all customer users

### Phase 2: Add Company Linking (Recommended Next)
1. **Database Migration:**
   - Add `client_id` column to `users` table
   - Migrate existing users: link by email match
   - Make `client_id` nullable (team users don't need it)

2. **Backend Changes:**
   - Update User model
   - Update registration endpoint:
     - Option 1: Link to existing client (search by company name/email)
     - Option 2: Create new client
   - Update Google OAuth:
     - Check if email matches existing client → Link
     - Otherwise create new client → Link

3. **Frontend Changes:**
   - Update signup form:
     - Add "Company Name" field (required)
     - Add "Search existing company" option
     - If found: Link to existing
     - If not found: Create new
   - Update customer dashboard:
     - Show company info
     - Allow editing company details

### Phase 3: Company Details Collection
- Add company details form during signup:
  - Company Name (required)
  - ABN (optional)
  - Address (optional)
  - Phone (optional)
- Store in Client record
- Allow editing later

---

## Questions to Answer

1. **Should we implement Phase 2 now?**
   - ✅ YES if you need multiple users per company soon
   - ⏸️ WAIT if current 1:1 is sufficient for now

2. **Company details collection:**
   - **Option A**: Collect during signup (better UX, more complete data)
   - **Option B**: Collect after login (faster signup, can be skipped)
   - **Recommendation**: Option A - collect during signup

3. **Existing client linking:**
   - **Option A**: Search by company name/email (more flexible)
   - **Option B**: Admin creates company, sends invite link (more controlled)
   - **Recommendation**: Option A for now, Option B later

---

## Next Steps

**If proceeding with Phase 2:**
1. Create migration script
2. Update User model
3. Update registration/Google OAuth endpoints
4. Update frontend signup form
5. Test with existing users

**If waiting:**
- Current system works for 1:1 user-client relationship
- Can add company linking later when needed

---

## Decision Needed

Please confirm:
1. ✅ Immediate fix applied (client recreation) - **DONE**
2. ❓ Proceed with Phase 2 (multiple users per company)?
3. ❓ Collect company details during signup?

