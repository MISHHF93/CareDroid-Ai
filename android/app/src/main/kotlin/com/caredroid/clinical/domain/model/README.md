# Domain Models

This directory contains the core domain models for the CareDroid application.
These models represent business entities and are independent of any framework or implementation details.

## Structure

- **User**: User authentication and profile models
- **Chat**: Message, Conversation, and Citation models
- **Tools**: Clinical tools models (Drug, Lab, SOFA)
- **Health**: Health check and system status models

## Best Practices

1. Keep models simple and focused on business logic
2. Use data classes for immutability
3. Avoid framework-specific annotations
4. Prefer sealed classes for representing states
5. Include validation logic where appropriate

## Example

```kotlin
data class Message(
    val id: String,
    val content: String,
    val role: MessageRole,
    val timestamp: Long,
    val conversationId: String
)

enum class MessageRole {
    USER, ASSISTANT, SYSTEM
}
```
