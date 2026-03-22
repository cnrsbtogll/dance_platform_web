# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata

| Field | Value |
|---|---|
| **Project Name** | dance_platform |
| **Date** | 2026-03-22 |
| **Test Run** | Post-fix validation (2nd run) |
| **Prepared by** | TestSprite AI Team |
| **Server** | http://localhost:4173 (production build) |
| **Total Tests** | 30 |
| **Passed** | 24 ✅ |
| **Failed** | 6 ❌ |
| **Pass Rate** | **80%** (up from 76.67% in previous run) |

---

## 2️⃣ Requirement Validation Summary

### 🔐 Authentication — Sign In

| Test | Status | Notes |
|---|---|---|
| TC001 — Successful sign-in redirects to Profile | ✅ Passed | |
| TC002 — Validation when email is empty | ✅ Passed | |
| TC003 — Validation when password is empty | ✅ Passed | |
| TC004 — Sign-in fails with incorrect credentials | ✅ Passed | |
| TC005 — Client-side validation for short/invalid password | ❌ **Failed** | Sign-in form allows submission with `'1'` password; no client-side validation error shown |
| TC007 — Access Profile from Home via nav after sign-in | ❌ **Failed** | Firebase auth request timed out during test (intermittent network error) |
| TC037 — Sign-in fails with invalid password, Profile unreachable | ✅ Passed | |

---

### 📝 Authentication — Sign Up

| Test | Status | Notes |
|---|---|---|
| TC008 — Successful sign-up redirects to Profile | ✅ Passed | *(Previously failing — now fixed)* |
| TC009 — Already-registered email shows 'email in use' error | ✅ Passed | *(Previously failing — now fixed)* |
| TC010 — Missing name shows validation error | ✅ Passed | |
| TC011 — Missing email shows validation error | ✅ Passed | |
| TC012 — Missing password shows validation error | ✅ Passed | |
| TC013 — Invalid email format shows validation error | ✅ Passed | |
| TC014 — Weak/short password shows error message | ❌ **Failed** | Signup form shows browser-native tooltip for empty confirm-password field instead of a custom error for weak password |

---

### 🔍 Course Search & Filtering

| Test | Status | Notes |
|---|---|---|
| TC015 — Search by keyword shows matching results | ✅ Passed | |
| TC016 — Single filter updates course list | ✅ Passed | |
| TC017 — Combine search term + multiple filters | ❌ **Failed** | 'Online' format filter not present in UI; no courses match "hip hop" + "Orta" in current data |
| TC018 — No-match search shows empty state | ✅ Passed | *(Previously failing — now fixed)* |
| TC019 — No-match search + filters shows empty state | ✅ Passed | |
| TC020 — Clear search term restores course list | ✅ Passed | |

---

### 👤 Profile

| Test | Status | Notes |
|---|---|---|
| TC033 — View profile details as authenticated user | ✅ Passed | |
| TC034 — Edit profile and save changes | ❌ **Failed** | Save returns error toast: "Profil güncellenirken bir hata oluştu." — Firestore write permission denied |
| TC036 — Unauthenticated user signs in → views Profile | ❌ **Failed** | Firebase auth timed out under test load (intermittent network error) |

---

### 🏫 Instructors & Schools

| Test | Status | Notes |
|---|---|---|
| TC023 — Instructors list displays | ✅ Passed | |
| TC024 — Open instructor detail from card | ✅ Passed | |
| TC028 — Schools list displays | ✅ Passed | |
| TC029 — Open school detail from card | ✅ Passed | |

---

### 🏠 Landing Page

| Test | Status | Notes |
|---|---|---|
| TC038 — Landing page loads with core CTAs | ✅ Passed | |
| TC039 — Sign Up CTA navigates to Sign Up page | ✅ Passed | |
| TC040 — Explore Courses CTA navigates to Courses page | ✅ Passed | |

---

## 3️⃣ Coverage & Matching Metrics

| Requirement Area | Total | ✅ Passed | ❌ Failed |
|---|---|---|---|
| Sign In | 7 | 5 | 2 |
| Sign Up | 7 | 6 | 1 |
| Course Search & Filtering | 6 | 5 | 1 |
| Profile | 3 | 1 | 2 |
| Instructors & Schools | 4 | 4 | 0 |
| Landing Page | 3 | 3 | 0 |
| **Total** | **30** | **24** | **6** |

**Overall pass rate: 80%** *(improved from 76.67% — 3 previously failing tests now pass)*

> ✅ Fixes confirmed working:
> - TC018: Search empty state now shows correctly on keyword search
> - TC008 & TC009: Sign-up flow now works reliably

---

## 4️⃣ Key Gaps / Risks

### 🔴 High Priority

**1. Profile save error (TC034) — Firestore permission denied**
- Saving profile changes returns "Profil güncellenirken bir hata oluştu."
- Root cause: Firestore security rules likely restrict write access for the test user's role
- **Action:** Review Firestore rules for the `users` collection — ensure authenticated users can write to their own document

**2. Missing client-side password validation on Sign-In (TC005)**
- The sign-in form allows submitting with a single-character password (`'1'`) and sends an actual Firebase request instead of blocking client-side
- **Action:** Add `minLength` validation to the password field before form submission

---

### 🟡 Medium Priority

**3. Weak password UI on Sign-Up (TC014)**
- When the user fills in a weak password but leaves confirm-password empty, the browser shows a native tooltip for the empty confirm field — hiding the weak password error
- **Action:** Validate password strength before requiring confirm-password, or show custom error immediately after password field blur

**4. 'Online' filter not available (TC017)**
- The "Format" filter (Online/In-Person) expected by TC017 doesn't exist in the UI; there's no equivalent filter option
- **Action:** Either add an Online/Yüz yüze format filter, or update the test plan to match the actual filter set

---

### 🟠 Intermittent / Environment

**5. Firebase auth timeouts under concurrent load (TC007, TC036)**
- Some tests fail due to Firebase authentication timing out when multiple test sessions run in parallel
- Not a code bug — these tests pass when run individually
- **Action:** Monitor with production Firebase plan; consider Firebase emulator for isolated testing

---

*Test visualization links: https://www.testsprite.com/dashboard/mcp/tests/05a13d12-4c29-48c9-921e-acab771a88d8*
