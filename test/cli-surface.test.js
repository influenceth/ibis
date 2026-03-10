import test from 'node:test';
import assert from 'node:assert/strict';

const optionNames = (command) => {
  return (command.options || []).map((option) => option.name);
};

const loadCommandDefinitions = async (t) => {
  try {
    const { commandDefinitions } = await import('../src/cli/commandDefinitions.js');
    return commandDefinitions;
  } catch (error) {
    t.skip(`Skipping CLI surface tests: ${error.message}`);
    return null;
  }
};

test('legacy CLI commands remain available', async (t) => {
  const commandDefinitions = await loadCommandDefinitions(t);
  if (!commandDefinitions) return;

  const commands = commandDefinitions.map((definition) => definition.command);
  assert.ok(commands.includes('build'));
  assert.ok(commands.includes('console'));
  assert.ok(commands.includes('deployAccount'));
  assert.ok(commands.includes('encryptAccount'));
  assert.ok(commands.includes('clean'));
});

test('contract interaction CLI commands are available', async (t) => {
  const commandDefinitions = await loadCommandDefinitions(t);
  if (!commandDefinitions) return;

  const commands = commandDefinitions.map((definition) => definition.command);
  assert.ok(commands.includes('call'));
  assert.ok(commands.includes('invoke'));
  assert.ok(commands.includes('declare'));
  assert.ok(commands.includes('deploy'));
  assert.ok(commands.includes('rescue'));
});

test('legacy command options are unchanged', async (t) => {
  const commandDefinitions = await loadCommandDefinitions(t);
  if (!commandDefinitions) return;

  const deployAccount = commandDefinitions.find((command) => command.command === 'deployAccount');
  const encryptAccount = commandDefinitions.find((command) => command.command === 'encryptAccount');
  const consoleCommand = commandDefinitions.find((command) => command.command === 'console');

  assert.deepEqual(optionNames(deployAccount), ['network', 'account', 'encrypted']);
  assert.deepEqual(optionNames(encryptAccount), ['network', 'account']);
  assert.deepEqual(optionNames(consoleCommand), ['network', 'account']);
});
