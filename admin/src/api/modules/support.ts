import api from '../index';

export default {
  querySupportGroups: (params: any) => api.get('group/support/list', { params }),
  querySupportMessages: (params: { groupId: number }) =>
    api.get('chatLog/support/messages', { params }),
  replySupport: (data: { groupId: number; content: string; status?: string }) =>
    api.post('chatLog/support/reply', data),
};
