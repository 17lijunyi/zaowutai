import { describe, it, expect } from 'vitest';
import { createInstance } from 'i18next';
import { getThoughtLevelLabel } from '@/renderer/utils/model/thoughtLevelLabel';
import zh from '@/renderer/services/i18n/locales/zh-CN/agent.json';
import en from '@/renderer/services/i18n/locales/en-US/agent.json';

describe('thought level labels', () => {
  it('translates known protocol values with real locale resources, preserving unknown vendor labels', async () => {
    const i18n = createInstance();
    await i18n.init({
      lng: 'zh-CN',
      resources: { 'zh-CN': { translation: { agent: zh } }, 'en-US': { translation: { agent: en } } },
    });
    expect(
      ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'].map((value) => getThoughtLevelLabel(value, value, i18n.t))
    ).toEqual(['低', '中', '高', '极高', '最高', '超强']);
    expect(getThoughtLevelLabel('custom-deep', 'Deep Research', i18n.t)).toBe('Deep Research');
    await i18n.changeLanguage('en-US');
    expect(getThoughtLevelLabel('max', 'max', i18n.t)).toBe('Maximum');
  });
});
