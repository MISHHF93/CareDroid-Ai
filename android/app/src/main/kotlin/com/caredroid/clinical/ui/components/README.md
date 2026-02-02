# UI Components

This directory contains reusable Composable components for the CareDroid application.

## Structure

- **ChatMessageBubble.kt**: Message display component
- **ChatInputArea.kt**: Message input field with send button
- **TopBar.kt**: App bar with navigation and actions
- **LoadingIndicator.kt**: Loading states
- **ErrorDialog.kt**: Error display
- **ConfidenceBadge.kt**: Confidence indicator
- **CitationCard.kt**: Citation display

## Best Practices

1. Keep components small and focused
2. Use Material3 components as foundation
3. Make components stateless when possible
4. Use preview annotations for development
5. Document parameters and behavior

## Example

```kotlin
@Composable
fun ChatMessageBubble(
    message: Message,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = if (message.isUser) Blue500 else Navy700,
        shape = RoundedCornerShape(16.dp)
    ) {
        Text(
            text = message.content,
            modifier = Modifier.padding(16.dp)
        )
    }
}

@Preview
@Composable
private fun ChatMessageBubblePreview() {
    CareDroidTheme {
        ChatMessageBubble(
            message = Message(
                id = "1",
                content = "Hello, doctor!",
                role = MessageRole.USER
            )
        )
    }
}
```
