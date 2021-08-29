import { Inject, Injectable } from '@angular/core';
import { Convoyr, ConvoyrConfig } from '@convoyr/core';

import { _CONVOYR_CONFIG } from './convoyr.config';

@Injectable()
export class ConvoyrService extends Convoyr {
  constructor(
    @Inject(_CONVOYR_CONFIG)
    config: ConvoyrConfig
  ) {
    super(config);
  }
}
