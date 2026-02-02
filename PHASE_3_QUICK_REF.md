# Phase 3: UI Components - Quick Reference

**Status:** ✅ COMPLETE  
**Files Created:** 15 Kotlin files  
**Progress:** 37.5% of total migration

---

## 📁 File Structure

```
android/app/src/main/kotlin/com/caredroid/clinical/
├── ui/
│   ├── components/
│   │   ├── LoadingIndicator.kt       (Progress indicators)
│   │   ├── ErrorDialog.kt            (Error & confirmation dialogs)
│   │   ├── TopBar.kt                 (App bar with navigation)
│   │   ├── ChatMessageBubble.kt      (Message display + typing indicator)
│   │   ├── ChatInputArea.kt          (Text input + send button)
│   │   └── Sidebar.kt                (Navigation drawer)
│   ├── screens/
│   │   ├── ChatScreen.kt             (Main chat interface)
│   │   ├── LoginScreen.kt            (Authentication)
│   │   ├── SignupScreen.kt           (Registration)
│   │   ├── SettingsScreen.kt         (App settings)
│   │   ├── ProfileScreen.kt          (User profile)
│   │   ├── TeamScreen.kt             (Team management)
│   │   └── AuditLogsScreen.kt        (Audit trail)
│   └── navigation/
│       └── AppNavigation.kt          (NavHost + routes + deep links)
└── util/
    └── AppConstants.kt               (Routes, API, DataStore, UI constants)
```

---

## 🎨 Core Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **LoadingIndicator** | Show loading state | Centered circular progress, optional message |
| **ErrorDialog** | Show errors/confirmations | Error alert, confirmation variant, retry action |
| **TopBar** | App bar with navigation | Title, back/menu button, settings icon |
| **ChatMessageBubble** | Display messages | User/assistant styles, timestamp, typing indicator |
| **ChatInputArea** | Message input | TextField, send button, character limit (1000) |
| **Sidebar** | Navigation drawer | Profile, menu, clinical tools grid, sign out |

---

## 📱 Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| **LoginScreen** | `/login` | Email + password authentication |
| **SignupScreen** | `/signup` | New user registration |
| **ChatScreen** | `/chat` | Main chat interface with messages |
| **SettingsScreen** | `/settings` | App preferences and settings |
| **ProfileScreen** | `/profile` | User profile and account |
| **TeamScreen** | `/team` | Team member management |
| **AuditLogsScreen** | `/audit` | System audit logs |

---

## 🧭 Navigation Routes

```kotlin
// Defined in AppConstants.Routes
LOGIN    = "login"     // Start destination
SIGNUP   = "signup"    // Registration
CHAT     = "chat"      // Main screen
SETTINGS = "settings"  // App settings
PROFILE  = "profile"   // User profile
TEAM     = "team"      // Team management
AUDIT    = "audit"     // Audit logs
```

### Deep Links
```
caredroid://login
caredroid://signup
caredroid://chat
caredroid://chat/{conversationId}
caredroid://settings
caredroid://profile
caredroid://team
caredroid://audit
```

---

## 🔄 Navigation Flows

```
Login ──────> Chat (clear back stack)
  │
  └──> Signup ──> Chat (clear back stack)

Chat ──> Settings (back stack)
     ──> Profile (back stack)
     ──> Team (back stack)
     ──> Audit (back stack)

Profile ──> Logout ──> Login (clear all)
```

---

## 📦 Component Usage Examples

### LoadingIndicator
```kotlin
if (isLoading) {
    LoadingIndicator(message = "Sending message...")
}
```

### ErrorDialog
```kotlin
if (error != null) {
    ErrorDialog(
        title = "Error",
        message = error,
        onDismiss = { error = null },
        onRetry = { retry() }
    )
}
```

### ChatMessageBubble
```kotlin
ChatMessageBubble(
    message = "What medications interact with Warfarin?",
    isUser = true,
    timestamp = "10:30 AM"
)

if (isTyping) {
    TypingIndicator()
}
```

### ChatInputArea
```kotlin
ChatInputArea(
    message = messageText,
    onMessageChange = { messageText = it },
    onSendClick = { sendMessage() },
    enabled = !isLoading
)
```

### Sidebar
```kotlin
Sidebar(
    userName = "Dr. Sarah Johnson",
    userEmail = "sarah@hospital.com",
    userRole = "Clinical Admin",
    onNavigate = { route -> navController.navigate(route) },
    onToolClick = { tool -> openTool(tool) },
    onSignOut = { logout() }
)
```

---

## 🎯 Integration with ViewModels (Phase 4)

### Screen → ViewModel Pattern
```kotlin
@Composable
fun ChatScreen(
    viewModel: ChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    ChatScreenContent(
        messages = uiState.messages,
        isLoading = uiState.isLoading,
        onSendMessage = viewModel::sendMessage
    )
}
```

### Required ViewModels (Phase 4)
- ✅ Screen layouts ready: `ChatViewModel`, `AuthViewModel`, `SettingsViewModel`
- ✅ Screen layouts ready: `ProfileViewModel`, `ToolsViewModel`
- ✅ Callback structure: All screens use callbacks for events
- ✅ State handling: Local state with `remember`, ready for StateFlow

---

## 🎨 Material3 Components Used

- **Scaffold** - Screen structure
- **TopAppBar** - App bar
- **ModalNavigationDrawer** - Sidebar
- **LazyColumn** - Scrollable lists
- **Card** - Surface containers
- **OutlinedTextField** - Text input
- **Button / IconButton** - Actions
- **FilterChip** - Selection filters
- **Switch** - Toggle settings
- **AlertDialog** - Modals
- **CircularProgressIndicator** - Loading

---

## 📊 Constants Reference

### AppConstants.DataStore Keys
```kotlin
KEY_AUTH_TOKEN           // JWT access token
KEY_REFRESH_TOKEN        // JWT refresh token
KEY_USER_ID              // User ID
KEY_USER_EMAIL           // User email
KEY_USER_ROLE            // User role (admin/clinician)
KEY_THEME_MODE           // Theme preference
KEY_NOTIFICATIONS_ENABLED // Notification toggle
KEY_BIOMETRIC_ENABLED    // Biometric auth toggle
```

### AppConstants.UI
```kotlin
MAX_MESSAGE_LENGTH       = 1000     // Chat input limit
ANIMATION_DURATION_MS    = 300      // UI animations
TYPING_INDICATOR_DELAY_MS = 500     // Typing delay
```

### AppConstants.Tools
```kotlin
DRUG_CHECKER            = "drug-checker"
SOFA_CALCULATOR         = "sofa-calculator"
LAB_INTERPRETER         = "lab-interpreter"
CLINICAL_GUIDELINES     = "clinical-guidelines"
```

---

## ✅ Completion Checklist

- [x] 6 core components created
- [x] 7 screens implemented
- [x] Navigation system complete
- [x] Deep links configured
- [x] Constants centralized
- [x] Material3 design applied
- [x] Dark theme support
- [x] Loading states
- [x] Error handling
- [x] Empty states
- [x] Validation logic
- [x] Callback structure
- [x] Accessibility ready

---

## 🚀 Next Phase: State Management

### Phase 4 Tasks
1. Create ViewModels for each screen
2. Define UiState data classes
3. Use StateFlow for reactive UI
4. Connect to Repositories (from Phase 2)
5. Handle all async operations
6. Implement Hilt injection

### Expected Integration
```kotlin
// Phase 3 (Current)
ChatScreen(onNavigateToSettings = { })

// Phase 4 (Next)
ChatScreen(
    viewModel = hiltViewModel(),
    onNavigateToSettings = { }
)

// ViewModel will provide:
val uiState: StateFlow<ChatUiState>
fun sendMessage(text: String)
fun loadConversations()
```

---

## 📝 Key Takeaways

✅ **Complete UI Layer** - All screens and components ready  
✅ **Material3 Design** - Modern Android design system  
✅ **Navigation Ready** - Full routing with deep links  
✅ **State Structure** - Prepared for ViewModel integration  
✅ **Reusable Components** - DRY principle applied  
✅ **Production Quality** - Clean, maintainable code  

**Migration Progress:** 37.5% complete (3/8 phases)

---

**Last Updated:** February 2, 2026  
**Next Phase:** ViewModels & State Management
