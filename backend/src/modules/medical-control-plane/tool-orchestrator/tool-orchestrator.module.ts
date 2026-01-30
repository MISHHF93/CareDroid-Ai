import { Module } from '@nestjs/common';
import { ToolOrchestratorService } from './tool-orchestrator.service';
import { ToolOrchestratorController } from './tool-orchestrator.controller';
import { SofaCalculatorService } from './services/sofa-calculator.service';
import { DrugCheckerService } from './services/drug-checker.service';
import { LabInterpreterService } from './services/lab-interpreter.service';
import { AiModule } from '../../ai/ai.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AiModule, AuditModule],
  controllers: [ToolOrchestratorController],
  providers: [
    ToolOrchestratorService,
    SofaCalculatorService,
    DrugCheckerService,
    LabInterpreterService,
  ],
  exports: [ToolOrchestratorService],
})
export class ToolOrchestratorModule {}
