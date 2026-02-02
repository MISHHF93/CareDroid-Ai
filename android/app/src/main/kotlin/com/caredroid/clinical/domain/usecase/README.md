# Domain Use Cases

This directory contains use cases (interactors) for the CareDroid application.
Use cases encapsulate business logic and orchestrate data flow between repositories and UI.

## Structure

- **auth/**: Authentication use cases
- **chat/**: Chat and messaging use cases
- **tools/**: Clinical tools use cases
- **preferences/**: Settings and preferences use cases

## Best Practices

1. One use case per business action
2. Use constructor injection for dependencies
3. Keep use cases focused and testable
4. Return domain models or Result types
5. Handle business logic here, not in ViewModels

## Example

```kotlin
class SendMessageUseCase @Inject constructor(
    private val chatRepository: ChatRepository
) {
    suspend operator fun invoke(
        message: String,
        conversationId: String
    ): Result<Message> {
        // Business logic and validation
        if (message.isBlank()) {
            return Result.failure(Exception("Message cannot be empty"))
        }
        
        return chatRepository.sendMessage(message, conversationId)
    }
}
```
