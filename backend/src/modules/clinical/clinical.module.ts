import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugController } from './drug.controller';
import { ProtocolController } from './protocol.controller';
import { DrugService } from './drug.service';
import { ProtocolService } from './protocol.service';
import { Drug } from './entities/drug.entity';
import { Protocol } from './entities/protocol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Drug, Protocol])],
  controllers: [DrugController, ProtocolController],
  providers: [DrugService, ProtocolService],
  exports: [DrugService, ProtocolService],
})
export class ClinicalModule {}
