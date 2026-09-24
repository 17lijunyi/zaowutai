/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { getThoughtLevelLabel } from '@/renderer/utils/model/thoughtLevelLabel';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { iconColors } from '@/renderer/styles/colors';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import type { AgentRuntimeDerivedOption } from '@/renderer/utils/model/agentRuntimeCatalog';
import type { AcpModelInfo } from '../types';
import { getAvailableModels } from '../utils/modelUtils';
import { Button, Dropdown, Menu, Tooltip, Message } from '@arco-design/web-react';
import { Brain, Down, Plus, Refresh } from '@icon-park/react';
import React, { useEffect, useRef, useState } from 'react';
import { ipcBridge } from '@/common';
import { refreshManagedAgentCatalogAndAssistants } from '@/renderer/hooks/agent/useManagedAgents';
import {
  buildAgentRuntimeModelInfo,
  buildAgentRuntimeThoughtLevelOption,
} from '@/renderer/utils/model/agentRuntimeCatalog';
import { formatManagedAgentDiagnosticMessage } from '@/renderer/utils/model/agentTypes';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  composeRuntimeSelectorLabel,
  getCurrentThoughtLevelLabel,
  RUNTIME_SUBMENU_TRIGGER_PROPS,
  RuntimeSelectorCheckedItem,
  RuntimeSelectorModelList,
  type RuntimeSelectorModelGroup,
  RuntimeSelectorSubMenuTitle,
} from '@/renderer/components/agent/runtimeSelectorOptions';

type GuidModelSelectorProps = {
  agentId?: string;
  // Gemini model state
  isGeminiMode: boolean;
  modelList: IProvider[];
  current_model: TProviderWithModel | undefined;
  setCurrentModel: (model: TProviderWithModel) => Promise<void>;

  // ACP model state
  currentAcpCachedModelInfo: AcpModelInfo | null;
  selectedAcpModel: string | null;
  setSelectedAcpModel: React.Dispatch<React.SetStateAction<string | null>>;
  thoughtLevelOption?: AgentRuntimeDerivedOption | null;
  onThoughtLevelSelect?: (value: string) => void;
};

/** Composite id for a provider+model pair, so the shared flat model list can track selection. */
const providerCompositeId = (providerId: string, modelName: string) => `${providerId}::${modelName}`;

const GuidModelSelector: React.FC<GuidModelSelectorProps> = ({
  agentId,
  isGeminiMode,
  modelList,
  current_model,
  setCurrentModel,
  currentAcpCachedModelInfo,
  selectedAcpModel,
  setSelectedAcpModel,
  thoughtLevelOption,
  onThoughtLevelSelect,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const defaultModelLabel = t('common.defaultModel');
  const [loadingModels, setLoadingModels] = useState(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const loadModels = async () => {
    if (!agentId || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingModels(true);
    try {
      const result = await ipcBridge.acpConversation.checkManagedAgentHealthById.invoke({ id: agentId });
      if (!mountedRef.current) return;
      if (result.status !== 'online') {
        await refreshManagedAgentCatalogAndAssistants();
        Message.error(formatManagedAgentDiagnosticMessage(t, result) || t('agent.model.loadFailed'));
        return;
      }
      // The backend serializes catalog writes on a separate channel. A successful
      // health response can arrive before its model snapshot is committed.
      const previousModels = JSON.stringify(currentAcpCachedModelInfo);
      for (let attempt = 0; attempt < 4; attempt++) {
        const agents = await refreshManagedAgentCatalogAndAssistants();
        if (!mountedRef.current) return;
        const agent = agents?.find((agent) => agent.id === agentId);
        const models = buildAgentRuntimeModelInfo(agent);
        // A cached nonempty list can still be the old snapshot. Allow the queued
        // catalog write to land even when this refresh returns the same models.
        if (models?.available_models.length && (JSON.stringify(models) !== previousModels || attempt === 3)) {
          if (selectedAcpModel && !models.available_models.some((model) => model.id === selectedAcpModel)) {
            setSelectedAcpModel(null);
          }
          const thoughtLevel = buildAgentRuntimeThoughtLevelOption(agent);
          if (
            thoughtLevelOption?.currentValue &&
            thoughtLevel &&
            !thoughtLevel.options.some((option) => option.value === thoughtLevelOption.currentValue)
          ) {
            const fallback = thoughtLevel.currentValue || thoughtLevel.options[0]?.value;
            if (fallback) onThoughtLevelSelect?.(fallback);
          }
          Message.success(t('agent.model.refreshSuccess'));
          return;
        }
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 250));
      }
      Message.info(t('settings.noAvailableModels'));
    } catch (error) {
      console.error('[Guid] Failed to load agent models:', error);
      if (mountedRef.current) Message.error(t('agent.model.loadFailed'));
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoadingModels(false);
    }
  };

  // 过滤掉被禁用的 provider
  const enabledModelList = React.useMemo(() => {
    return modelList.filter((p) => p.enabled !== false);
  }, [modelList]);

  const geminiSelectedLabel = React.useMemo(() => {
    if (!current_model?.use_model) return '';
    return current_model.use_model;
  }, [current_model?.use_model]);

  const geminiButtonLabel = React.useMemo(() => {
    return getModelDisplayLabel({
      selected_value: current_model?.use_model,
      selectedLabel: geminiSelectedLabel,
      defaultModelLabel,
      fallbackLabel: defaultModelLabel,
    });
  }, [current_model?.use_model, defaultModelLabel, geminiSelectedLabel]);

  const acpSelectedLabel = React.useMemo(() => {
    return (
      currentAcpCachedModelInfo?.available_models?.find((m) => m.id === selectedAcpModel)?.label ||
      currentAcpCachedModelInfo?.current_model_label ||
      currentAcpCachedModelInfo?.current_model_id ||
      ''
    );
  }, [
    currentAcpCachedModelInfo?.available_models,
    currentAcpCachedModelInfo?.current_model_id,
    currentAcpCachedModelInfo?.current_model_label,
    selectedAcpModel,
  ]);

  const acpButtonLabel = React.useMemo(() => {
    return getModelDisplayLabel({
      selected_value: selectedAcpModel || currentAcpCachedModelInfo?.current_model_id,
      selectedLabel: acpSelectedLabel,
      defaultModelLabel,
      fallbackLabel: defaultModelLabel,
    });
  }, [acpSelectedLabel, currentAcpCachedModelInfo?.current_model_id, defaultModelLabel, selectedAcpModel]);
  const selectedThoughtLevelValue = thoughtLevelOption?.currentValue || thoughtLevelOption?.options[0]?.value || '';
  const normalizedThoughtLevelOption =
    thoughtLevelOption && thoughtLevelOption.options.length > 0
      ? {
          ...thoughtLevelOption,
          currentValue: selectedThoughtLevelValue || null,
        }
      : null;
  const combinedAcpButtonLabel = composeRuntimeSelectorLabel({
    t,
    modelLabel: acpButtonLabel,
    thoughtLevel: normalizedThoughtLevelOption,
  });

  if (isGeminiMode) {
    // Provider-grouped models (e.g. aionrs). Build groups + a composite-id lookup
    // so the shared model list can search across providers and map back on select.
    const providerModelGroups: RuntimeSelectorModelGroup[] = [];
    const providerModelLookup = new Map<string, { provider: IProvider; modelName: string }>();
    for (const provider of enabledModelList) {
      const available_models = getAvailableModels(provider);
      if (available_models.length === 0) continue;
      providerModelGroups.push({
        key: provider.id,
        title: provider.name,
        models: available_models.map((modelName) => {
          const id = providerCompositeId(provider.id, modelName);
          providerModelLookup.set(id, { provider, modelName });
          return { id, label: modelName };
        }),
      });
    }
    const currentProviderModelId = current_model
      ? providerCompositeId(current_model.id, current_model.use_model || '')
      : null;
    const addModelItem = (
      <Menu.Item key='add-model' className='text-12px text-t-secondary' onClick={() => navigate('/settings/model')}>
        <Plus theme='outline' size='12' />
        {t('settings.addModel')}
      </Menu.Item>
    );

    return (
      <Dropdown
        trigger='hover'
        droplist={
          <Menu selectedKeys={currentProviderModelId ? [currentProviderModelId] : []}>
            {providerModelGroups.length === 0
              ? [
                  <Menu.Item
                    key='no-models'
                    className='px-12px py-12px text-t-secondary text-14px text-center flex justify-center items-center'
                    disabled
                  >
                    {t('settings.noAvailableModels')}
                  </Menu.Item>,
                  addModelItem,
                ]
              : [
                  <RuntimeSelectorModelList
                    key='model-list'
                    groups={providerModelGroups}
                    currentModelId={currentProviderModelId}
                    onSelect={(id) => {
                      const entry = providerModelLookup.get(id);
                      if (!entry) return;
                      setCurrentModel({ ...entry.provider, use_model: entry.modelName } as TProviderWithModel).catch(
                        (error) => {
                          console.error('Failed to set current model:', error);
                        }
                      );
                    }}
                  />,
                  addModelItem,
                ]}
          </Menu>
        }
      >
        <Button
          className={'sendbox-model-btn guid-config-btn'}
          shape='round'
          size='small'
          data-testid='guid-model-selector'
        >
          <span className='flex items-center gap-6px min-w-0'>
            <Brain theme='outline' size='14' fill={iconColors.secondary} className='shrink-0' />
            <span className='guid-model-label'>{geminiButtonLabel}</span>
            <Down theme='outline' size='12' fill={iconColors.secondary} className='shrink-0' />
          </span>
        </Button>
      </Dropdown>
    );
  }

  // ACP cached model selector
  if (currentAcpCachedModelInfo && currentAcpCachedModelInfo.available_models?.length > 0) {
    if (currentAcpCachedModelInfo.available_models.length > 0) {
      const modelListNode = (
        <RuntimeSelectorModelList
          models={currentAcpCachedModelInfo.available_models}
          currentModelId={selectedAcpModel}
          disabled={loadingModels}
          onSelect={(modelId) => setSelectedAcpModel(modelId)}
        />
      );

      return (
        <Dropdown
          trigger='click'
          droplist={
            <Menu selectedKeys={selectedAcpModel ? [selectedAcpModel] : []}>
              {normalizedThoughtLevelOption ? (
                <>
                  {/* Two-level layout: model row on top, thought-level row below;
                      each expands into a left-side submenu. */}
                  <Menu.SubMenu
                    key='model'
                    triggerProps={RUNTIME_SUBMENU_TRIGGER_PROPS}
                    title={
                      <RuntimeSelectorSubMenuTitle
                        label={t('common.model', { defaultValue: 'Model' })}
                        value={acpButtonLabel}
                      />
                    }
                  >
                    {modelListNode}
                  </Menu.SubMenu>
                  <Menu.SubMenu
                    key='thought-level'
                    triggerProps={RUNTIME_SUBMENU_TRIGGER_PROPS}
                    title={
                      <RuntimeSelectorSubMenuTitle
                        label={t('agent.thoughtLevel.label')}
                        value={getCurrentThoughtLevelLabel(normalizedThoughtLevelOption, t)}
                      />
                    }
                  >
                    {normalizedThoughtLevelOption.options.map((item) => (
                      <Menu.Item
                        key={item.value}
                        disabled={loadingModels}
                        className={item.value === normalizedThoughtLevelOption.currentValue ? '!bg-2' : ''}
                        onClick={() => onThoughtLevelSelect?.(item.value)}
                      >
                        <RuntimeSelectorCheckedItem
                          selected={item.value === normalizedThoughtLevelOption.currentValue}
                          description={item.description}
                        >
                          {getThoughtLevelLabel(item.value, item.label, t)}
                        </RuntimeSelectorCheckedItem>
                      </Menu.Item>
                    ))}
                  </Menu.SubMenu>
                </>
              ) : (
                modelListNode
              )}
              {agentId && (
                <Menu.Item
                  key='refresh-models'
                  disabled={loadingModels}
                  onClick={() => {
                    void loadModels();
                  }}
                >
                  <span className='flex items-center gap-8px'>
                    <Refresh theme='outline' size='14' />
                    {t('agent.model.refreshModels')}
                  </span>
                </Menu.Item>
              )}
            </Menu>
          }
        >
          <Button className={'sendbox-model-btn guid-config-btn'} shape='round' size='small' loading={loadingModels}>
            <span className='flex items-center gap-6px min-w-0'>
              <Brain theme='outline' size='14' fill={iconColors.secondary} className='shrink-0' />
              <span className='guid-model-label'>{combinedAcpButtonLabel}</span>
              <Down theme='outline' size='12' fill={iconColors.secondary} className='shrink-0' />
            </span>
          </Button>
        </Dropdown>
      );
    }

    return (
      <Tooltip content={t('conversation.welcome.modelSwitchNotSupported')} position='top'>
        <Button
          className={'sendbox-model-btn guid-config-btn'}
          shape='round'
          size='small'
          style={{ cursor: 'default' }}
        >
          <span className='flex items-center gap-6px min-w-0'>
            <Brain theme='outline' size='14' fill={iconColors.secondary} className='shrink-0' />
            <span className='guid-model-label'>{acpButtonLabel}</span>
          </span>
        </Button>
      </Tooltip>
    );
  }

  // An empty cache is not evidence that the agent cannot switch models.
  return (
    <Tooltip
      content={t(agentId ? 'agent.model.loadModels' : 'conversation.welcome.modelSwitchNotSupported')}
      position='top'
    >
      <Button
        className={'sendbox-model-btn guid-config-btn'}
        shape='round'
        size='small'
        loading={loadingModels}
        disabled={!agentId}
        onClick={() => {
          void loadModels();
        }}
      >
        <span className='flex items-center gap-6px min-w-0'>
          <Brain theme='outline' size='14' fill={iconColors.secondary} className='shrink-0' />
          <span className='guid-model-label'>{agentId ? t('agent.model.loadModels') : defaultModelLabel}</span>
        </span>
      </Button>
    </Tooltip>
  );
};

export default GuidModelSelector;
