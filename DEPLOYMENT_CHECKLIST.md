# PRIPER Multi-Persona Feature - Deployment Checklist

## Overview

This checklist ensures a safe and complete deployment of the multi-persona feature system to production.

**Target Environment**: Production
**Feature Version**: 1.0.0
**Last Updated**: 2025-11-24

---

## Pre-Deployment Phase

### 1. Code Review & Quality Assurance

- [ ] All Phase 1-5 features implemented and tested
- [ ] No console.log statements in production code (except intentional logging)
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] All linting errors resolved (`npm run lint`)
- [ ] No sensitive data (API keys, secrets) in source code
- [ ] All TODO/FIXME comments addressed or documented
- [ ] Code reviewed by at least one other developer
- [ ] All PR feedback addressed and approved

### 2. Testing Verification

- [ ] All unit tests passing (`npm run test`)
- [ ] Manual testing completed (refer to MULTI_PERSONA_TESTING_GUIDE.md)
- [ ] Cross-browser testing completed:
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
- [ ] Mobile responsive testing completed:
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] Accessibility testing completed (WCAG AA compliance)
- [ ] Performance testing completed (Lighthouse score > 90)
- [ ] Load testing for Edge Functions completed

### 3. Database Preparation

- [ ] Database migration file reviewed: `20251124000000_persona_advanced_features.sql`
- [ ] Migration tested on staging environment
- [ ] Database backup taken before migration
- [ ] RLS policies tested for security
- [ ] Database indexes verified for performance
- [ ] Foreign key constraints validated
- [ ] Triggers and functions tested

### 4. Environment Configuration

- [ ] Production environment variables documented
- [ ] OpenAI API key configured in production
- [ ] Supabase project ID and keys configured
- [ ] Supabase service role key secured (not in git)
- [ ] CORS settings configured for production domain
- [ ] Rate limiting configured
- [ ] Error tracking service configured (Sentry, etc.)

### 5. Documentation

- [ ] PRIPER_종합개발문서.md updated with all features
- [ ] API_DOCUMENTATION.md completed
- [ ] MULTI_PERSONA_TESTING_GUIDE.md completed
- [ ] User-facing documentation updated (if applicable)
- [ ] Changelog/Release notes prepared
- [ ] Known issues documented

---

## Deployment Phase

### Stage 1: Database Migration

**Estimated Time**: 5-10 minutes
**Rollback Plan**: Database restore from backup

#### Steps:

1. **Create Database Backup**
   ```bash
   # Using Supabase CLI
   supabase db dump --file backup_pre_multipersona_$(date +%Y%m%d_%H%M%S).sql
   ```
   - [ ] Backup created successfully
   - [ ] Backup file size verified (should be > 0 bytes)
   - [ ] Backup stored in secure location

2. **Run Migration on Production**
   ```bash
   # Option A: Using Supabase Dashboard
   # Navigate to SQL Editor → New Query → Paste migration SQL → Run

   # Option B: Using Supabase CLI
   supabase db push
   ```
   - [ ] Migration executed without errors
   - [ ] All 4 new tables created:
     - [ ] persona_branding_strategies
     - [ ] persona_milestones
     - [ ] persona_growth_metrics
     - [ ] persona_relationships
   - [ ] RLS policies created for all tables
   - [ ] Database functions created:
     - [ ] create_default_milestones()
     - [ ] get_persona_growth_summary()

3. **Verify Migration**
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'persona_%';

   -- Check RLS enabled
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE tablename LIKE 'persona_%';

   -- Check functions exist
   SELECT proname FROM pg_proc
   WHERE proname IN ('create_default_milestones', 'get_persona_growth_summary');
   ```
   - [ ] All tables present
   - [ ] RLS enabled on all tables
   - [ ] All functions present

4. **Test Database Connection**
   - [ ] Connect to production database from staging app
   - [ ] Verify RLS policies work (try to access another user's data)
   - [ ] Test create_default_milestones function
   - [ ] Test get_persona_growth_summary function

---

### Stage 2: Edge Functions Deployment

**Estimated Time**: 10-15 minutes
**Rollback Plan**: Redeploy previous Edge Function versions

#### Steps:

1. **Prepare Edge Functions**
   ```bash
   cd supabase/functions

   # Check function directories
   ls -la
   # Should see: detect-personas/, analyze-persona-relationships/
   ```
   - [ ] detect-personas/index.ts present
   - [ ] analyze-persona-relationships/index.ts present
   - [ ] No syntax errors in function code
   - [ ] All dependencies listed in import maps

2. **Configure Environment Variables**

   In Supabase Dashboard → Edge Functions → Settings:

   ```bash
   OPENAI_API_KEY=sk-...your-key...
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your-key...
   ```
   - [ ] OPENAI_API_KEY set in production
   - [ ] SUPABASE_URL set correctly
   - [ ] SUPABASE_SERVICE_ROLE_KEY set (never commit this!)
   - [ ] Environment variables verified in dashboard

3. **Deploy Edge Functions**
   ```bash
   # Deploy detect-personas
   supabase functions deploy detect-personas --project-ref your-project-ref

   # Deploy analyze-persona-relationships
   supabase functions deploy analyze-persona-relationships --project-ref your-project-ref
   ```
   - [ ] detect-personas deployed successfully
   - [ ] analyze-persona-relationships deployed successfully
   - [ ] No deployment errors in logs
   - [ ] Functions appear in Supabase dashboard

4. **Test Edge Functions**
   ```bash
   # Test detect-personas (with valid auth token)
   curl -X POST 'https://your-project.supabase.co/functions/v1/detect-personas' \
     -H 'Authorization: Bearer YOUR_USER_JWT' \
     -H 'Content-Type: application/json' \
     -d '{"minClusters": 2, "maxClusters": 5}'

   # Test analyze-persona-relationships
   curl -X POST 'https://your-project.supabase.co/functions/v1/analyze-persona-relationships' \
     -H 'Authorization: Bearer YOUR_USER_JWT' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```
   - [ ] detect-personas returns 200 or expected error
   - [ ] analyze-persona-relationships returns 200 or expected error
   - [ ] OpenAI API calls working
   - [ ] Database writes successful
   - [ ] Function logs show no unexpected errors

5. **Monitor Edge Function Logs**
   ```bash
   # View logs in real-time
   supabase functions logs detect-personas --project-ref your-project-ref
   supabase functions logs analyze-persona-relationships --project-ref your-project-ref
   ```
   - [ ] Logs accessible
   - [ ] No error patterns detected
   - [ ] Performance metrics acceptable

---

### Stage 3: Frontend Application Deployment

**Estimated Time**: 15-20 minutes
**Rollback Plan**: Revert to previous deployment tag

#### Steps:

1. **Build Production Bundle**
   ```bash
   # Install dependencies
   npm ci

   # Run production build
   npm run build

   # Check build output
   ls -lh dist/
   ```
   - [ ] Build completed without errors
   - [ ] Build warnings reviewed and acceptable
   - [ ] Bundle size acceptable (< 2MB for main chunk)
   - [ ] Source maps generated for error tracking

2. **Pre-deployment Checks**
   - [ ] Environment variables configured in hosting platform:
     - [ ] VITE_SUPABASE_URL
     - [ ] VITE_SUPABASE_ANON_KEY
     - [ ] Other required variables
   - [ ] Build output directory correct (`dist/`)
   - [ ] All new routes added to hosting configuration:
     - [ ] /personas/relationships
     - [ ] /ikigai (with query param support)

3. **Deploy to Hosting Platform**

   **For Vercel:**
   ```bash
   vercel --prod
   ```

   **For Netlify:**
   ```bash
   netlify deploy --prod
   ```

   **For Custom Server:**
   ```bash
   rsync -avz dist/ user@server:/var/www/priper/
   ```

   - [ ] Deployment initiated
   - [ ] Deployment completed without errors
   - [ ] Deployment URL accessible
   - [ ] SSL certificate valid

4. **Post-Deployment Frontend Verification**
   - [ ] Homepage loads correctly
   - [ ] User authentication works
   - [ ] Existing features still work:
     - [ ] Profile page
     - [ ] Happy jobs page
     - [ ] Ikigai page (original)
   - [ ] New multi-persona features accessible:
     - [ ] Persona dashboard (/personas)
     - [ ] Persona relationships (/personas/relationships)
     - [ ] Persona-specific Ikigai (/ikigai?persona=xxx)
   - [ ] No console errors in browser
   - [ ] No network errors in browser Network tab

5. **Test Core User Flows**
   - [ ] **Flow 1: Persona Detection**
     1. Log in as test user
     2. Add 3+ happy jobs
     3. Click "페르소나 발견하기"
     4. Verify 2-5 personas created
     5. Check milestones auto-created

   - [ ] **Flow 2: Persona Dashboard**
     1. Navigate to /personas
     2. View all personas
     3. Switch between personas
     4. Verify paywall for Pro features (if free user)

   - [ ] **Flow 3: Branding Strategy**
     1. Navigate to /personas/relationships
     2. Click "브랜딩 전략" tab
     3. Select a strategy
     4. Save strategy
     5. Refresh page and verify persistence

   - [ ] **Flow 4: Relationship Analysis**
     1. Navigate to /personas/relationships
     2. Click "관계 분석" tab
     3. Click "분석하기" button
     4. Verify relationships displayed

   - [ ] **Flow 5: Growth Tracking**
     1. Navigate to /personas/relationships
     2. Click "성장 추적" tab
     3. View milestones
     4. Toggle milestone completion
     5. Verify realtime update

---

### Stage 4: Realtime Features Verification

**Estimated Time**: 10 minutes

#### Steps:

1. **Test Realtime Subscriptions**
   - [ ] Open app in two browser tabs with same user
   - [ ] Toggle milestone in tab 1
   - [ ] Verify update appears in tab 2 (within 2 seconds)
   - [ ] Create new milestone in tab 1
   - [ ] Verify it appears in tab 2
   - [ ] Check browser console for subscription errors

2. **Test Cross-Device Sync**
   - [ ] Log in on desktop
   - [ ] Log in on mobile (same user)
   - [ ] Make changes on desktop
   - [ ] Verify changes sync to mobile
   - [ ] Make changes on mobile
   - [ ] Verify changes sync to desktop

3. **Monitor Realtime Connections**
   - [ ] Check Supabase dashboard for realtime metrics
   - [ ] Verify connection count is reasonable
   - [ ] Check for connection errors or disconnects

---

## Post-Deployment Phase

### Stage 5: Monitoring & Validation

**Estimated Time**: Ongoing (first 24-48 hours critical)

#### Immediate Checks (First Hour)

- [ ] **Error Tracking**
  - [ ] Check Sentry/error tracking service
  - [ ] No new error spikes detected
  - [ ] Error rate < 1% of requests

- [ ] **Performance Monitoring**
  - [ ] Page load time < 3 seconds (95th percentile)
  - [ ] Edge Function execution time < 30 seconds
  - [ ] Database query time < 500ms
  - [ ] Lighthouse scores:
    - [ ] Performance > 90
    - [ ] Accessibility > 90
    - [ ] Best Practices > 90
    - [ ] SEO > 90

- [ ] **API Monitoring**
  - [ ] Edge Functions responding (200 status)
  - [ ] OpenAI API calls succeeding
  - [ ] Rate limits not exceeded
  - [ ] Database connections stable

- [ ] **User Activity**
  - [ ] New user signups working
  - [ ] Existing users can log in
  - [ ] Persona detection working for new users
  - [ ] No user-reported critical bugs

#### 24-Hour Checks

- [ ] **Usage Metrics**
  - [ ] Track persona detection invocations
  - [ ] Track relationship analysis invocations
  - [ ] Monitor OpenAI API costs
  - [ ] Check database growth rate

- [ ] **Error Analysis**
  - [ ] Review all error logs
  - [ ] Identify any patterns
  - [ ] Create tickets for issues
  - [ ] Prioritize critical bugs

- [ ] **User Feedback**
  - [ ] Monitor support channels
  - [ ] Check user feedback forms
  - [ ] Review social media mentions
  - [ ] Collect feature requests

#### 48-Hour Checks

- [ ] **Performance Review**
  - [ ] Analyze slow queries
  - [ ] Review Edge Function performance
  - [ ] Check for memory leaks
  - [ ] Optimize if needed

- [ ] **Cost Analysis**
  - [ ] OpenAI API costs within budget
  - [ ] Supabase usage within plan limits
  - [ ] Hosting costs acceptable
  - [ ] Adjust rate limits if needed

- [ ] **Feature Adoption**
  - [ ] % of users discovering personas
  - [ ] % of users using relationship analysis
  - [ ] % of users setting branding strategies
  - [ ] % of users completing milestones

---

### Stage 6: Rollback Procedures (If Needed)

#### When to Rollback

Rollback if any of these occur:
- Critical security vulnerability discovered
- Data loss or corruption
- Error rate > 10%
- Complete feature failure
- Database migration failure

#### Rollback Steps

1. **Rollback Frontend**
   ```bash
   # Revert to previous deployment
   vercel rollback  # or equivalent for your platform
   ```
   - [ ] Previous version deployed
   - [ ] Users can access app
   - [ ] Old features still work

2. **Rollback Edge Functions**
   ```bash
   # Redeploy previous versions
   git checkout <previous-commit>
   supabase functions deploy detect-personas
   supabase functions deploy analyze-persona-relationships
   ```
   - [ ] Old Edge Functions deployed
   - [ ] Functions responding normally

3. **Rollback Database (Last Resort)**
   ```bash
   # Restore from backup
   supabase db restore --file backup_pre_multipersona_YYYYMMDD_HHMMSS.sql
   ```
   - [ ] Backup restored successfully
   - [ ] Data integrity verified
   - [ ] Existing user data preserved

4. **Post-Rollback Communication**
   - [ ] Notify users of temporary issue (if major)
   - [ ] Communicate timeline for fix
   - [ ] Document lessons learned
   - [ ] Plan for re-deployment

---

## Production Checklist Summary

### Critical Path Items (Must Complete)

- [ ] Database migration successful
- [ ] Edge Functions deployed and working
- [ ] Frontend deployed and accessible
- [ ] Authentication working
- [ ] No critical errors in logs
- [ ] Rollback plan tested and ready

### High Priority Items (Complete Before General Release)

- [ ] All automated tests passing
- [ ] Manual testing completed
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Monitoring configured

### Medium Priority Items (Complete Within 1 Week)

- [ ] User feedback collected
- [ ] Analytics tracking verified
- [ ] Cost analysis completed
- [ ] Feature adoption measured
- [ ] Known issues documented

### Nice-to-Have Items (Complete When Possible)

- [ ] Video tutorial created
- [ ] Blog post published
- [ ] Social media announcements
- [ ] Community showcase
- [ ] Feature deep-dive documentation

---

## Emergency Contacts

**On-Call Engineer**: [Name] - [Phone] - [Email]
**Database Admin**: [Name] - [Phone] - [Email]
**DevOps Lead**: [Name] - [Phone] - [Email]
**Product Owner**: [Name] - [Phone] - [Email]

**External Services**:
- Supabase Support: support@supabase.io
- OpenAI Support: https://help.openai.com
- Hosting Support: [Your hosting provider]

---

## Post-Mortem Template (If Issues Occur)

**Date**: YYYY-MM-DD
**Incident Duration**: X hours
**Impact**: [Describe user impact]

**Timeline**:
- [Time] - Issue detected
- [Time] - Investigation started
- [Time] - Root cause identified
- [Time] - Fix deployed
- [Time] - Issue resolved

**Root Cause**: [Detailed explanation]

**Resolution**: [What was done to fix it]

**Prevention**: [What will prevent this in the future]
- [ ] Action item 1
- [ ] Action item 2

**Lessons Learned**: [Key takeaways]

---

## Sign-Off

**Deployment Approved By**:
- [ ] Engineering Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______

**Deployment Executed By**: _________________ Date: _______

**Post-Deployment Verification**: _________________ Date: _______

---

**Version**: 1.0.0
**Last Updated**: 2025-11-24
**Next Review**: After deployment completion
