'use client';

import { API_URL, authHeaders } from '@/app/lib/api';
import type { BootstrapPayload } from '@/app/lib/bootstrapTypes';
import { useQuery } from '@tanstack/react-query';

async function fetchBootstrap(): Promise<BootstrapPayload> {
  const response = await fetch(`${API_URL}/bootstrap`, { credentials: 'include', headers: authHeaders() });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Bootstrap failed (${response.status})`);
  }
  return response.json();
}

export function useBootstrap(enabled: boolean) {
  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: fetchBootstrap,
    enabled,
  });
}
