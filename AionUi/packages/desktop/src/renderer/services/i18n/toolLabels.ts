import type { TFunction } from 'i18next';

const TOOL_LABEL_KEYS: Record<string, string> = {
  commandexecution: 'tools.kinds.execute',
  execute: 'tools.kinds.execute',
  exec: 'tools.kinds.execute',
  shell: 'tools.kinds.execute',
  shellcommand: 'tools.kinds.execute',
  runshellcommand: 'tools.kinds.execute',
  bash: 'tools.kinds.execute',
  fileedit: 'tools.kinds.edit',
  editfile: 'tools.kinds.edit',
  edit: 'tools.kinds.edit',
  applypatch: 'tools.kinds.edit',
  fileread: 'tools.kinds.read',
  readfile: 'tools.kinds.read',
  read: 'tools.kinds.read',
  filewrite: 'tools.kinds.write',
  writefile: 'tools.kinds.write',
  write: 'tools.kinds.write',
  websearch: 'tools.webSearch.displayName',
  webfetch: 'tools.kinds.fetch',
  fetch: 'tools.kinds.fetch',
  search: 'tools.kinds.search',
  grep: 'tools.kinds.search',
  tool: 'tools.kinds.tool',
  askuserquestion: 'tools.kinds.ask',
};

const CODEX_COMMAND_LABEL_KEYS: Record<string, string> = {
  Read: 'tools.kinds.read',
  Search: 'tools.kinds.search',
  'List files': 'tools.kinds.list',
  Run: 'tools.kinds.execute',
};

/** Translate known protocol labels without altering custom tool names or command text. */
export function getToolDisplayName(name: string, t: TFunction, protocolType?: string): string {
  // AionCore's command_execution_display_name adds these labels to Codex items.
  // Require the protocol type so similarly named custom tools remain untouched.
  if (protocolType === 'commandExecution') {
    const match = /^(Read|Search|List files|Run) (.+?)(?: · (\d+) actions)?$/.exec(name);
    if (match) {
      const [, verb, detail, actionCount] = match;
      const countLabel = actionCount ? ` · ${t('tools.summary.actionCount', { count: Number(actionCount) })}` : '';
      return `${t(CODEX_COMMAND_LABEL_KEYS[verb])} ${detail}${countLabel}`;
    }
  }
  const key =
    TOOL_LABEL_KEYS[
      name
        .trim()
        .replace(/[\s_-]/g, '')
        .toLowerCase()
    ];
  return typeof key === 'string' ? t(key) : name;
}
