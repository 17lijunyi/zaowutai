/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IMessagePermission } from '@/common/chat/chatLib';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getToolDisplayName } from '@/renderer/services/i18n/toolLabels';
import { PermissionRequestPanel } from './PermissionRequestPanel';
import {
  classifyLegacyPermission,
  getPermissionOptionLabel,
  normalizePermissionOperationKind,
  type PermissionPanelOption,
} from './permissionOptions';

type MessagePermissionProps = {
  message: IMessagePermission;
};

const MessagePermission: React.FC<MessagePermissionProps> = React.memo(({ message }) => {
  const { t } = useTranslation();
  const content = message.content || ({} as IMessagePermission['content']);
  const { description, title, action, call_id, command_type } = content;
  const options = Array.isArray(content.options) ? content.options : [];
  const rawTitle = title || description || t('messages.permissionRequest');
  const displayTitle = getToolDisplayName(rawTitle, t);

  const panelOptions = useMemo<PermissionPanelOption[]>(
    () =>
      options.map((option, index) => {
        const value = option ? String(option.value) : '';
        const fallbackId = `option_${index}`;
        const label = option?.label || `${t('messages.option')} ${index + 1}`;
        const intent = classifyLegacyPermission(value);
        return {
          id: `${value || fallbackId}:${index}`,
          value,
          label: getPermissionOptionLabel(t(label, { ...option?.params, defaultValue: label }), intent, t),
          intent,
          testId: `message-permission-option-${value || fallbackId}`,
        };
      }),
    [options, t]
  );

  const handleConfirm = useCallback(
    async (selectedValue: string) => {
      await ipcBridge.conversation.confirmation.confirm.invoke({
        conversation_id: message.conversation_id,
        call_id,
        msg_id: message.msg_id || '',
        data: { value: selectedValue },
        always_allow: selectedValue === 'proceed_always',
      });
    },
    [call_id, message.conversation_id, message.msg_id]
  );

  return (
    <PermissionRequestPanel
      requestKey={`${message.id}:${call_id}`}
      testIdPrefix='message-permission'
      title={displayTitle}
      description={description && description !== rawTitle ? description : undefined}
      operationKind={normalizePermissionOperationKind(action)}
      detail={command_type}
      options={panelOptions}
      onConfirm={handleConfirm}
    />
  );
});

export { PermissionRequestPanel } from './PermissionRequestPanel';
export {
  classifyAcpPermission,
  classifyLegacyPermission,
  getPermissionOptionsIdentity,
  getPermissionOptionLabel,
  getSafePermissionOptionId,
  normalizePermissionOperationKind,
} from './permissionOptions';
export type { PermissionIntent, PermissionOperationKind, PermissionPanelOption } from './permissionOptions';
export default MessagePermission;
