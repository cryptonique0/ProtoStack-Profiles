'use client';

import { useState, useCallback } from 'react';

interface CopyState {
  copied: boolean;
  error: Error | null;
}

export function useCopyToClipboard(
  timeout = 2000
): [CopyState, (text: string) => Promise<boolean>] {
  const [state, setState] = useState<CopyState>({
    copied: false,
    error: null,
  });

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        setState({ copied: false, error: new Error('Clipboard not supported') });
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setState({ copied: true, error: null });

        // Reset after timeout
        setTimeout(() => {
          setState({ copied: false, error: null });
        }, timeout);

        return true;
      } catch (error) {
        setState({
          copied: false,
          error: error instanceof Error ? error : new Error('Failed to copy'),
        });
        return false;
      }
    },
    [timeout]
  );

  return [state, copy];
}
