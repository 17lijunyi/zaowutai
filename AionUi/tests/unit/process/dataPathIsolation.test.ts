import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const platform = vi.hoisted(() => ({ home: '', data: '' }));
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getHomeDir: () => platform.home,
      getDataDir: () => platform.data,
      needsCliSafeSymlinks: () => true,
      isPackaged: () => true,
    },
  }),
}));

import { getConfigPath, getDataPath } from '@/process/utils/utils';

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'aionui-path-isolation-'));
  platform.home = path.join(root, 'home');
  platform.data = path.join(root, 'production');
  mkdirSync(platform.home);
  for (const [alias, folder] of [
    ['.aionui', 'aionui'],
    ['.aionui-config', 'config'],
  ]) {
    const target = path.join(platform.data, folder);
    mkdirSync(target, { recursive: true });
    writeFileSync(path.join(target, 'keep.txt'), 'existing user data');
    symlinkSync(target, path.join(platform.home, alias), 'dir');
  }
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

describe('desktop test data isolation', () => {
  it('does not redirect production aliases, even before Electron applies its test userData path', () => {
    const sandbox = path.join(root, 'isolated data');
    vi.stubEnv('AIONUI_E2E_TEST', '1');
    vi.stubEnv('AIONUI_E2E_USER_DATA_DIR', sandbox);
    expect(getDataPath()).toBe(path.join(sandbox, 'aionui'));
    expect(getConfigPath()).toBe(path.join(sandbox, 'config'));
    for (const [alias, folder] of [
      ['.aionui', 'aionui'],
      ['.aionui-config', 'config'],
    ]) {
      expect(readlinkSync(path.join(platform.home, alias))).toBe(path.join(platform.data, folder));
      expect(readFileSync(path.join(platform.home, alias, 'keep.txt'), 'utf8')).toBe('existing user data');
    }
  });

  it('retains the existing production paths outside a test run', () => {
    vi.stubEnv('AIONUI_E2E_TEST', '');
    vi.stubEnv('AIONUI_E2E_USER_DATA_DIR', path.join(root, 'unused'));
    expect(getDataPath()).toBe(path.join(platform.home, '.aionui'));
    expect(getConfigPath()).toBe(path.join(platform.home, '.aionui-config'));
  });

  it('requires an explicit sandbox directory before bypassing the normal paths', () => {
    vi.stubEnv('AIONUI_E2E_TEST', '1');
    vi.stubEnv('AIONUI_E2E_USER_DATA_DIR', '   ');
    expect(getDataPath()).toBe(path.join(platform.home, '.aionui'));
    expect(getConfigPath()).toBe(path.join(platform.home, '.aionui-config'));
  });
});
