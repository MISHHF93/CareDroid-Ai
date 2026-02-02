# Domain Repositories

This directory contains repository interfaces for the CareDroid application.
These interfaces define the contract for data operations without implementation details.

## Structure

- **ChatRepository**: Message and conversation operations
- **AuthRepository**: Authentication and user management
- **ToolsRepository**: Clinical tools operations
- **PreferencesRepository**: User preferences and settings

## Best Practices

1. Define interfaces in domain layer, implement in data layer
2. Use domain models in method signatures
3. Return Result types for error handling
4. Use Flow for reactive data streams
5. Keep methods focused and single-purpose

## Example

```kotlin
interface ChatRepository {
    suspend fun sendMessage(message: String, conversationId: String): Result<Message>
    fun getConversations(): Flow<List<Conversation>>
    suspend fun getMessages(conversationId: String): Result<List<Message>>
}
```
