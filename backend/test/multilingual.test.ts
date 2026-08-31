import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MultilingualEngine } from '../src/agent/multilingual';
import { IntentDetector } from '../src/agent/intentDetector';

describe('Multilingual Engine Tests', () => {
  it('should detect Devanagari Hindi correctly', () => {
    const lang = MultilingualEngine.detectLanguage('वीएस कोड खोलो');
    assert.strictEqual(lang, 'hindi');
  });

  it('should detect Roman Hindi / Hinglish correctly', () => {
    const lang = MultilingualEngine.detectLanguage('Hey WAR, VS Code kholo aur Sportify project open karo');
    assert.ok(lang === 'hinglish' || lang === 'roman_hindi');
  });

  it('should detect English correctly', () => {
    const lang = MultilingualEngine.detectLanguage('Can you open Visual Studio Code for me?');
    assert.strictEqual(lang, 'english');
  });

  it('should detect voice interruption commands', () => {
    assert.strictEqual(MultilingualEngine.isInterruptionCommand('ruko'), true);
    assert.strictEqual(MultilingualEngine.isInterruptionCommand('stop'), true);
    assert.strictEqual(MultilingualEngine.isInterruptionCommand('bas karo'), true);
    assert.strictEqual(MultilingualEngine.isInterruptionCommand('cancel'), true);
    assert.strictEqual(MultilingualEngine.isInterruptionCommand('VS Code kholo'), false);
  });
});

describe('Intent Detection Tests', () => {
  it('should map VS Code open variations to OPEN_VSCODE / OPEN_PROJECT', () => {
    const intent1 = IntentDetector.parse('VS Code kholo');
    assert.ok(intent1.primaryIntent === 'OPEN_VSCODE' || intent1.suggestedTools.some(t => t.tool.includes('vscode')));

    const intent2 = IntentDetector.parse('Sportify project kholo');
    assert.strictEqual(intent2.primaryIntent, 'OPEN_PROJECT');
    assert.strictEqual(intent2.entities.projectName, 'Sportify');
  });

  it('should parse terminal command requests', () => {
    const intent = IntentDetector.parse('npm run dev chalao');
    assert.strictEqual(intent.primaryIntent, 'RUN_COMMAND');
    assert.strictEqual(intent.entities.command, 'npm run dev');
  });
});
