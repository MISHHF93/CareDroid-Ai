import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { RAGService } from '../src/modules/rag/rag.service';
import { ChatService } from '../src/modules/chat/chat.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { UserRole } from '../src/modules/users/entities/user.entity';

/**
 * Batch 7: RAG-Augmented Chat E2E Tests
 * 
 * Tests the integration of RAG retrieval with the chat system, ensuring:
 * - RAG retrieval for medical queries
 * - Citation formatting in responses
 * - Confidence scoring and disclaimers
 * - Fallback to direct AI when RAG fails
 * - Audit logging of RAG operations
 */
describe('RAG-Augmented Chat (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let ragService: RAGService;
  let chatService: ChatService;
  let auditService: AuditService;
  let authToken: string;
  let userId: string;

  const buildRagContext = (params: {
    chunks: any[];
    sources: any[];
    confidence: number;
    query: string;
  }) => ({
    chunks: params.chunks,
    sources: params.sources,
    confidence: params.confidence,
    query: params.query,
    timestamp: new Date(),
    totalRetrieved: params.chunks.length,
    latencyMs: 12,
  });

  const buildChunk = (id: string, text: string, score: number, source: any) => ({
    id,
    text,
    score,
    metadata: {
      sourceId: source.id,
      title: source.title,
      type: source.type,
      organization: source.organization,
      date: source.date,
      url: source.url,
    },
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    ragService = moduleFixture.get<RAGService>(RAGService);
    chatService = moduleFixture.get<ChatService>(ChatService);
    auditService = moduleFixture.get<AuditService>(AuditService);

    // Create test user and get auth token
    const testUser = await authService.register({
      email: 'rag-test@example.com',
      password: 'Test1234!',
      fullName: 'RAG Test',
      role: UserRole.PHYSICIAN,
    });
    userId = testUser.userId;

    const loginResponse = await authService.login(
      {
        email: 'rag-test@example.com',
        password: 'Test1234!',
      },
      '127.0.0.1',
      'rag-e2e',
    );

    if ('accessToken' in loginResponse) {
      authToken = loginResponse.accessToken;
    } else {
      throw new Error('Two-factor flow not supported in this test');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Medical Query - RAG Retrieval', () => {
    it('should retrieve RAG context for sepsis protocol query', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the sepsis protocol?',
          conversationId: 'test-conv-1',
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.response).toBeTruthy();
      expect(response.body.intent).toBeDefined();
      
      // Should include citations if RAG retrieval was successful
      if (response.body.ragContext?.chunksRetrieved > 0) {
        expect(response.body.citations).toBeDefined();
        expect(Array.isArray(response.body.citations)).toBe(true);
        expect(response.body.confidence).toBeDefined();
        expect(response.body.confidence).toBeGreaterThanOrEqual(0);
        expect(response.body.confidence).toBeLessThanOrEqual(1);
      }
    }, 30000);

    it('should include formatted citations in response text', async () => {
      // Mock RAG service to return controlled data
      const mockSources = [
        {
          id: 'test-source-1',
          title: 'Sepsis Protocol Guidelines',
          organization: 'Test Medical Association',
          type: 'guideline',
          url: 'https://example.com/sepsis',
          evidenceLevel: 'A',
          date: '2023-01-01',
          authors: ['Dr. Test'],
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk(
              'chunk-1',
              'Sepsis is treated with early antibiotics and fluid resuscitation.',
              0.85,
              mockSources[0],
            ),
          ],
          sources: mockSources,
          confidence: 0.85,
          query: 'sepsis protocol',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the sepsis protocol?',
          conversationId: 'test-conv-2',
        })
        .expect(201);

      expect(response.body.response).toContain('References');
      expect(response.body.citations).toHaveLength(1);
      expect(response.body.citations[0].title).toBe('Sepsis Protocol Guidelines');
      expect(response.body.citations[0].organization).toBe('Test Medical Association');
    }, 30000);

    it('should include confidence score and level', async () => {
      const mockSources = [
        {
          id: 'source-1',
          title: 'Test Source',
          organization: 'AHA',
          type: 'guideline',
          evidenceLevel: 'A',
          date: '2023-06-01',
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk('chunk-1', 'High confidence medical content.', 0.95, mockSources[0]),
          ],
          sources: mockSources,
          confidence: 0.95,
          query: 'test query',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the cardiac arrest protocol?',
          conversationId: 'test-conv-3',
        })
        .expect(201);

      expect(response.body.confidence).toBeDefined();
      expect(response.body.confidence).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Confidence-Based Disclaimers', () => {
    it('should add disclaimer for low confidence responses', async () => {
      // Mock low confidence RAG result
      const mockSources = [
        {
          id: 'source-1',
          title: 'Limited Source',
          organization: 'Unknown',
          type: 'reference',
          date: '2015-01-01',
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk('chunk-1', 'Limited medical information available.', 0.45, mockSources[0]),
          ],
          sources: mockSources,
          confidence: 0.45,
          query: 'obscure medical query',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the treatment for rare condition X?',
          conversationId: 'test-conv-4',
        })
        .expect(201);

      // Low confidence should trigger disclaimer
      expect(response.body.confidence).toBeLessThan(0.6);
      expect(response.body.response.toLowerCase()).toMatch(
        /caution|disclaimer|limited|confidence|consult|specialist/,
      );
    }, 30000);

    it('should not add disclaimer for high confidence responses', async () => {
      // Mock high confidence RAG result
      const mockSources = [
        {
          id: 'source-1',
          title: 'AHA Guidelines',
          organization: 'AHA',
          type: 'guideline',
          evidenceLevel: 'A',
          date: '2024-01-01',
        },
        {
          id: 'source-2',
          title: 'ACC Protocol',
          organization: 'ACC',
          type: 'protocol',
          evidenceLevel: 'A',
          date: '2024-01-01',
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk('chunk-1', 'Authoritative content 1.', 0.95, mockSources[0]),
            buildChunk('chunk-2', 'Authoritative content 2.', 0.92, mockSources[1]),
          ],
          sources: mockSources,
          confidence: 0.95,
          query: 'common medical query',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the standard ACLS protocol?',
          conversationId: 'test-conv-5',
        })
        .expect(201);

      expect(response.body.confidence).toBeGreaterThanOrEqual(0.8);
      // Should not contain low-confidence disclaimers
      expect(response.body.response.toLowerCase()).not.toMatch(
        /limited evidence|very low confidence/,
      );
    }, 30000);
  });

  describe('Fallback Behavior', () => {
    it('should fall back to direct AI when RAG returns no chunks', async () => {
      // Mock RAG service to return empty result
      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [],
          sources: [],
          confidence: 0,
          query: 'test query',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the protocol for alien abduction injuries?',
          conversationId: 'test-conv-6',
        })
        .expect(201);

      // Should still return a response (fallback to direct AI)
      expect(response.body.response).toBeTruthy();
      expect(response.body.citations).toBeUndefined();
      expect(response.body.ragContext?.chunksRetrieved).toBe(0);
    }, 30000);

    it('should fall back to direct AI when RAG service fails', async () => {
      // Mock RAG service to throw error
      jest.spyOn(ragService, 'retrieve').mockRejectedValue(
        new Error('RAG service unavailable'),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is hypertension?',
          conversationId: 'test-conv-7',
        })
        .expect(201);

      // Should still return response (graceful degradation)
      expect(response.body.response).toBeTruthy();
    }, 30000);
  });

  describe('Audit Logging', () => {
    it('should log RAG retrieval in audit trail', async () => {
      const mockSources = [
        {
          id: 'source-1',
          title: 'Audit Test Source',
          organization: 'Test Org',
          type: 'guideline',
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk('chunk-1', 'Medical content for audit test.', 0.85, mockSources[0]),
          ],
          sources: mockSources,
          confidence: 0.85,
          query: 'audit test query',
        }),
      );

      const logSpy = jest.spyOn(auditService, 'log');

      await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Audit test query for RAG',
          conversationId: 'test-conv-8',
        })
        .expect(201);

      expect(logSpy).toHaveBeenCalled();
    }, 30000);
  });

  describe('Query Type Handling', () => {
    it('should use drug information prompt for drug queries', async () => {
      const mockSources = [
        {
          id: 'drug-source-1',
          title: 'Aspirin Monograph',
          organization: 'FDA',
          type: 'drug_info',
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk('chunk-1', 'Aspirin is an antiplatelet medication.', 0.9, mockSources[0]),
          ],
          sources: mockSources,
          confidence: 0.9,
          query: 'aspirin dosage',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the dosage of aspirin?',
          conversationId: 'test-conv-9',
        })
        .expect(201);

      expect(response.body.response).toBeTruthy();
      expect(response.body.citations).toBeDefined();
      expect(response.body.citations.some((c) => c.type === 'drug_info')).toBe(true);
    }, 30000);

    it('should use protocol prompt for protocol queries', async () => {
      const mockSources = [
        {
          id: 'protocol-source-1',
          title: 'ACLS Protocol 2023',
          organization: 'AHA',
          type: 'protocol',
          evidenceLevel: 'A',
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk('chunk-1', 'ACLS protocol includes CPR and defibrillation.', 0.92, mockSources[0]),
          ],
          sources: mockSources,
          confidence: 0.92,
          query: 'acls protocol',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the ACLS protocol?',
          conversationId: 'test-conv-10',
        })
        .expect(201);

      expect(response.body.response).toBeTruthy();
      expect(response.body.citations).toBeDefined();
      expect(response.body.citations.some((c) => c.type === 'protocol')).toBe(true);
    }, 30000);
  });

  describe('General Query RAG Attempt', () => {
    it('should attempt RAG retrieval for general queries', async () => {
      const ragRetrieveSpy = jest.spyOn(ragService, 'retrieve');

      await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Tell me about diabetes management',
          conversationId: 'test-conv-11',
        })
        .expect(201);

      // Should have attempted RAG retrieval even for general query
      expect(ragRetrieveSpy).toHaveBeenCalled();
    }, 30000);

    it('should use RAG context if available for general queries', async () => {
      const mockSources = [
        {
          id: 'diabetes-source-1',
          title: 'Diabetes Management Guidelines',
          organization: 'ADA',
          type: 'guideline',
        },
      ];

      jest.spyOn(ragService, 'retrieve').mockResolvedValue(
        buildRagContext({
          chunks: [
            buildChunk(
              'chunk-1',
              'Diabetes is managed with diet, exercise, and medication.',
              0.8,
              mockSources[0],
            ),
          ],
          sources: mockSources,
          confidence: 0.8,
          query: 'diabetes management',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'How do you manage diabetes?',
          conversationId: 'test-conv-12',
        })
        .expect(201);

      expect(response.body.citations).toBeDefined();
      expect(response.body.citations.length).toBeGreaterThan(0);
      expect(response.body.ragContext?.chunksRetrieved).toBeGreaterThan(0);
    }, 30000);
  });
});
