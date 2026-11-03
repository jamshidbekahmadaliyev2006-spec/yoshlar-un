import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { SettingsConfig } from '../types';

export function useAppConfig() {
  const [config, setConfig] = useState<SettingsConfig>(() => apiClient.getConfig());

  const updateConfig = (newCfg: Partial<SettingsConfig>) => {
    const updated = apiClient.saveConfig(newCfg);
    setConfig({ ...updated });
  };

  return { config, updateConfig };
}

