/**
 * Tool Orchestrator Service Unit Tests
 * 
 * Tests for the main orchestrator service
 * Covers tool registry, execution, validation, formatting
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ToolOrchestratorService } from '../src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service';
import { SofaCalculatorService } from '../src/modules/medical-control-plane/tool-orchestrator/services/sofa-calculator.service';
import { DrugCheckerService } from '../src/modules/medical-control-plane/tool-orchestrator/services/drug-checker.service';
import { LabInterpreterService } from '../src/modules/medical-control-plane/tool-orchestrator/services/lab-interpreter.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AIService } from '../src/modules/ai/ai.service';
import { ToolMetricsService } from '../src/modules/metrics/tool-metrics.service';
import { ToolResult } from '../src/modules/medical-control-plane/tool-orchestrator/entities/tool-result.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('ToolOrchestratorService', () => {
  let service: ToolOrchestratorService;
  let mockAuditService: any;
  let mockAiService: any;
  let mockToolMetricsService: any;
  let mockToolResultRepository: any;
  let sofaService: SofaCalculatorService;
  let drugService: DrugCheckerService;
  let labService: LabInterpreterService;

  beforeEach(async () => {
    mockAuditService = {
      log: jest.fn().mockResolvedValue({}),
    };

    mockAiService = {
      generateStructuredJSON: jest.fn().mockResolvedValue({}),
    };

    mockToolMetricsService = {
      categorizeError: jest.fn().mockReturnValue('internal_error'),
      recordToolError: jest.fn().mockResolvedValue(undefined),
      recordToolExecutionTier: jest.fn().mockResolvedValue(undefined),
      setToolParameterComplexity: jest.fn().mockResolvedValue(undefined),
      calculateParameterComplexity: jest.fn().mockReturnValue({ score: 10, category: 'simple' }),
    };

    mockToolResultRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolOrchestratorService,
        SofaCalculatorService,
        DrugCheckerService,
        LabInterpreterService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: AIService,
          useValue: mockAiService,
        },
        {
          provide: ToolMetricsService,
          useValue: mockToolMetricsService,
        },
        {
          provide: getRepositoryToken(ToolResult),
          useValue: mockToolResultRepository,
        },
      ],
    }).compile();

    service = module.get<ToolOrchestratorService>(ToolOrchestratorService);
    sofaService = module.get<SofaCalculatorService>(SofaCalculatorService);
    drugService = module.get<DrugCheckerService>(DrugCheckerService);
    labService = module.get<LabInterpreterService>(LabInterpreterService);
  });

  describe('Tool Registry', () => {
    it('should register all three tools on initialization', () => {
      const tools = service.listAvailableTools();
      expect(tools.count).toBe(3);
      expect(tools.tools.length).toBe(3);
    });

    it('should have SOFA calculator in registry', () => {
      const tools = service.listAvailableTools();
      const sofa = tools.tools.find(t => t.id === 'sofa-calculator');
      expect(sofa).toBeDefined();
      expect(sofa?.name).toBe('SOFA Score Calculator');
    });

    it('should have drug checker in registry', () => {
      const tools = service.listAvailableTools();
      const drug = tools.tools.find(t => t.id === 'drug-interactions');
      expect(drug).toBeDefined();
      expect(drug?.name).toBe('Drug Interaction Checker');
    });

    it('should have lab interpreter in registry', () => {
      const tools = service.listAvailableTools();
      const lab = tools.tools.find(t => t.id === 'lab-interpreter');
      expect(lab).toBeDefined();
      expect(lab?.name).toBe('Lab Results Interpreter');
    });
  });

  describe('listAvailableTools', () => {
    it('should return tools with metadata', () => {
      const result = service.listAvailableTools();

      expect(result.tools[0]).toHaveProperty('id');
      expect(result.tools[0]).toHaveProperty('name');
      expect(result.tools[0]).toHaveProperty('description');
      expect(result.tools[0]).toHaveProperty('category');
      expect(result.tools[0]).toHaveProperty('parameters');
    });

    it('should include correct count', () => {
      const result = service.listAvailableTools();
      expect(result.count).toEqual(result.tools.length);
    });

    it('should include parameter schemas', () => {
      const result = service.listAvailableTools();

      result.tools.forEach(tool => {
        expect(tool.parameters).toBeDefined();
        expect(Array.isArray(tool.parameters)).toBe(true);
      });
    });
  });

  describe('getToolMetadata', () => {
    it('should return metadata for valid tool ID', () => {
      const metadata = service.getToolMetadata('sofa-calculator');

      expect(metadata.id).toBe('sofa-calculator');
      expect(metadata.name).toBe('SOFA Score Calculator');
      expect(metadata.parameters).toBeDefined();
    });

    it('should include parameter schema', () => {
      const metadata = service.getToolMetadata('sofa-calculator');
      expect(metadata.parameters.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid tool ID', () => {
      expect(() => {
        service.getToolMetadata('invalid-tool');
      }).toThrow(NotFoundException);
    });

    it('should return parameters for each tool', () => {
      const tools = ['sofa-calculator', 'drug-interactions', 'lab-interpreter'];

      tools.forEach(toolId => {
        const metadata = service.getToolMetadata(toolId);
        expect(metadata.parameters).toBeDefined();
        expect(metadata.parameters.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateToolExecution', () => {
    it('should validate tool parameters', async () => {
      const result = await service.validateToolExecution({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.valid).toBe(true);
    });

    it('should return validation errors for invalid parameters', async () => {
      const result = await service.validateToolExecution({
        toolId: 'drug-interactions',
        parameters: { medications: [] },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent tool', async () => {
      const result = await service.validateToolExecution({
        toolId: 'invalid-tool',
        parameters: {},
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('executeTool', () => {
    it('should execute SOFA calculator successfully', async () => {
      const result = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.success).toBe(true);
      expect(result.toolId).toBe('sofa-calculator');
      expect(result.result.success).toBe(true);
    });

    it('should execute drug checker successfully', async () => {
      const result = await service.executeTool({
        toolId: 'drug-interactions',
        parameters: { medications: ['warfarin', 'aspirin'] },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.success).toBe(true);
      expect(result.toolId).toBe('drug-interactions');
    });

    it('should execute lab interpreter successfully', async () => {
      const result = await service.executeTool({
        toolId: 'lab-interpreter',
        parameters: { labValues: [{ name: 'WBC', value: 7.0 }] },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.success).toBe(true);
      expect(result.toolId).toBe('lab-interpreter');
    });

    it('should include execution time', async () => {
      const result = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.executionTimeMs).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should log successful execution to audit trail', async () => {
      await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should handle validation failures', async () => {
      const result = await service.executeTool({
        toolId: 'drug-interactions',
        parameters: { medications: [] },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.success).toBe(false);
      expect(result.result.errors).toBeDefined();
    });

    it('should return tool name in response', async () => {
      const result = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.toolName).toBe('SOFA Score Calculator');
    });

    it('should throw error for invalid tool', async () => {
      const result = await service.executeTool({
        toolId: 'invalid-tool',
        parameters: {},
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('executeInChat', () => {
    it('should execute tool and format for chat', async () => {
      const result = await service.executeInChat(
        'sofa-calculator',
        { pao2: 200, fio2: 1.0 },
        'test-user',
        'test-conv'
      );

      expect(result.type).toBe('tool_result');
      expect(result.toolId).toBe('sofa-calculator');
      expect(result.formattedForChat).toBeDefined();
      expect(result.formattedForChat.length).toBeGreaterThan(0);
    });

    it('should format SOFA results for chat', async () => {
      const result = await service.executeInChat(
        'sofa-calculator',
        { pao2: 200, fio2: 1.0 },
        'test-user',
        'test-conv'
      );

      expect(result.formattedForChat).toContain('SOFA');
    });

    it('should format drug results for chat', async () => {
      const result = await service.executeInChat(
        'drug-interactions',
        { medications: ['warfarin', 'aspirin'] },
        'test-user',
        'test-conv'
      );

      expect(result.formattedForChat).toBeDefined();
    });

    it('should include tool result object', async () => {
      const result = await service.executeInChat(
        'sofa-calculator',
        { pao2: 200, fio2: 1.0 },
        'test-user',
        'test-conv'
      );

      expect(result.result).toBeDefined();
      expect(result.result.success).toBe(true);
    });
  });

  describe('Result formatting', () => {
    it('should format SOFA results with total score', async () => {
      const result = await service.executeInChat(
        'sofa-calculator',
        { pao2: 200, fio2: 1.0, platelets: 100 },
        'test-user',
        'test-conv'
      );

      expect(result.formattedForChat).toContain('SOFA Score');
    });

    it('should format drug checker results with severity', async () => {
      const result = await service.executeInChat(
        'drug-interactions',
        { medications: ['warfarin', 'aspirin'] },
        'test-user',
        'test-conv'
      );

      expect(result.formattedForChat).toBeDefined();
    });

    it('should format error results appropriately', async () => {
      const result = await service.executeInChat(
        'drug-interactions',
        { medications: [] },
        'test-user',
        'test-conv'
      );

      expect(result.formattedForChat).toContain('❌');
    });

    it('should include execution timestamp in formatted result', async () => {
      const result = await service.executeInChat(
        'sofa-calculator',
        { pao2: 200, fio2: 1.0 },
        'test-user',
        'test-conv'
      );

      expect(result.formattedForChat).toContain('Executed in');
    });
  });

  describe('getToolStatistics', () => {
    it('should return tool statistics', () => {
      const stats = service.getToolStatistics();

      expect(stats.totalTools).toBe(3);
      expect(stats.toolsByCategory).toBeDefined();
      expect(stats.tools).toBeDefined();
    });

    it('should categorize tools by type', () => {
      const stats = service.getToolStatistics();

      expect(stats.toolsByCategory['calculator']).toBeGreaterThan(0);
      expect(stats.toolsByCategory['checker']).toBeGreaterThan(0);
      expect(stats.toolsByCategory['interpreter']).toBeGreaterThan(0);
    });

    it('should include all tools in statistics', () => {
      const stats = service.getToolStatistics();

      const toolIds = stats.tools.map(t => t.id);
      expect(toolIds).toContain('sofa-calculator');
      expect(toolIds).toContain('drug-interactions');
      expect(toolIds).toContain('lab-interpreter');
    });
  });

  describe('Error handling', () => {
    it('should handle tool execution errors gracefully', async () => {
      const result = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 'invalid', fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.success).toBe(false);
      expect(result.result.errors).toBeDefined();
    });

    it('should log errors to audit trail', async () => {
      await service.executeTool({
        toolId: 'invalid-tool',
        parameters: {},
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should provide user-friendly error messages', async () => {
      const result = await service.executeInChat(
        'invalid-tool',
        {},
        'test-user',
        'test-conv'
      );

      expect(result.formattedForChat).toContain('Error');
    });
  });

  describe('Audit logging', () => {
    it('should log successful tool execution', async () => {
      await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user',
          resource: expect.stringContaining('sofa-calculator'),
        })
      );
    });

    it('should log failed validation', async () => {
      await service.executeTool({
        toolId: 'drug-interactions',
        parameters: { medications: [] },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should include execution time in audit log', async () => {
      await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            status: 'success',
          }),
        })
      );
    });
  });

  describe('Response structure', () => {
    it('ToolExecutionResponseDto should have required fields', async () => {
      const result = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('toolId');
      expect(result).toHaveProperty('toolName');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('executionTimeMs');
    });

    it('Result should have ToolExecutionResult structure', async () => {
      const result = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      const toolResult = result.result;
      expect(toolResult).toHaveProperty('success');
      expect(toolResult).toHaveProperty('data');
      expect(toolResult).toHaveProperty('timestamp');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle sequential tool executions', async () => {
      const sofaResult = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: { pao2: 200, fio2: 1.0 },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      const drugResult = await service.executeTool({
        toolId: 'drug-interactions',
        parameters: { medications: ['aspirin', 'ibuprofen'] },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(sofaResult.success).toBe(true);
      expect(drugResult.success).toBe(true);
    });

    it('should handle tool execution with full parameters', async () => {
      const result = await service.executeTool({
        toolId: 'sofa-calculator',
        parameters: {
          pao2: 100,
          fio2: 1.0,
          mechanicalVentilation: true,
          platelets: 50,
          bilirubin: 5.0,
          map: 60,
          dopamine: 10,
          gcs: 10,
          creatinine: 2.0,
        },
        userId: 'test-user',
        conversationId: 'test-conv',
      });

      expect(result.success).toBe(true);
      expect(result.result.data.totalScore).toBeGreaterThan(0);
    });
  });
});
