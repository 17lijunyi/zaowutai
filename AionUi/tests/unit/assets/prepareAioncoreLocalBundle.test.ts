import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { prepareAioncore } = require('../../../packages/shared-scripts/src/prepare-aioncore');

describe('prepare-aioncore local bundle input', () => {
  it('does not silently download upstream when the configured fork source is missing', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'aionui-workspace-backend-'));
    const projectRoot = join(tmp, 'project');
    mkdirSync(projectRoot, { recursive: true });
    writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ aioncoreSource: '../missing-core' }));
    try {
      expect(() =>
        prepareAioncore({ projectRoot, platform: process.platform, arch: process.arch, version: 'v0.2.2' })
      ).toThrow(/Configured AionCore source is missing.*Refusing to replace it with upstream/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('refuses to execute a workspace backend compiled for a different host', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'aionui-workspace-backend-target-'));
    const projectRoot = join(tmp, 'project');
    const sourceRoot = join(tmp, 'core');
    mkdirSync(projectRoot, { recursive: true });
    mkdirSync(sourceRoot);
    writeFileSync(join(projectRoot, 'package.json'), JSON.stringify({ aioncoreSource: '../core' }));
    writeFileSync(join(sourceRoot, 'Cargo.toml'), '[workspace]\n');
    try {
      expect(() =>
        prepareAioncore({
          projectRoot,
          platform: process.platform === 'win32' ? 'darwin' : 'win32',
          arch: process.arch,
          version: 'v0.2.2',
        })
      ).toThrow(/Build AionCore on the target host/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('hard fails local bundle input that lacks managed-resources manifest', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'aionui-local-bundle-'));
    const projectRoot = join(tmp, 'project');
    const localBundle = join(tmp, 'bundle');
    mkdirSync(join(localBundle, 'managed-resources'), { recursive: true });
    writeFileSync(join(localBundle, 'aioncore.exe'), '');

    const previous = process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR;
    process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR = localBundle;
    try {
      expect(() =>
        prepareAioncore({
          projectRoot,
          platform: 'win32',
          arch: 'x64',
          version: 'v0.1.46',
        })
      ).toThrow(/managed-resources\/manifest\.json/);
    } finally {
      if (previous === undefined) delete process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR;
      else process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR = previous;
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it.skipIf(process.platform === 'win32')('preserves relative symlinks in managed runtimes', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'aionui-local-bundle-links-'));
    const projectRoot = join(tmp, 'project');
    const localBundle = join(tmp, 'bundle');
    const nodeRoot = join(localBundle, 'managed-resources', 'node', 'node-v24.11.0-darwin-arm64');
    mkdirSync(join(nodeRoot, 'bin'), { recursive: true });
    writeFileSync(join(localBundle, 'aioncore'), '');
    writeFileSync(join(nodeRoot, 'bin', 'node'), '');
    symlinkSync('node', join(nodeRoot, 'bin', 'npm'));
    writeFileSync(
      join(localBundle, 'managed-resources', 'manifest.json'),
      JSON.stringify({
        schemaVersion: 2,
        runtimeKey: 'darwin-arm64',
        node: {
          version: '24.11.0',
          root: 'node/node-v24.11.0-darwin-arm64',
          executable: 'bin/node',
        },
        clis: [],
      })
    );

    const previous = process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR;
    process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR = localBundle;
    try {
      prepareAioncore({
        projectRoot,
        platform: 'darwin',
        arch: 'arm64',
        version: 'v0.2.2',
      });

      expect(
        readlinkSync(
          join(
            projectRoot,
            'resources',
            'bundled-aioncore',
            'darwin-arm64',
            'managed-resources',
            'node',
            'node-v24.11.0-darwin-arm64',
            'bin',
            'npm'
          )
        )
      ).toBe('node');
    } finally {
      if (previous === undefined) delete process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR;
      else process.env.AIONUI_BACKEND_LOCAL_BUNDLE_DIR = previous;
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
