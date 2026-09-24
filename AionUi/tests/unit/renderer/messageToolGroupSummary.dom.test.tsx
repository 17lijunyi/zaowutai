import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ipcBridge } from '@/common';
import type { TMessage } from '@/common/chat/chatLib';
import type { ToolMessage } from '@/common/chat/normalizeToolCall';
import MessageToolGroupSummary from '@/renderer/pages/conversation/Messages/components/MessageToolGroupSummary';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import zhTools from '@/renderer/services/i18n/locales/zh-CN/tools.json';
import zhCommon from '@/renderer/services/i18n/locales/zh-CN/common.json';

vi.mock('@/common', () => ({
  ipcBridge: {
    database: {
      getConversationMessage: {
        invoke: vi.fn(),
      },
    },
  },
}));

describe('MessageToolGroupSummary', () => {
  it('renders Chinese step labels and tool names without translating raw input or output', async () => {
    const i18n = createInstance();
    await i18n.init({
      lng: 'zh-CN',
      resources: { 'zh-CN': { translation: { tools: zhTools, common: zhCommon } } },
    });
    render(
      <I18nextProvider i18n={i18n}>
        <MessageToolGroupSummary
          messages={[
            {
              id: 'search-1',
              conversation_id: 'conversation-1',
              type: 'tool_call',
              content: {
                call_id: 'search-1',
                name: 'webSearch',
                status: 'completed',
                args: { query: 'exact English query' },
                output: 'original English result',
              },
            },
          ]}
        />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText('查看步骤 · 1'));
    fireEvent.click(screen.getByText('网页搜索'));

    expect(screen.getByText('输入')).toBeInTheDocument();
    expect(screen.getByText('输出')).toBeInTheDocument();
    expect(screen.getByText('original English result')).toBeInTheDocument();
    expect(screen.getByText(/exact English query/)).toBeInTheDocument();
  });

  it('shows a Chinese failure message when full tool output cannot be loaded', async () => {
    const i18n = createInstance();
    await i18n.init({
      lng: 'zh-CN',
      resources: { 'zh-CN': { translation: { tools: zhTools, common: zhCommon } } },
    });
    vi.mocked(ipcBridge.database.getConversationMessage.invoke).mockRejectedValueOnce(new Error('offline'));
    render(
      <I18nextProvider i18n={i18n}>
        <MessageToolGroupSummary
          messages={[
            {
              id: 'message-2',
              conversation_id: 'conversation-1',
              type: 'acp_tool_call',
              content: {
                _compact: { truncated: true },
                update: { tool_call_id: 'tool-2', title: 'custom_tool', kind: 'execute', status: 'completed' },
              },
            } as unknown as ToolMessage,
          ]}
        />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText('查看步骤 · 1'));
    fireEvent.click(screen.getByText('custom_tool'));

    expect(await screen.findByText('完整输出加载失败')).toBeInTheDocument();
    expect(screen.queryByText('Failed to load full output')).not.toBeInTheDocument();
  });

  it('loads full tool content when expanding a compact history item', async () => {
    const invoke = vi.mocked(ipcBridge.database.getConversationMessage.invoke);
    invoke.mockResolvedValue({
      id: 'message-1',
      conversation_id: 'conversation-1',
      type: 'acp_tool_call',
      content: {
        update: {
          session_update: 'tool_call',
          tool_call_id: 'tool-1',
          status: 'completed',
          title: 'rg',
          kind: 'search',
          raw_input: { pattern: 'needle', path: '.' },
          content: [{ type: 'content', content: { type: 'text', text: 'full output' } }],
        },
      },
    } as unknown as TMessage);

    render(
      <MessageToolGroupSummary
        messages={[
          {
            id: 'message-1',
            conversation_id: 'conversation-1',
            type: 'acp_tool_call',
            content: {
              _compact: {
                truncated: true,
                original_size: 90000,
                preview_chars: 4096,
              },
              update: {
                session_update: 'tool_call',
                tool_call_id: 'tool-1',
                status: 'completed',
                title: 'rg',
                kind: 'search',
                raw_input: { pattern: 'needle', path: '.' },
                content: [{ type: 'content', content: { type: 'text', text: 'preview' } }],
              },
            },
          } as unknown as ToolMessage,
        ]}
      />
    );

    fireEvent.click(screen.getByText('tools.summary.viewSteps · 1'));
    fireEvent.click(screen.getByText('rg'));

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith({
        conversation_id: 'conversation-1',
        message_id: 'message-1',
      });
    });
    expect(await screen.findByText('full output')).toBeInTheDocument();
  });
});
