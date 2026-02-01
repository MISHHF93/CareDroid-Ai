# ✅ Android Migration Checklist

## Pre-Migration Setup

- [ ] **Review Migration Plan** - Read ANDROID_MIGRATION_PLAN.md thoroughly
- [ ] **Install Android Studio** - Hedgehog (2023.1.1) or newer
- [ ] **Install JDK 17** - Required for Kotlin 1.9.22
- [ ] **Setup Android SDK** - API Level 35 (Android 15)
- [ ] **Create Firebase Project** - For push notifications
- [ ] **Setup Git Branch** - `feature/native-android-migration`
- [ ] **Backup Current Code** - Tag current state as `v1.0-hybrid`

---

## Phase 1: Foundation (Week 1-2)

### Dependencies
- [ ] Add Jetpack Compose BOM to `android/app/build.gradle`
- [ ] Add Hilt dependency injection
- [ ] Add Room database
- [ ] Add DataStore preferences
- [ ] Add Navigation Compose
- [ ] Enable Compose in buildFeatures
- [ ] Update kotlinOptions to jvmTarget 17
- [ ] Add KAPT plugin

### Project Structure
- [ ] Create `CareDroidApplication.kt` with @HiltAndroidApp
- [ ] Create `di/` package for Hilt modules
- [ ] Create `data/local/` for Room
- [ ] Create `data/remote/` for Retrofit
- [ ] Create `domain/` for models and use cases
- [ ] Create `ui/theme/` for Material3 theme
- [ ] Create `ui/screens/` for screen composables
- [ ] Create `ui/components/` for reusable components

### Theme Setup
- [ ] Create `Color.kt` with CareDroid color palette
- [ ] Create `Theme.kt` with Material3 dark theme
- [ ] Create `Type.kt` with typography definitions
- [ ] Test theme in MainActivity

---

## Phase 2: API Layer (Week 2-3)

### DTOs (Data Transfer Objects)
- [ ] Create `AuthDto.kt` (LoginRequest, LoginResponse, UserDto)
- [ ] Create `ChatDto.kt` (MessageRequest, MessageResponse, CitationDto)
- [ ] Create `ConversationDto.kt`
- [ ] Create `ToolsDto.kt` (Drug, Lab, SOFA)
- [ ] Create `HealthDto.kt`

### API Service
- [ ] Create `CareDroidApiService.kt` interface
- [ ] Add all auth endpoints (login, register, me)
- [ ] Add all chat endpoints (message, conversations)
- [ ] Add all tools endpoints (drug-interactions, lab, sofa)
- [ ] Add health check endpoint

### Network Setup
- [ ] Create `NetworkModule.kt` Hilt module
- [ ] Configure OkHttpClient with logging
- [ ] Configure Retrofit with Gson
- [ ] Create token interceptor
- [ ] Create `NetworkResult` sealed class for responses

### Repository
- [ ] Create `ChatRepository.kt`
- [ ] Create `AuthRepository.kt`
- [ ] Create `ToolsRepository.kt`
- [ ] Implement error handling
- [ ] Add network connectivity checks

---

## Phase 3: UI Components (Week 3-5)

### Core Components
- [ ] Migrate Sidebar to `Sidebar.kt` Composable
  - [ ] Header with logo
  - [ ] User profile card
  - [ ] Navigation menu
  - [ ] Clinical tools grid
  - [ ] Recent conversations
  - [ ] Footer with sign out
- [ ] Create `ChatMessageBubble.kt`
- [ ] Create `ChatInputArea.kt`
- [ ] Create `TopBar.kt`
- [ ] Create `LoadingIndicator.kt`
- [ ] Create `ErrorDialog.kt`

### Screens
- [ ] Create `ChatScreen.kt`
  - [ ] Message list with LazyColumn
  - [ ] Input area at bottom
  - [ ] Typing indicator
  - [ ] Empty state
- [ ] Create `LoginScreen.kt`
- [ ] Create `SignupScreen.kt`
- [ ] Create `SettingsScreen.kt`
- [ ] Create `ProfileScreen.kt`
- [ ] Create `TeamScreen.kt`
- [ ] Create `AuditLogsScreen.kt`

### Navigation
- [ ] Create `AppNavigation.kt` with NavHost
- [ ] Define all routes as constants
- [ ] Implement navigation graphs
- [ ] Add deep link support

---

## Phase 4: State Management (Week 5-6)

### ViewModels
- [ ] Create `ChatViewModel.kt`
  - [ ] Message state management
  - [ ] Send message function
  - [ ] Load conversations
  - [ ] Health check polling
- [ ] Create `AuthViewModel.kt`
  - [ ] Login function
  - [ ] Signup function
  - [ ] Token persistence
  - [ ] Auto-refresh token
- [ ] Create `SettingsViewModel.kt`
- [ ] Create `ProfileViewModel.kt`
- [ ] Create `ToolsViewModel.kt`
- [ ] Create `SidebarViewModel.kt`

### UI State
- [ ] Define `ChatUiState` data class
- [ ] Define `AuthUiState` data class
- [ ] Use StateFlow for reactive UI
- [ ] Handle loading states
- [ ] Handle error states

---

## Phase 5: Local Data (Week 6-7)

### Room Database
- [ ] Create `CareDroidDatabase.kt`
- [ ] Create `MessageEntity.kt`
- [ ] Create `ConversationEntity.kt`
- [ ] Create `UserEntity.kt`
- [ ] Create `MessageDao.kt`
- [ ] Create `ConversationDao.kt`
- [ ] Add database migrations

### DataStore
- [ ] Create `PreferencesManager.kt`
- [ ] Define preference keys
- [ ] Implement auth token storage
- [ ] Implement settings storage
- [ ] Create Flow-based getters

### Offline Support
- [ ] Cache messages locally
- [ ] Queue messages when offline
- [ ] Sync when online
- [ ] Show offline indicator in UI

---

## Phase 6: Native Features (Week 7-8)

### Push Notifications
- [ ] Add Firebase to project
- [ ] Create `CareDroidMessagingService.kt`
- [ ] Handle notification permissions
- [ ] Send FCM token to backend
- [ ] Test notification reception
- [ ] Create notification channels

### Biometric Auth
- [ ] Add biometric library
- [ ] Create `BiometricPrompt` composable
- [ ] Implement fingerprint unlock
- [ ] Implement face unlock
- [ ] Add fallback to PIN

### Additional Features
- [ ] Implement voice input (Speech-to-text)
- [ ] Add camera integration
- [ ] Create local notifications
- [ ] Implement share functionality
- [ ] Add app shortcuts

---

## Phase 7: Testing (Week 8-9)

### Unit Tests
- [ ] Test all ViewModels
- [ ] Test all Repositories
- [ ] Test API service calls (mock)
- [ ] Test database operations
- [ ] Test business logic
- [ ] Achieve 80%+ coverage

### UI Tests
- [ ] Test login flow
- [ ] Test chat message sending
- [ ] Test navigation
- [ ] Test offline mode
- [ ] Test error states

### Integration Tests
- [ ] Test end-to-end chat flow
- [ ] Test authentication flow
- [ ] Test offline sync
- [ ] Test push notifications

### Performance
- [ ] Profile app with Android Profiler
- [ ] Fix memory leaks (LeakCanary)
- [ ] Optimize database queries
- [ ] Reduce APK size
- [ ] Test on low-end devices

---

## Phase 8: Deployment (Week 9-10)

### Release Configuration
- [ ] Generate release keystore
- [ ] Configure signing in build.gradle
- [ ] Set up ProGuard rules
- [ ] Test release build
- [ ] Verify obfuscation

### Play Store Setup
- [ ] Create developer account ($25)
- [ ] Design app icon (512x512)
- [ ] Create feature graphic (1024x500)
- [ ] Take screenshots (phone & tablet)
- [ ] Write app description
- [ ] Prepare privacy policy
- [ ] Complete content rating
- [ ] Set up pricing (free)

### Testing Tracks
- [ ] Upload to Internal Testing
- [ ] Test with team members
- [ ] Upload to Closed Beta
- [ ] Get feedback from beta testers
- [ ] Upload to Production
- [ ] Monitor crash reports

### Post-Launch
- [ ] Monitor Play Console metrics
- [ ] Respond to user reviews
- [ ] Fix critical bugs ASAP
- [ ] Plan first update

---

## Migration Commands

### Initial Setup
```bash
# Clone and switch to migration branch
git checkout -b feature/native-android-migration

# Open in Android Studio
cd android
code .  # or open with Android Studio
```

### Add Dependencies (Phase 1)
```bash
# android/app/build.gradle
# Add Compose BOM and other dependencies (see ANDROID_MIGRATION_PLAN.md Phase 1.1)
```

### Build and Run
```bash
# Build debug
./gradlew assembleDebug

# Install on device
./gradlew installDebug

# Run tests
./gradlew test

# Run UI tests
./gradlew connectedAndroidTest
```

### Generate Release
```bash
# Build release bundle (for Play Store)
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Progress Tracking

**Current Phase:** 🔴 Not Started  
**Estimated Start:** February 2026  
**Estimated Completion:** April 2026  
**Total Progress:** 0/8 phases complete

### Phase Status
- [ ] Phase 1: Foundation - 0%
- [ ] Phase 2: API Layer - 0%
- [ ] Phase 3: UI Components - 0%
- [ ] Phase 4: State Management - 0%
- [ ] Phase 5: Local Data - 0%
- [ ] Phase 6: Native Features - 0%
- [ ] Phase 7: Testing - 0%
- [ ] Phase 8: Deployment - 0%

---

## Resources

### Documentation
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Material3 Guidelines](https://m3.material.io/)
- [Hilt Dependency Injection](https://dagger.dev/hilt/)
- [Retrofit](https://square.github.io/retrofit/)
- [Room Database](https://developer.android.com/training/data-storage/room)

### Tools
- [Android Studio](https://developer.android.com/studio)
- [Kotlin Playground](https://play.kotlinlang.org/)
- [Figma for UI](https://www.figma.com/)
- [Postman for API testing](https://www.postman.com/)

### Sample Projects
- [Now in Android](https://github.com/android/nowinandroid)
- [Jetpack Compose Samples](https://github.com/android/compose-samples)

---

## Questions or Issues?

Create an issue in the repo or contact the migration team lead.

**Last Updated:** February 1, 2026  
**Status:** 🟠 Ready to Start
