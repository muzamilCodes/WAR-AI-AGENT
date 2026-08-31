import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ContextMemoryManager } from '../src/agent/contextMemory';

describe('Context Memory & Pronoun Resolution', () => {
  it('should resolve "iska" to current active project', () => {
    const memory = new ContextMemoryManager();
    memory.updateActiveProject('Sportify', 'C:\\Users\\User\\Desktop\\Sportify');

    const resolution = memory.resolveContextualTarget('Ab iska terminal kholo');
    assert.strictEqual(resolution.hasResolution, true);
    assert.strictEqual(resolution.resolvedType, 'project');
    assert.strictEqual(resolution.targetName, 'Sportify');
    assert.strictEqual(resolution.targetPath, 'C:\\Users\\User\\Desktop\\Sportify');
  });

  it('should resolve "isko" to run active project', () => {
    const memory = new ContextMemoryManager();
    memory.updateActiveProject('Sportify', 'C:\\Users\\User\\Desktop\\Sportify');

    const resolution = memory.resolveContextualTarget('isko run karo');
    assert.strictEqual(resolution.hasResolution, true);
    assert.strictEqual(resolution.targetName, 'Sportify');
  });
});
