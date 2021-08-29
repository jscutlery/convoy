import { InjectionToken } from '@angular/core';
import { ConvoyrConfig } from '@convoyr/core';

/**
 * @internal Global Convoyr configuration
 */
export const _CONVOYR_CONFIG = new InjectionToken<ConvoyrConfig>(
  'Convoyr Config'
);
