import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuidModelSelector from '@/renderer/pages/guid/components/GuidModelSelector';

const { check, refresh, error, info, success } = vi.hoisted(() => ({
  check: vi.fn(),
  refresh: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
}));
vi.mock('@/common', () => ({ ipcBridge: { acpConversation: { checkManagedAgentHealthById: { invoke: check } } } }));
vi.mock('@/renderer/hooks/agent/useManagedAgents', () => ({ refreshManagedAgentCatalogAndAssistants: refresh }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key }),
}));
vi.mock('@arco-design/web-react', async (original) => ({
  ...(await original<typeof import('@arco-design/web-react')>()),
  Message: { error, info, success },
}));
const model = { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro' };
const rows = [
  {
    id: 'pi',
    available_models: { current_model_id: model.id, current_model_label: model.label, available_models: [model] },
  },
];
const props = {
  agentId: 'pi',
  isGeminiMode: false,
  modelList: [],
  current_model: undefined,
  setCurrentModel: vi.fn(),
  currentAcpCachedModelInfo: null,
  selectedAcpModel: null,
  setSelectedAcpModel: vi.fn(),
};

describe('GuidModelSelector empty catalog recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    check.mockResolvedValue({ id: 'pi', status: 'online' });
    refresh.mockResolvedValue(rows);
  });

  it('refreshes a populated list and removes a selection no longer offered by the new API', async () => {
    const cached = { current_model_id: model.id, current_model_label: model.label, available_models: [model] };
    const replacement = { id: 'other/new-model', label: 'New model' };
    refresh.mockResolvedValueOnce(rows).mockResolvedValue([
      {
        id: 'pi',
        available_models: {
          current_model_id: replacement.id,
          available_models: [replacement],
        },
      },
    ]);
    render(<GuidModelSelector {...props} selectedAcpModel={model.id} currentAcpCachedModelInfo={cached} />);
    fireEvent.click(screen.getByRole('button', { name: model.label }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'agent.model.refreshModels' }));
    await waitFor(() => expect(success).toHaveBeenCalledWith('agent.model.refreshSuccess'));
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(props.setSelectedAcpModel).toHaveBeenCalledWith(null);
  });

  it('keeps the selected model when a refresh fails', async () => {
    check.mockRejectedValueOnce(new Error('network unavailable'));
    render(
      <GuidModelSelector
        {...props}
        selectedAcpModel={model.id}
        currentAcpCachedModelInfo={{ current_model_id: model.id, available_models: [model] }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: model.label }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'agent.model.refreshModels' }));
    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(props.setSelectedAcpModel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: model.label })).toBeInTheDocument();
  });

  it('loads a previously unprobed agent and lets the user select its advertised model', async () => {
    const view = render(<GuidModelSelector {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'agent.model.loadModels' }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(check).toHaveBeenCalledWith({ id: 'pi' });
    view.rerender(
      <GuidModelSelector
        {...props}
        currentAcpCachedModelInfo={{
          current_model_id: model.id,
          current_model_label: model.label,
          available_models: [model],
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'DeepSeek V4 Pro' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'DeepSeek V4 Pro' }));
    expect(props.setSelectedAcpModel).toHaveBeenCalledWith(model.id);
  });

  it('waits for delayed catalog persistence without starting a second probe', async () => {
    refresh.mockResolvedValueOnce([]).mockResolvedValue(rows);
    render(<GuidModelSelector {...props} />);
    const button = screen.getByRole('button', { name: 'agent.model.loadModels' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    expect(check).toHaveBeenCalledTimes(1);
    expect(info).not.toHaveBeenCalled();
  });

  it('shows a retryable failure when loading fails', async () => {
    check.mockRejectedValueOnce(new Error('connection unavailable'));
    render(<GuidModelSelector {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'agent.model.loadModels' }));
    await waitFor(() => expect(error).toHaveBeenCalledWith('agent.model.loadFailed'));
    fireEvent.click(screen.getByRole('button', { name: 'agent.model.loadModels' }));
    await waitFor(() => expect(check).toHaveBeenCalledTimes(2));
  });

  it('does not fabricate models for an online agent that advertises none', async () => {
    refresh.mockResolvedValue([]);
    render(<GuidModelSelector {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'agent.model.loadModels' }));
    await waitFor(() => expect(info).toHaveBeenCalledWith('settings.noAvailableModels'), { timeout: 2000 });
    expect(props.setSelectedAcpModel).not.toHaveBeenCalled();
  });
});
