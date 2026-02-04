# CareDroid-AI Test Suite

Comprehensive testing documentation for the CareDroid-AI platform.

## Directory Structure

```
tests/
├── frontend/           # Frontend route and component tests
│   ├── unit/            # Unit tests (components, contexts, services)
│   │   ├── components/  # Component unit tests
│   │   ├── contexts/    # Context unit tests
│   │   └── services/    # Service unit tests
│   ├── test-routes.js                  # Route health checker
│   ├── test-routes-comprehensive.js    # Detailed route testing
│   └── test-runner-full.js             # Full frontend test runner
├── integration/        # Integration tests
│   └── test-phase5-output.txt         # Phase 5 integration results
└── tools/             # Test utilities and runners
    ├── test-runner.py                  # Python test runner
    └── test-runner.kts                 # Kotlin test runner
```

## Running Tests

### Frontend Tests

**Unit & Component Tests:**
```bash
# From project root
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage report
```

**Route Health Check:**
```bash
node tests/frontend/test-routes.js
```

**Comprehensive Route Testing:**
```bash
node tests/frontend/test-routes-comprehensive.js
```

### Backend Tests

```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # With coverage
```

### Android Tests

```bash
cd android
./gradlew test                    # Unit tests
./gradlew connectedAndroidTest    # Instrumented tests
```

### Integration Tests

Integration tests verify the complete system integration including:
- Frontend ↔ Backend communication
- Database operations
- Authentication flows
- API endpoints
- Real-time features (Socket.io)

## Test Utilities

### Python Test Runner (`test-runner.py`)
Multi-purpose test orchestrator for running various test suites.

```bash
python tests/tools/test-runner.py
```

### Kotlin Test Runner (`test-runner.kts`)
Script runner for Android-specific test scenarios.

```bash
kotlin tests/tools/test-runner.kts
```

## CI/CD Integration

Tests are automatically run in GitHub Actions:
- `.github/workflows/test.yml` - Main test workflow
- `.github/workflows/ci-cd.yml` - Full CI/CD including tests

## Writing Tests

### Frontend Tests (Vitest)

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Backend Tests (Jest)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Test Coverage Goals

- **Frontend**: > 70% coverage
- **Backend**: > 80% coverage
- **Critical paths**: 100% coverage

## Debugging Tests

Use the debug tools in `.debug-tools/`:
```bash
# Open auth debug page in browser
open .debug-tools/AUTH_DEBUG_TEST.html
```

## Best Practices

1. **Write tests first** - TDD approach
2. **Keep tests isolated** - No dependencies between tests
3. **Use meaningful names** - Describe what you're testing
4. **Mock external services** - Keep tests fast and reliable
5. **Test edge cases** - Not just happy paths
6. **Maintain test data** - Use factories and fixtures

## Troubleshooting

### Tests failing locally but passing in CI
- Check Node.js version matches CI
- Clear node_modules and reinstall
- Check for environment-specific configs

### Slow tests
- Use test.concurrent for independent tests
- Mock heavy operations
- Consider test database strategies

### Flaky tests
- Usually timing issues with async operations
- Use proper async/await patterns
- Increase timeouts if necessary

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
