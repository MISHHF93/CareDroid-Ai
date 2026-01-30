# CareDroid Layout Specification

## 1) Purpose
- Define the new shell architecture, login-first flow, and page organization.
- Ensure medical tools are only shown inside chat.

## 2) Shells

### AuthShell (Unauthenticated)
- Routes: /auth, /auth/callback
- No sidebar, no tool panels, no app navigation
- Centered auth card, institutional + social login

### AppShell (Authenticated)
- Routes: /, /settings, /profile, /profile-settings, /onboarding
- Header: app title, health status, signed-in badge
- Left nav: conversations, profile/settings links
- Content area: route outlet
- Tools: only inside chat route

## 3) Routing Rules
- If no token: redirect all routes to /auth
- If token: allow app routes, redirect /auth → /
- /auth/callback stores token, then routes to /

## 4) Chat (Tools Only Here)
- Tool selection, tool panel, feature inventory live inside chat view only
- Other pages show no medical tools or tool panels

## 5) Auth Methods
- Institutional (primary): email magic link
- Secondary: OIDC SSO, SAML SSO
- Social: Google, LinkedIn
- Email/password as fallback

## 6) Pages
- Auth: login hub (institutional + social + email/password)
- AuthCallback: token capture and finalize sign-in
- Onboarding: steps for role, focus, safety
- Settings: app preferences
- Profile: user summary
- Profile Settings: profile edit

## 7) UI Principles
- Minimal, clinical, high-contrast
- Dark/light support via CSS variables
- Responsive: sidebar collapses on small screens
- Toasts for errors and success
