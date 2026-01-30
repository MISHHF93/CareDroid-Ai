import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAuditLogHashing1706608800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists before adding columns
    const table = await queryRunner.getTable('audit_logs');

    if (table) {
      // Add hash column
      if (!table.findColumnByName('hash')) {
        await queryRunner.addColumn(
          'audit_logs',
          new TableColumn({
            name: 'hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
          }),
        );
      }

      // Add previousHash column
      if (!table.findColumnByName('previousHash')) {
        await queryRunner.addColumn(
          'audit_logs',
          new TableColumn({
            name: 'previousHash',
            type: 'varchar',
            length: '64',
            isNullable: true,
          }),
        );
      }

      // Add integrityVerified column
      if (!table.findColumnByName('integrityVerified')) {
        await queryRunner.addColumn(
          'audit_logs',
          new TableColumn({
            name: 'integrityVerified',
            type: 'boolean',
            default: false,
          }),
        );
      }

      // Create indexes for hash lookups
      await queryRunner.createIndex(
        'audit_logs',
        {
          name: 'IDX_audit_logs_hash',
          columnNames: ['hash'],
        },
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('audit_logs');

    if (table) {
      // Drop indexes
      const hashIndex = table.findIndex('IDX_audit_logs_hash');
      if (hashIndex) {
        await queryRunner.dropIndex('audit_logs', hashIndex);
      }

      // Drop columns
      if (table.findColumnByName('integrityVerified')) {
        await queryRunner.dropColumn('audit_logs', 'integrityVerified');
      }

      if (table.findColumnByName('previousHash')) {
        await queryRunner.dropColumn('audit_logs', 'previousHash');
      }

      if (table.findColumnByName('hash')) {
        await queryRunner.dropColumn('audit_logs', 'hash');
      }
    }
  }
}
