import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiModule } from '../ai/ai.module';
import { IntentClassifierModule } from '../medical-control-plane/intent-classifier/intent-classifier.module';
import { AuditModule } from '../audit/audit.module';
import { RAGModule } from '../rag/rag.module';

@Module({
  imports: [AiModule, IntentClassifierModule, AuditModule, RAGModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
