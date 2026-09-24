export const useInputFocusRing = () => {
  // CSS tokens react to appearance/custom-theme changes without fixed colors.
  return {
    activeBorderColor: 'var(--primary)',
    inactiveBorderColor: 'var(--border-base)',
    activeShadow: '0 0 0 2px color-mix(in srgb, var(--primary) 14%, transparent)',
  };
};
