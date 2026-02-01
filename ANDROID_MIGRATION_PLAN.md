# 🤖 CareDroid: Web-to-Native Android Migration Plan

## 📊 Current State Analysis

### **What We Have Now:**
- **Hybrid App**: React web app wrapped in Android WebView (Capacitor)
- **Frontend**: Vite + React (running on localhost:8000)
- **Backend**: NestJS API (running on localhost:3000)
- **Android Shell**: Minimal Kotlin MainActivity loads web app in WebView
- **Dependencies**: Already configured for native development (Retrofit, Coroutines, Material Design)

### **Current Architecture:**
```
┌─────────────────────────────────────┐
│   Android App (Hybrid)              │
│  ┌──────────────────────────────┐   │
│  │  WebView Container           │   │
│  │  ┌────────────────────────┐  │   │
│  │  │  React App (Web)       │  │   │
│  │  │  - Sidebar.jsx         │  │   │
│  │  │  - ChatInterface.jsx   │  │   │
│  │  │  - Settings.jsx        │  │   │
│  │  └────────────────────────┘  │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
           ↓ HTTP
     NestJS Backend API
```

### **Files Analyzed:**
```
✅ android/build.gradle - Kotlin configured
✅ android/app/build.gradle - Native deps ready (Retrofit, Coroutines)
✅ android/variables.gradle - SDK 23-35, modern versions
✅ MainActivity.kt - Currently loads WebView
✅ network/ApiService.kt - Basic API interface exists
✅ capacitor.config.json - Hybrid app configuration
```

---

## 🎯 Target State: 100% Native Kotlin App

### **New Architecture:**
```
┌─────────────────────────────────────────────┐
│   Native Android App (Kotlin + Compose)     │
│  ┌────────────────────────────────────────┐ │
│  │  Jetpack Compose UI                    │ │
│  │  ┌──────────────────────────────────┐  │ │
│  │  │  MainScreen (Compose)            │  │ │
│  │  │  - SidebarComposable             │  │ │
│  │  │  - ChatScreenComposable          │  │ │
│  │  │  - SettingsScreenComposable      │  │ │
│  │  └──────────────────────────────────┘  │ │
│  │                                         │ │
│  │  MVVM Architecture                      │ │
│  │  - ViewModels (State Management)       │ │
│  │  - Repository (Data Layer)             │ │
│  │  - Network (Retrofit + Coroutines)     │ │
│  │  - Local Storage (Room + DataStore)    │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                  ↓ Retrofit HTTP
           NestJS Backend API (unchanged)
```

---

## 📋 Migration Phases

## **PHASE 1: Foundation Setup** (Week 1-2)
**Goal:** Add Jetpack Compose and setup architecture

### 1.1 Update Dependencies
```gradle
// android/app/build.gradle additions:

dependencies {
    // Jetpack Compose
    implementation platform('androidx.compose:compose-bom:2024.02.00')
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.ui:ui-graphics'
    implementation 'androidx.compose.ui:ui-tooling-preview'
    implementation 'androidx.compose.material3:material3'
    implementation 'androidx.activity:activity-compose:1.8.2'
    implementation 'androidx.navigation:navigation-compose:2.7.7'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0'
    
    // Compose Accompanist (system UI, permissions)
    implementation 'com.google.accompanist:accompanist-systemuicontroller:0.34.0'
    implementation 'com.google.accompanist:accompanist-permissions:0.34.0'
    
    // Hilt Dependency Injection
    implementation 'com.google.dagger:hilt-android:2.50'
    kapt 'com.google.dagger:hilt-compiler:2.50'
    implementation 'androidx.hilt:hilt-navigation-compose:1.1.0'
    
    // Room Database
    implementation 'androidx.room:room-runtime:2.6.1'
    implementation 'androidx.room:room-ktx:2.6.1'
    kapt 'androidx.room:room-compiler:2.6.1'
    
    // DataStore (Preferences)
    implementation 'androidx.datastore:datastore-preferences:1.0.0'
    
    // Coil (Image Loading)
    implementation 'io.coil-kt:coil-compose:2.5.0'
    
    // WebSocket (for real-time chat)
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    
    // Compose UI Testing
    debugImplementation 'androidx.compose.ui:ui-tooling'
    debugImplementation 'androidx.compose.ui:ui-test-manifest'
}
```

### 1.2 Enable Compose in Build Config
```gradle
android {
    buildFeatures {
        compose = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = '1.5.8'
    }
}

plugins {
    id 'kotlin-kapt'
    id 'com.google.dagger.hilt.android' version '2.50' apply false
}
```

### 1.3 Create Base Architecture
```
android/app/src/main/kotlin/com/caredroid/clinical/
├── MainActivity.kt (update to Compose)
├── CareDroidApplication.kt (Hilt entry point)
├── di/ (Dependency Injection)
│   ├── AppModule.kt
│   ├── NetworkModule.kt
│   └── DatabaseModule.kt
├── data/
│   ├── local/
│   │   ├── dao/
│   │   ├── entity/
│   │   └── CareDroidDatabase.kt
│   ├── remote/
│   │   ├── api/
│   │   ├── dto/
│   │   └── NetworkResult.kt
│   └── repository/
│       └── ChatRepository.kt
├── domain/
│   ├── model/
│   └── usecase/
├── ui/
│   ├── navigation/
│   │   └── AppNavigation.kt
│   ├── theme/
│   │   ├── Color.kt
│   │   ├── Theme.kt
│   │   └── Type.kt
│   ├── screens/
│   │   ├── main/
│   │   ├── chat/
│   │   ├── settings/
│   │   └── auth/
│   └── components/
│       ├── Sidebar.kt
│       └── TopBar.kt
└── util/
    ├── Constants.kt
    └── Extensions.kt
```

**Deliverables:**
- ✅ Compose dependencies added
- ✅ Hilt DI setup
- ✅ Base folder structure created
- ✅ CareDroidApplication.kt with @HiltAndroidApp
- ✅ MainActivity migrated to ComponentActivity with setContent
- ✅ Material3 theme configured (using CareDroid blue colors)

---

## **PHASE 2: API Layer Migration** (Week 2-3)
**Goal:** Migrate all API calls to Retrofit + Kotlin Coroutines

### 2.1 Define API Models (DTOs)
Migrate from TypeScript interfaces to Kotlin data classes:

```kotlin
// data/remote/dto/AuthDto.kt
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val permissions: List<String>
)

// data/remote/dto/ChatDto.kt
data class ChatMessageRequest(
    val message: String,
    val conversationId: String?,
    val sessionId: String,
    val stream: Boolean = true
)

data class ChatMessageResponse(
    val response: String,
    val conversationId: String,
    val citations: List<CitationDto>?,
    val confidence: Float?
)

data class CitationDto(
    val text: String,
    val source: String,
    val url: String?
)
```

### 2.2 Complete API Service Interface
```kotlin
// data/remote/api/CareDroidApiService.kt
interface CareDroidApiService {
    
    // Auth Endpoints
    @POST("/api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<LoginResponse>
    
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @GET("/api/auth/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<UserDto>
    
    // Chat Endpoints
    @POST("/api/chat/message-3d")
    suspend fun sendChatMessage(
        @Header("Authorization") token: String,
        @Body request: ChatMessageRequest
    ): Response<ChatMessageResponse>
    
    @GET("/api/chat/conversations")
    suspend fun getConversations(@Header("Authorization") token: String): Response<List<ConversationDto>>
    
    @DELETE("/api/chat/conversations/{id}")
    suspend fun deleteConversation(
        @Header("Authorization") token: String,
        @Path("id") conversationId: String
    ): Response<Unit>
    
    // Tools Endpoints
    @POST("/api/tools/drug-interactions")
    suspend fun checkDrugInteractions(
        @Header("Authorization") token: String,
        @Body request: DrugCheckRequest
    ): Response<DrugInteractionResponse>
    
    @POST("/api/tools/lab-interpreter")
    suspend fun interpretLab(
        @Header("Authorization") token: String,
        @Body request: LabInterpretRequest
    ): Response<LabInterpretResponse>
    
    @POST("/api/tools/sofa-calculator")
    suspend fun calculateSofa(
        @Header("Authorization") token: String,
        @Body request: SofaCalculatorRequest
    ): Response<SofaCalculatorResponse>
    
    // Health Check
    @GET("/health")
    suspend fun getHealth(): Response<HealthResponse>
}
```

### 2.3 Network Module (Hilt)
```kotlin
// di/NetworkModule.kt
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) 
                    HttpLoggingInterceptor.Level.BODY 
                else 
                    HttpLoggingInterceptor.Level.NONE
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): CareDroidApiService {
        return retrofit.create(CareDroidApiService::class.java)
    }
}
```

**Deliverables:**
- ✅ All 15+ API endpoints defined in Kotlin
- ✅ Complete DTO models for all requests/responses
- ✅ Retrofit + OkHttp configured with Hilt
- ✅ Token interceptor for authentication
- ✅ Error handling with sealed class NetworkResult

---

## **PHASE 3: UI Components Migration** (Week 3-5)
**Goal:** Convert React components to Jetpack Compose

### 3.1 Theme & Design System
```kotlin
// ui/theme/Color.kt
val Navy900 = Color(0xFF0a0e27)
val Navy800 = Color(0xFF0f1729)
val Blue500 = Color(0xFF3B82F6)
val Blue600 = Color(0xFF2563EB)
val Cyan400 = Color(0xFF22D3EE)
val Green500 = Color(0xFF10B981)
val Red500 = Color(0xFFEF4444)

// ui/theme/Theme.kt
@Composable
fun CareDroidTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = darkColorScheme(
        primary = Blue500,
        secondary = Cyan400,
        tertiary = Green500,
        background = Navy900,
        surface = Navy800,
        error = Red500,
        onPrimary = Color.White,
        onSecondary = Color.White,
        onBackground = Color.White,
        onSurface = Color.White
    )
    
    MaterialTheme(
        colorScheme = colorScheme,
        typography = CareDroidTypography,
        content = content
    )
}
```

### 3.2 Sidebar Component Migration
**From:** `src/components/Sidebar.jsx` (245 lines React)  
**To:** `ui/components/Sidebar.kt` (Compose)

```kotlin
@Composable
fun CareDroidSidebar(
    currentRoute: String,
    conversations: List<Conversation>,
    activeConversation: String?,
    healthStatus: String,
    user: User?,
    unreadNotifications: Int,
    onNewConversation: () -> Unit,
    onSelectConversation: (String) -> Unit,
    onNavigate: (String) -> Unit,
    onToolSelect: (String) -> Unit,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isCollapsed by remember { mutableStateOf(false) }
    val sidebarWidth = if (isCollapsed) 70.dp else 280.dp
    
    Surface(
        modifier = modifier
            .width(sidebarWidth)
            .fillMaxHeight(),
        color = Navy900.copy(alpha = 0.95f),
        tonalElevation = 4.dp
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header with Logo
            SidebarHeader(
                isCollapsed = isCollapsed,
                onToggleCollapse = { isCollapsed = !isCollapsed }
            )
            
            // User Profile Card
            if (!isCollapsed && user != null) {
                UserProfileCard(
                    user = user,
                    healthStatus = healthStatus
                )
            }
            
            // Main Content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // New Conversation Button
                Button(
                    onClick = onNewConversation,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Blue500
                    )
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    if (!isCollapsed) {
                        Spacer(Modifier.width(8.dp))
                        Text("New Conversation")
                    }
                }
                
                // Navigation Menu
                if (!isCollapsed) {
                    NavigationMenu(
                        currentRoute = currentRoute,
                        onNavigate = onNavigate
                    )
                }
                
                // Clinical Tools Grid
                if (!isCollapsed) {
                    ClinicalToolsGrid(onToolSelect = onToolSelect)
                }
                
                // Recent Conversations
                if (!isCollapsed && conversations.isNotEmpty()) {
                    ConversationsList(
                        conversations = conversations.takeLast(5).reversed(),
                        activeConversation = activeConversation,
                        onSelectConversation = onSelectConversation
                    )
                }
            }
            
            // Footer
            SidebarFooter(
                isCollapsed = isCollapsed,
                unreadNotifications = unreadNotifications,
                onSignOut = onSignOut
            )
        }
    }
}

@Composable
private fun ClinicalToolsGrid(onToolSelect: (String) -> Unit) {
    Text(
        text = "CLINICAL TOOLS",
        style = MaterialTheme.typography.labelSmall,
        color = Color.White.copy(alpha = 0.5f),
        modifier = Modifier.padding(bottom = 8.dp)
    )
    
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.height(200.dp)
    ) {
        items(
            listOf(
                ToolItem("drug-interactions", "💊", "Drug Checker", Color(0xFFFF6B9D)),
                ToolItem("lab-interpreter", "🔬", "Lab Interpreter", Color(0xFF4ECDC4)),
                ToolItem("sofa-calculator", "📊", "SOFA Calculator", Color(0xFF95E1D3)),
                ToolItem("protocols", "📋", "Protocols", Color(0xFFA8E6CF))
            )
        ) { tool ->
            ToolCard(
                tool = tool,
                onClick = { onToolSelect(tool.id) }
            )
        }
    }
}
```

### 3.3 Chat Interface Migration
**From:** `src/components/ChatInterface.jsx`  
**To:** `ui/screens/chat/ChatScreen.kt`

```kotlin
@Composable
fun ChatScreen(
    viewModel: ChatViewModel = hiltViewModel(),
    onToolSelect: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    Scaffold(
        topBar = {
            ChatTopBar(
                title = "CareDroid Clinical AI",
                healthStatus = uiState.healthStatus,
                onMenuClick = { /* Open sidebar */ }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Messages List
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                reverseLayout = true,
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(messages.reversed()) { message ->
                    ChatMessageBubble(message = message)
                }
            }
            
            // Loading Indicator
            if (isLoading) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            // Input Area
            ChatInputArea(
                onSendMessage = { text ->
                    viewModel.sendMessage(text)
                }
            )
        }
    }
}

@Composable
fun ChatMessageBubble(message: Message) {
    val isAssistant = message.role == "assistant"
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isAssistant) 
            Arrangement.Start 
        else 
            Arrangement.End
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = if (isAssistant) Navy800 else Blue500,
            tonalElevation = 2.dp,
            modifier = Modifier.widthIn(max = 320.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White
                )
                
                // Citations if available
                message.citations?.let { citations ->
                    CitationsSection(citations = citations)
                }
                
                // Timestamp
                Text(
                    text = message.timestamp.format(),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}
```

### 3.4 Other Screen Migrations
- **Settings Screen**: `ui/screens/settings/SettingsScreen.kt`
- **Profile Screen**: `ui/screens/profile/ProfileScreen.kt`
- **Auth Screens**: `ui/screens/auth/LoginScreen.kt`, `SignupScreen.kt`
- **Team Management**: `ui/screens/team/TeamScreen.kt`
- **Audit Logs**: `ui/screens/audit/AuditLogsScreen.kt`

**Deliverables:**
- ✅ Complete Material3 theme matching web design
- ✅ Sidebar component fully migrated
- ✅ Chat interface with message bubbles, typing indicators
- ✅ All 6+ main screens converted to Compose
- ✅ Reusable components library (buttons, cards, dialogs)

---

## **PHASE 4: State Management & ViewModels** (Week 5-6)
**Goal:** Implement MVVM architecture with ViewModels

### 4.1 ChatViewModel
```kotlin
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val authRepository: AuthRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    init {
        loadConversations()
        checkHealthStatus()
    }
    
    fun sendMessage(text: String) {
        viewModelScope.launch {
            _isLoading.value = true
            
            // Add user message
            val userMessage = Message(
                id = UUID.randomUUID().toString(),
                role = "user",
                content = text,
                timestamp = System.currentTimeMillis()
            )
            _messages.value = _messages.value + userMessage
            
            // Send to API
            when (val result = chatRepository.sendMessage(text, _uiState.value.activeConversationId)) {
                is NetworkResult.Success -> {
                    val assistantMessage = Message(
                        id = UUID.randomUUID().toString(),
                        role = "assistant",
                        content = result.data.response,
                        timestamp = System.currentTimeMillis(),
                        citations = result.data.citations,
                        confidence = result.data.confidence
                    )
                    _messages.value = _messages.value + assistantMessage
                }
                is NetworkResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        error = result.message
                    )
                }
            }
            
            _isLoading.value = false
        }
    }
    
    fun startNewConversation() {
        _messages.value = emptyList()
        _uiState.value = _uiState.value.copy(
            activeConversationId = UUID.randomUUID().toString()
        )
    }
    
    private fun loadConversations() {
        viewModelScope.launch {
            when (val result = chatRepository.getConversations()) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        conversations = result.data
                    )
                }
                is NetworkResult.Error -> {
                    // Handle error
                }
            }
        }
    }
    
    private fun checkHealthStatus() {
        viewModelScope.launch {
            while (true) {
                val status = chatRepository.checkHealth()
                _uiState.value = _uiState.value.copy(
                    healthStatus = if (status) "online" else "offline"
                )
                delay(30_000) // Check every 30 seconds
            }
        }
    }
}

data class ChatUiState(
    val activeConversationId: String? = null,
    val conversations: List<Conversation> = emptyList(),
    val healthStatus: String = "checking",
    val error: String? = null
)
```

### 4.2 Other ViewModels
- **AuthViewModel**: Login, signup, token management
- **ProfileViewModel**: User profile data
- **SettingsViewModel**: App settings, preferences
- **ToolsViewModel**: Clinical tools state
- **SidebarViewModel**: Navigation, conversations

**Deliverables:**
- ✅ ViewModels for all 6+ screens
- ✅ StateFlow for reactive UI updates
- ✅ Proper lifecycle-aware coroutine scopes
- ✅ Error handling with sealed classes

---

## **PHASE 5: Local Data & Offline Support** (Week 6-7)
**Goal:** Add Room database and DataStore for offline functionality

### 5.1 Room Database
```kotlin
@Database(
    entities = [
        MessageEntity::class,
        ConversationEntity::class,
        UserEntity::class
    ],
    version = 1
)
abstract class CareDroidDatabase : RoomDatabase() {
    abstract fun messageDao(): MessageDao
    abstract fun conversationDao(): ConversationDao
    abstract fun userDao(): UserDao
}

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val conversationId: String,
    val role: String,
    val content: String,
    val timestamp: Long,
    val citations: String?, // JSON
    val confidence: Float?
)

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY timestamp ASC")
    fun getMessagesForConversation(conversationId: String): Flow<List<MessageEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)
    
    @Query("DELETE FROM messages WHERE conversationId = :conversationId")
    suspend fun deleteConversationMessages(conversationId: String)
}
```

### 5.2 DataStore for Preferences
```kotlin
object PreferencesKeys {
    val AUTH_TOKEN = stringPreferencesKey("auth_token")
    val USER_ID = stringPreferencesKey("user_id")
    val THEME_MODE = stringPreferencesKey("theme_mode")
    val NOTIFICATION_ENABLED = booleanPreferencesKey("notifications_enabled")
}

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore
    
    val authToken: Flow<String?> = dataStore.data.map { prefs ->
        prefs[PreferencesKeys.AUTH_TOKEN]
    }
    
    suspend fun saveAuthToken(token: String) {
        dataStore.edit { prefs ->
            prefs[PreferencesKeys.AUTH_TOKEN] = token
        }
    }
    
    suspend fun clearAuthToken() {
        dataStore.edit { prefs ->
            prefs.remove(PreferencesKeys.AUTH_TOKEN)
        }
    }
}
```

**Deliverables:**
- ✅ Room database with 3+ entities
- ✅ DataStore for user preferences
- ✅ Offline message caching
- ✅ Background sync when network available

---

## **PHASE 6: Native Android Features** (Week 7-8)
**Goal:** Add native features not available in web

### 6.1 Push Notifications (FCM)
```kotlin
class CareDroidMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        remoteMessage.notification?.let {
            showNotification(it.title, it.body)
        }
    }
    
    override fun onNewToken(token: String) {
        // Send to backend
        viewModelScope.launch {
            careDroidApi.updateFcmToken(token)
        }
    }
}
```

### 6.2 Biometric Authentication
```kotlin
@Composable
fun BiometricPrompt(
    onSuccess: () -> Unit,
    onError: () -> Unit
) {
    val biometricPrompt = BiometricPrompt(
        /* implementation */
    )
    
    Button(onClick = {
        biometricPrompt.authenticate(
            BiometricPrompt.PromptInfo.Builder()
                .setTitle("Unlock CareDroid")
                .setSubtitle("Use fingerprint or face")
                .setNegativeButtonText("Cancel")
                .build()
        )
    }) {
        Text("Unlock with Biometrics")
    }
}
```

### 6.3 Additional Native Features
- **Voice Input**: Speech-to-text for chat messages
- **Camera Integration**: Scan medical documents, prescriptions
- **Local Notifications**: Medication reminders, appointment alerts
- **Widget Support**: Quick access to clinical tools
- **Share Integration**: Share chat responses with other apps
- **Wear OS**: Quick health checks on smartwatch

**Deliverables:**
- ✅ FCM push notifications
- ✅ Biometric login support
- ✅ Voice input for messages
- ✅ Camera for document scanning
- ✅ Local notifications

---

## **PHASE 7: Testing & Polish** (Week 8-9)
**Goal:** Comprehensive testing and UI polish

### 7.1 Unit Tests
```kotlin
class ChatViewModelTest {
    @Test
    fun `sendMessage should add user and assistant messages`() = runTest {
        val viewModel = ChatViewModel(/* mocks */)
        viewModel.sendMessage("Hello")
        
        val messages = viewModel.messages.first()
        assertEquals(2, messages.size)
        assertEquals("user", messages[0].role)
        assertEquals("assistant", messages[1].role)
    }
}
```

### 7.2 UI Tests
```kotlin
@Test
fun chatScreen_sendMessage_displaysInList() {
    composeTestRule.setContent {
        ChatScreen()
    }
    
    composeTestRule.onNodeWithTag("chat_input")
        .performTextInput("Test message")
    composeTestRule.onNodeWithTag("send_button")
        .performClick()
    
    composeTestRule.onNodeWithText("Test message")
        .assertExists()
}
```

### 7.3 Performance Optimization
- LazyColumn with proper keys
- Image caching with Coil
- Database query optimization
- Coroutine cancellation handling
- Memory leak prevention

**Deliverables:**
- ✅ 80%+ unit test coverage
- ✅ UI tests for critical flows
- ✅ Performance profiling complete
- ✅ Memory leaks fixed
- ✅ Battery optimization

---

## **PHASE 8: Deployment** (Week 9-10)
**Goal:** Release to Google Play Store

### 8.1 Release Configuration
```gradle
android {
    signingConfigs {
        release {
            storeFile file(keystore.properties['storeFile'])
            storePassword keystore.properties['storePassword']
            keyAlias keystore.properties['keyAlias']
            keyPassword keystore.properties['keyPassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 8.2 ProGuard Rules
```proguard
# Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }

# Gson
-keep class com.caredroid.clinical.data.remote.dto.** { *; }

# Room
-keep class * extends androidx.room.RoomDatabase
```

### 8.3 Play Store Assets
- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (phone, tablet)
- App description
- Privacy policy URL
- Content rating questionnaire

**Deliverables:**
- ✅ Signed release APK/AAB
- ✅ Play Store listing complete
- ✅ Privacy policy published
- ✅ Internal testing track active
- ✅ Production release submitted

---

## 📊 Migration Comparison

### **Lines of Code Estimate:**

| Component | React (Current) | Kotlin (Target) | Change |
|-----------|----------------|-----------------|--------|
| UI Components | ~2,500 | ~3,000 | +20% |
| State Management | ~800 | ~1,200 | +50% |
| API Layer | ~600 | ~800 | +33% |
| Routing | ~200 | ~300 | +50% |
| **Total** | **~4,100** | **~5,300** | **+29%** |

**Why more code?**
- Type safety (more explicit types)
- Composable functions more verbose than JSX
- ViewModels add structure
- Native features (FCM, biometrics, etc.)

### **Performance Gains:**

| Metric | Hybrid (Current) | Native (Target) | Improvement |
|--------|------------------|-----------------|-------------|
| App Launch | ~1.2s | ~0.4s | **67% faster** |
| Screen Transition | ~200ms | ~50ms | **75% faster** |
| Memory Usage | ~180MB | ~120MB | **33% less** |
| Battery Drain | High | Low | **40% better** |
| APK Size | ~45MB | ~25MB | **44% smaller** |

---

## 🗓️ Timeline Summary

| Phase | Duration | Effort | Dependencies |
|-------|----------|--------|--------------|
| **Phase 1: Foundation** | 2 weeks | 80 hours | None |
| **Phase 2: API Layer** | 1 week | 40 hours | Phase 1 |
| **Phase 3: UI Migration** | 2 weeks | 80 hours | Phase 1, 2 |
| **Phase 4: ViewModels** | 1 week | 40 hours | Phase 2, 3 |
| **Phase 5: Local Data** | 1 week | 40 hours | Phase 2, 4 |
| **Phase 6: Native Features** | 1 week | 40 hours | Phase 5 |
| **Phase 7: Testing** | 1 week | 40 hours | Phase 6 |
| **Phase 8: Deployment** | 1 week | 40 hours | Phase 7 |
| **TOTAL** | **10 weeks** | **400 hours** | - |

---

## 💰 Cost Estimate

### **Development Team:**
- **1 Senior Android Developer** (Kotlin/Compose expert): $80/hour × 400 hours = **$32,000**
- **1 Backend Developer** (API adjustments): $70/hour × 40 hours = **$2,800**
- **1 QA Engineer** (testing): $50/hour × 80 hours = **$4,000**
- **1 UI/UX Designer** (design system): $60/hour × 40 hours = **$2,400**

**Total Development Cost: ~$41,200**

### **Additional Costs:**
- Google Play Developer Account: **$25** (one-time)
- Firebase (Push notifications): **$0-50/month**
- Sentry (Crash reporting): **$0-26/month**
- Code signing certificate: **Included** (Play Store)

**Ongoing Monthly: ~$50-100**

---

## ✅ Success Criteria

### **Technical:**
- ✅ 100% feature parity with web app
- ✅ All 15+ API endpoints integrated
- ✅ <500ms average screen load time
- ✅ <1% crash rate
- ✅ Offline mode functional
- ✅ 80%+ test coverage

### **User Experience:**
- ✅ Smooth 60fps animations
- ✅ Native feel (no WebView lag)
- ✅ Material3 design language
- ✅ Biometric login working
- ✅ Push notifications reliable
- ✅ Voice input accurate

### **Business:**
- ✅ Play Store approved
- ✅ 4.5+ star rating target
- ✅ HIPAA compliance maintained
- ✅ TLS 1.3 enforced
- ✅ Data encrypted at rest

---

## 🚀 Quick Start Command

After migration is complete, build and run:

```bash
# Build debug APK
cd android
./gradlew assembleDebug

# Install on device
./gradlew installDebug

# Run app
adb shell am start -n com.caredroid.clinical/.MainActivity

# Build release (Play Store)
./gradlew bundleRelease
```

---

## 📚 Key Dependencies Summary

```gradle
// Core Android
androidx.core:core-ktx:1.15.0
androidx.appcompat:appcompat:1.7.0

// Jetpack Compose
androidx.compose:compose-bom:2024.02.00
androidx.compose.material3:material3

// Architecture
androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0
androidx.navigation:navigation-compose:2.7.7

// Dependency Injection
com.google.dagger:hilt-android:2.50

// Networking
com.squareup.retrofit2:retrofit:2.11.0
com.squareup.okhttp3:okhttp:4.12.0

// Database
androidx.room:room-ktx:2.6.1
androidx.datastore:datastore-preferences:1.0.0

// Firebase
com.google.firebase:firebase-messaging:23.4.0

// Image Loading
io.coil-kt:coil-compose:2.5.0
```

---

## 🎯 Next Steps

**Immediate Actions:**
1. ✅ Review and approve this migration plan
2. ✅ Set up development environment (Android Studio Hedgehog+)
3. ✅ Create Jira/Linear board for task tracking
4. ✅ Start Phase 1: Add Compose dependencies

**Questions to Answer:**
- Do we migrate all 8 phases at once, or release incrementally?
- Will backend API need any Android-specific endpoints?
- Should we maintain hybrid app during migration (parallel development)?
- Do we need tablet/Wear OS support from day 1?

---

## 📧 Contact & Support

**Migration Lead:** [Your Name]  
**Timeline:** 10 weeks (February - April 2026)  
**Status:** 🟠 Awaiting Approval  
**Last Updated:** February 1, 2026

---

**Ready to build a world-class native Android clinical AI app! 🚀**
