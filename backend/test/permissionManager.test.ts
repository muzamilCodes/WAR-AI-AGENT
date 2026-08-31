import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PermissionManager } from '../src/services/permissionManager';

describe('Permission Manager Security Tests', () => {
  it('should classify delete_file as HIGH risk requiring confirmation', () => {
    const pm = new PermissionManager();
    const req = pm.evaluateAction('delete_file', { path: 'C:\\test.txt' }, 'Delete test file');

    assert.strictEqual(req.riskLevel, 'HIGH');
    assert.strictEqual(req.requiresConfirmation, true);
    assert.ok(req.confirmationPrompt?.includes('permanently delete'));
  });

  it('should auto-approve LOW risk operations without confirmation', () => {
    const pm = new PermissionManager();
    const req = pm.evaluateAction('open_application', { name: 'Code' }, 'Open VS Code');

    assert.strictEqual(req.riskLevel, 'LOW');
    assert.strictEqual(req.requiresConfirmation, false);
  });
});
