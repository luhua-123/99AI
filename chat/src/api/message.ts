import { get, post } from '@/utils/request'

export function fetchMessageList<T>(data: { page?: number; size?: number }): Promise<T> {
  return get<T>({
    url: '/message/list',
    data,
  })
}

export function fetchMessagePull<T>(data: { afterId?: number; size?: number }): Promise<T> {
  return get<T>({
    url: '/message/pull',
    data,
  })
}

export function fetchMessageUnreadCount<T>(): Promise<T> {
  return get<T>({
    url: '/message/unreadCount',
  })
}

export function fetchMarkRead<T>(data: { ids: number[] }): Promise<T> {
  return post<T>({
    url: '/message/markRead',
    data,
  })
}
