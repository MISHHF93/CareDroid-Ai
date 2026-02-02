# 🚀 Phase 1 Quick Reference Card

## ✅ Status: COMPLETE

**Date:** February 1, 2026  
**Progress:** 1/8 Phases (12.5%)  
**Files Created:** 20 Kotlin files  
**Next Phase:** API Layer

---

## 📁 Key Directories

```
android/app/src/main/kotlin/com/caredroid/clinical/
├── 📱 CareDroidApplication.kt    # App entry point
├── 📱 MainActivity.kt            # Main activity
├── 💾 data/                      # Data layer
├── 🏛️ domain/                    # Business logic
├── 🎯 di/                        # Hilt modules
├── 🎨 ui/                        # Compose UI
└── 🔧 util/                      # Utilities
```

---

## 🎨 Theme Usage

```kotlin
@Composable
fun MyScreen() {
    CareDroidTheme {
        Surface(
            color = MaterialTheme.colorScheme.background
        ) {
            Text(
                text = "Hello CareDroid",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
```

---

## 🎯 Dependency Injection

```kotlin
@HiltViewModel
class MyViewModel @Inject constructor(
    private val repository: MyRepository
) : ViewModel() {
    // ViewModel logic
}

@Composable
fun MyScreen(
    viewModel: MyViewModel = hiltViewModel()
) {
    // Screen content
}
```

---

## 🧭 Navigation

```kotlin
// In AppNavigation.kt
NavHost(navController, startDestination = "home") {
    composable("home") { HomeScreen(navController) }
    composable("details/{id}") { backStackEntry ->
        DetailsScreen(id = backStackEntry.arguments?.getString("id"))
    }
}

// Navigate from screen
navController.navigate("details/123")
```

---

## 💾 Database (Room)

```kotlin
@Dao
interface MessageDao {
    @Query("SELECT * FROM messages")
    fun getAllMessages(): Flow<List<Message>>
    
    @Insert
    suspend fun insertMessage(message: Message)
}

// Usage in ViewModel
viewModelScope.launch {
    messageDao.insertMessage(message)
}
```

---

## 🌐 API Calls (Retrofit)

```kotlin
interface ApiService {
    @POST("/api/chat")
    suspend fun sendMessage(@Body request: MessageRequest): Response<MessageResponse>
}

// Usage in Repository
suspend fun sendMessage(message: String): Result<Message> {
    return try {
        val response = apiService.sendMessage(MessageRequest(message))
        Result.success(response.toMessage())
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

---

## 🎨 Key Colors

```kotlin
Blue500      = #3B82F6  // Primary
Cyan400      = #22D3EE  // Secondary
Navy900      = #0a0e27  // Background
Navy800      = #0F172A  // Surface
Success      = #10B981  // Green
Error        = #EF4444  // Red
```

---

## 📱 Common Composables

```kotlin
// Loading
CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)

// Button
Button(onClick = { /* action */ }) {
    Text("Click Me")
}

// Card
Card(
    modifier = Modifier.fillMaxWidth(),
    colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface
    )
) {
    Text("Card Content")
}
```

---

## 🔧 Build Commands

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run unit tests
./gradlew test

# Run UI tests
./gradlew connectedAndroidTest

# Install on device
./gradlew installDebug
```

---

## 📝 Next Phase Checklist

**Phase 2: API Layer**
- [ ] Create all DTOs
- [ ] Implement API service
- [ ] Setup network module
- [ ] Create repositories
- [ ] Add error handling

---

## 📚 Resources

- [Compose Docs](https://developer.android.com/jetpack/compose)
- [Hilt Guide](https://dagger.dev/hilt/)
- [Material3](https://m3.material.io/)
- [Room DB](https://developer.android.com/training/data-storage/room)

---

**Phase 1 Foundation: Complete! 🎉**
