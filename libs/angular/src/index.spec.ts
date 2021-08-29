import * as publicApi from './index';

describe('Public API', () => {
  it('should expose ConvoyrModule', () => {
    expect(publicApi.Convoyr).toBeDefined();
    expect(publicApi.ConvoyrService).toBeDefined();
    expect(publicApi.ConvoyrModule).toBeDefined();
  });
});
