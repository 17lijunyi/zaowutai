import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const arcoOverridePath = path.resolve(process.cwd(), 'packages/desktop/src/renderer/styles/arco-override.css');

const luminance = (hex: string) => {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

describe('arco tooltip and popover overlay styles', () => {
  it('defines shared light and dark overlay tokens for tooltip-like surfaces', () => {
    const css = fs.readFileSync(arcoOverridePath, 'utf8');

    expect(css).toContain('--aion-overlay-bg: var(--paper-elevated);');
    expect(css).toContain('--aion-overlay-text: var(--text-primary);');
    expect(css).toContain("body[arco-theme='dark'] {");
  });

  it('applies the shared overlay tokens to tooltip, popover, and popconfirm surfaces', () => {
    const css = fs.readFileSync(arcoOverridePath, 'utf8');

    expect(css).toContain('.arco-tooltip-content,');
    expect(css).toContain('.arco-popover-content,');
    expect(css).toContain('.arco-popconfirm-content {');
    expect(css).toContain('background: var(--aion-overlay-bg) !important;');
    expect(css).toContain('color: var(--aion-overlay-text) !important;');
    expect(css).toContain('border: 1px solid var(--aion-overlay-border) !important;');
    expect(css).toContain('.arco-trigger-arrow.arco-tooltip-arrow,');
    expect(css).toContain('.arco-popover-arrow.arco-trigger-arrow,');
    expect(css).toContain('.arco-popconfirm-arrow.arco-trigger-arrow {');
  });

  it('defines a dark-mode override selector that can beat preset-specific tooltip rules', () => {
    const css = fs.readFileSync(arcoOverridePath, 'utf8');

    expect(css).toContain("html[data-theme='dark'] body .arco-tooltip-content,");
    expect(css).toContain("html[data-theme='dark'] body .arco-popover-content,");
    expect(css).toContain("html[data-theme='dark'] body .arco-popconfirm-content,");
    expect(css).toContain("body[arco-theme='dark'] .arco-popconfirm-content {");
  });

  it('does not skin nested popover wrappers as a second surface', () => {
    const css = fs.readFileSync(arcoOverridePath, 'utf8');

    expect(css).not.toContain('.arco-popover-inner,');
    expect(css).not.toContain('.arco-tooltip-inner,');
  });

  it('keeps normal text and accent links readable on paper in both appearances', () => {
    const palette = fs.readFileSync(
      path.resolve(process.cwd(), 'packages/desktop/src/renderer/styles/themes/default-color-scheme.css'),
      'utf8'
    );

    for (const appearance of palette.split('/* Dark Mode */')) {
      const tokens = Object.fromEntries(
        Array.from(appearance.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi), (match) => [match[1], match[2]])
      );
      for (const foreground of ['--text-primary', '--text-secondary', '--primary']) {
        for (const background of ['--bg-1', '--paper-surface', '--paper-elevated', '--message-user-bg']) {
          const light = luminance(tokens[foreground]);
          const dark = luminance(tokens[background]);
          const contrast = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
          expect(contrast, `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
