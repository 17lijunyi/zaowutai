import { configService } from '@/common/config/configService';

export function readGuidThoughtLevel(assistantId: string | null): string | undefined {
  if (!assistantId) return undefined;
  const value = configService.get('guid.thoughtLevelByAssistant')?.[assistantId];
  return typeof value === 'string' && value ? value : undefined;
}

export function saveGuidThoughtLevel(assistantId: string, value: string): Promise<void> {
  return configService.set('guid.thoughtLevelByAssistant', {
    ...configService.get('guid.thoughtLevelByAssistant'),
    [assistantId]: value,
  });
}
