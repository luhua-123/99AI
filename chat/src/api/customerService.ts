import { get, post } from '@/utils/request'

/**
 * 创建客服对话组
 */
export function fetchCreateSupportGroup<T>(): Promise<T> {
  return post<T>({
    url: '/group/createSupportGroup',
  })
}

/**
 * 发送客服消息
 */
export function fetchSendSupportMessage<T>(data: { content: string }): Promise<T> {
  return post<T>({
    url: '/chatgpt/sendSupportMessage',
    data,
  })
}

/**
 * 查询客服消息历史
 */
export function fetchQuerySupportMessages<T>(data: {
  page?: number
  size?: number
  groupId?: number
}): Promise<T> {
  return get<T>({
    url: '/chatLog/querySupportMessages',
    data,
  })
}

/**
 * 更新客服对话状态
 */
export function fetchUpdateSupportStatus<T>(data: { status: 'open' | 'closed'; groupId?: number }): Promise<T> {
  return post<T>({
    url: '/group/support/status',
    data,
  })
}
