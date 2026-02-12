# Prisma Upgrade Pre-State Documentation
**Date:** 2026-02-11
**Upgrade Path:** Prisma 5.22.0 → 6.0.0 → 7.4.0

---

## 1. Backups Created ✅

| Environment | File | Size | Status |
|-------------|------|------|--------|
| Production | `backup-pre-prisma-upgrade-20260211.sql` | 413K | ✅ Created |
| Staging | `backup-staging-pre-prisma-upgrade-20260211.sql` | 70K | ✅ Created |

**Backup Command Used:**
```bash
# Production
ssh root@31.97.255.107 "docker-compose -f /var/www/hallyuhub/docker-compose.prod.yml exec -T postgres-production pg_dump -U hallyuhub hallyuhub_production" > backup-pre-prisma-upgrade-20260211.sql

# Staging
ssh root@31.97.255.107 "docker-compose -f /var/www/hallyuhub/docker-compose.staging.yml exec -T postgres-staging pg_dump -U hallyuhub hallyuhub_staging" > backup-staging-pre-prisma-upgrade-20260211.sql
```

---

## 2. Current Versions

```
hallyuhub-v1@1.0.0
├─┬ @next-auth/prisma-adapter@1.0.7 (⚠️ 3 years old, unmaintained)
│ └── @prisma/client@5.22.0
├─┬ @prisma/client@5.22.0
│ └── prisma@5.22.0
└── prisma@5.22.0
```

**Key Observations:**
- Prisma Client: 5.22.0 (current)
- Prisma CLI: 5.22.0 (current)
- NextAuth Adapter: 1.0.7 (last published 3 years ago - **HIGH RISK**)

---

## 3. Migration Status

### Production
```
15 migrations found in prisma/migrations
Database schema is up to date! ✅

Update available: 5.22.0 -> 7.4.0
Guide: https://pris.ly/d/major-version-upgrade
```

### Local Dev
```
15 migrations found in prisma/migrations
All migrations have been successfully applied ✅

Last applied: 20260211_add_artist_tmdbid_unique
```

**Status:** All environments synchronized ✅

---

## 4. PrismaClient Anti-Patterns Found

**Total instances of `new PrismaClient()`:** 14 files

| File | Type | Priority |
|------|------|----------|
| `lib/prisma.ts` | ✅ Singleton (correct) | - |
| `app/api/cron/update/route.ts` | ❌ Anti-pattern | 🔴 HIGH |
| `lib/services/tmdb-artist-service.ts` | ❌ Anti-pattern | 🟡 MEDIUM |
| `scripts/atualize-ai.ts` | ❌ Anti-pattern | 🔴 HIGH |
| `scripts/backfill-news-artists.ts` | ❌ Anti-pattern | 🟡 MEDIUM |
| `scripts/refresh-productions.ts` | ❌ Anti-pattern | 🟡 MEDIUM |
| `scripts/refresh-images.ts` | ❌ Anti-pattern | 🟡 MEDIUM |
| `scripts/refresh-news-images.ts` | ❌ Anti-pattern | 🟡 MEDIUM |
| `scripts/google-drive-upload.ts` | ❌ Anti-pattern | 🟡 MEDIUM |
| `scripts/ai-stats.ts` | ❌ Anti-pattern | 🟢 LOW |
| `scripts/check-artists.ts` | ❌ Anti-pattern | 🟢 LOW |
| `scripts/check-activity.ts` | ❌ Anti-pattern | 🟢 LOW |
| `scripts/deduplicate-artists.ts` | ❌ Anti-pattern | 🟡 MEDIUM |
| `scripts/debug-artist-gen.ts` | ❌ Anti-pattern | 🟢 LOW |

**Risk Assessment:**
- 🔴 **HIGH RISK:** Cron route and main update script (production traffic)
- 🟡 **MEDIUM RISK:** Data refresh/sync scripts (run frequently)
- 🟢 **LOW RISK:** Debug/stats scripts (run occasionally)

**Impact:** Connection pool exhaustion under load → Production instability

---

## 5. NextAuth Adapter Compatibility Research

### Current State
- Package: `@next-auth/prisma-adapter@1.0.7`
- Last published: 3 years ago
- Status: **Unmaintained** ⚠️

### Compatibility Findings

**Key Issue:** The `@next-auth/prisma-adapter` package is deprecated and unmaintained. Official guidance suggests:

1. **NextAuth v4:** Use `@next-auth/prisma-adapter` (current, but old)
2. **NextAuth v5 / Auth.js:** Use `@auth/prisma-adapter` (modern, maintained)

**Prisma 7 Compatibility:**
- No explicit documentation found for Prisma 7 + `@next-auth/prisma-adapter@1.0.7`
- High risk of incompatibility due to:
  - Package age (3 years)
  - Major Prisma version changes (5→6→7)
  - TypeScript engine rewrite in Prisma 7

### NextAuth Version Detected
**Version:** next-auth@4.24.13 ✅

**Recommended Action:** Since we're using NextAuth v4:
1. ✅ Keep `@next-auth/prisma-adapter@1.0.7` for now (compatible with v4)
2. Test with Prisma 6 first (likely works)
3. Only migrate to `@auth/prisma-adapter` + NextAuth v5 if incompatibility issues arise
4. Monitor for any adapter-related errors during upgrade

**Decision:** Proceed with current adapter, test thoroughly in staging

### Sources
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)
- [NextAuth.js Prisma Adapter](https://next-auth.js.org/v3/adapters/prisma)
- [@auth/prisma-adapter on npm](https://www.npmjs.com/package/@auth/prisma-adapter)
- [Prisma + Auth.js Guide](https://www.prisma.io/docs/guides/authjs-nextjs)

---

## 6. Prisma Schema Configuration

### Current Binary Targets
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x", "debian-openssl-3.0.x"]
}
```

**Prisma 7 Change:** Binary targets will be **removed** (TypeScript engine doesn't need them)

### Database Models
- **Total Models:** 20
- **Total Migrations:** 15
- **Complex Features Used:**
  - Array fields (`stageNames[]`, `tags[]`)
  - JSON fields (`socials`, `socialLinks`)
  - Many-to-many relations (`ArtistProduction`, `NewsArtist`)
  - Cascade deletes
  - UUID generation (`gen_random_uuid()`)
  - Null ordering in queries

---

## 7. Risk Summary

| Risk Category | Severity | Mitigation |
|---------------|----------|------------|
| Connection pool exhaustion | 🔴 HIGH | Consolidate PrismaClient instances BEFORE upgrade |
| NextAuth adapter incompatibility | 🔴 HIGH | Verify NextAuth version, potentially migrate adapter |
| Binary targets removal | 🟡 MEDIUM | Test Docker build thoroughly after Prisma 7 |
| Complex SQL migrations | 🟡 MEDIUM | Validate array/JSON operations post-upgrade |
| Environment variable loading | 🟡 MEDIUM | Add `dotenv/config` to all scripts |

---

## 8. Next Steps

### Immediate Actions (Phase 0 Remaining)
1. ✅ Backups created
2. ✅ Current state documented
3. ⏳ Verify NextAuth version
4. ⏳ Make NextAuth adapter migration decision

### Phase 1 (Prisma 5→6)
1. Consolidate all 13 anti-pattern PrismaClient instances
2. Upgrade to Prisma 6.0.0
3. Test migration locally
4. Deploy to staging (48h validation)
5. Deploy to production

---

**Documentation Generated:** 2026-02-11 23:28
**Generated By:** Claude Code (Prisma Upgrade Plan Phase 0)
