import api from '../index';

export default {
  sendMessage: (data: {
    title: string;
    content: string;
    sendType: number;
    userIds?: number[];
  }) => api.post('message/send', data),
};
