import type { TFunction } from 'i18next';

const thoughtLevelKeys = {
  none: 'agent.thoughtLevel.levels.none',
  off: 'agent.thoughtLevel.levels.none',
  minimal: 'agent.thoughtLevel.levels.minimal',
  low: 'agent.thoughtLevel.levels.low',
  medium: 'agent.thoughtLevel.levels.medium',
  high: 'agent.thoughtLevel.levels.high',
  xhigh: 'agent.thoughtLevel.levels.xhigh',
  max: 'agent.thoughtLevel.levels.max',
  ultra: 'agent.thoughtLevel.levels.ultra',
  auto: 'agent.thoughtLevel.levels.auto',
} as const;

export function getThoughtLevelLabel(value: string, label: string | undefined, t: TFunction): string {
  const key = thoughtLevelKeys[value.toLowerCase() as keyof typeof thoughtLevelKeys];
  return key ? t(key, { defaultValue: label || value }) : label || value;
}
