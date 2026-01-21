<script lang="ts" setup>
import { fetchQueryOneCatAPI } from '@/api/appStore'
import { fetchUpdateGroupAPI } from '@/api/group'
import {
  fetchMarkRead,
  fetchMessageList,
  fetchMessagePull,
  fetchMessageUnreadCount,
} from '@/api/message'
import { fetchQueryModelsListAPI } from '@/api/models'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore, useGlobalStoreWithOut } from '@/store'
import { utcToShanghaiTime } from '@/utils/format'
import {
  Brightness,
  CheckOne,
  Close,
  Customer,
  DarkMode,
  Down,
  EditTwo,
  ExpandLeft,
  Inbox,
} from '@icon-park/vue-next'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { computed, inject, onBeforeUnmount, onMounted, ref, Ref, watch } from 'vue'

interface ModelOption {
  label: string
  value: string
  modelDescription: string
  modelAvatar: string
}

interface Model {
  isFileUpload: any
  isImageUpload: any
  modelName: string
  model: string
  deductType: number
  keyType: number
  deduct: number
  modelAvatar: string
  modelDescription: string
  isNetworkSearch: any
  isMcpTool: any
  deepThinkingType: any
}

interface ExternalLink {
  icon?: string
  name?: string
  [key: string]: any
}

interface InboxMessage {
  recipientId: number
  messageId: number
  title: string
  content: string
  createdAt: string
  senderName?: string
  isRead: boolean
  readAt?: string
}

const useGlobalStore = useGlobalStoreWithOut()
const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const modelOptions: Ref<ModelOption[]> = ref([])
const appDetail: any = ref(null)
const dataSources = computed(() => chatStore.groupList)
const collapsed = computed(() => appStore.siderCollapsed)
const chatGroupId = computed(() => chatStore.active)
const darkMode = computed(() => appStore.theme === 'dark')
const isLogin = computed(() => authStore.isLogin)

const { isMobile } = useBasicLayout()
const isHovering = ref(false)
const isMenuOpen = ref(false)
const activeGroupInfo = computed(() => chatStore.getChatByGroupInfo())
const listSources = computed(() => chatStore.chatList)

// 璁＄畻棰勮鍣ㄧ姸鎬?
const isPreviewerVisible = computed(
  () =>
    useGlobalStore.showHtmlPreviewer ||
    useGlobalStore.showTextEditor ||
    useGlobalStore.showImagePreviewer
)

// 璁＄畻搴旂敤骞垮満鐘舵€?
const isAppListVisible = computed(() => useGlobalStore.showAppListComponent)
const configObj = computed(() => {
  const configString = activeGroupInfo.value?.config
  if (!configString) {
    return {} // 鎻愭棭杩斿洖涓€涓┖瀵硅薄
  }

  try {
    return JSON.parse(configString)
  } catch (e) {
    return {} // 瑙ｆ瀽澶辫触鏃惰繑鍥炰竴涓┖瀵硅薄
  }
})

function checkMode() {
  const mode = darkMode.value ? 'light' : 'dark'
  appStore.setTheme(mode)
}

const activeModel = computed(() => String(configObj?.value?.modelInfo?.model ?? ''))
/* 褰撳墠瀵硅瘽缁勬槸鍚︽槸搴旂敤 */
const activeAppId = computed(() => activeGroupInfo?.value?.appId || 0)

let modelMapsCache: any = ref({})
let modelTypeListCache: any = ref([])

watch(
  activeAppId,
  val => {
    if (val && val > 0) queryAppDetail(val)
    else appDetail.value = null
  },
  { immediate: true }
)

/* 鏌ヨ褰撳墠app璇︽儏鎻愮ず鐢ㄦ埛浣跨敤 */
async function queryAppDetail(id: number) {
  const res: any = await fetchQueryOneCatAPI({ id })
  appDetail.value = res.data
}

const notSwitchModel = computed(() => {
  return (
    activeGroupInfo?.value?.appId &&
    (configObj.value.modelInfo?.isFixedModel === 1 ||
      configObj.value.modelInfo?.isGPTs === 1 ||
      configObj.value.modelInfo?.isFlowith === 1)
  )
})

const createNewChatGroup = inject('createNewChatGroup', () =>
  Promise.resolve()
) as () => Promise<void>

async function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

// 鍏抽棴搴旂敤骞垮満
function closeAppList() {
  useGlobalStore.updateShowAppListComponent(false)
  // 在移动端不自动展开侧边栏
  if (!isMobile.value) {
    appStore.setSiderCollapsed(false)
  }
}

/* 淇敼瀵硅瘽缁勬ā鍨嬮厤缃?*/
async function switchModel(option: any) {
  chatStore.setUsingDeepThinking(false)
  chatStore.setUsingNetwork(false)
  chatStore.setUsingPlugin(null)
  const { modelInfo, fileInfo } = chatStore.activeConfig

  const { isGPTs, isFixedModel, modelName, isFlowith } = modelInfo

  const config = {
    modelInfo: {
      keyType: option.keyType,
      modelName: (activeGroupInfo?.value?.appId ? modelName : option.label) || '', // 鏇存槑纭殑鏉′欢
      model: option.value,
      deductType: option.deductType,
      deduct: option.deduct,
      isFileUpload: option.isFileUpload,
      isImageUpload: option.isImageUpload,
      isNetworkSearch: option.isNetworkSearch,
      deepThinkingType: option.deepThinkingType,
      isMcpTool: option.isMcpTool,
      modelAvatar: option.modelAvatar || '',
      isGPTs,
      isFlowith,
      isFixedModel,
    },
    fileInfo: fileInfo || {}, // 纭繚 fileInfo 涓虹┖鏃朵笉鍑洪敊
  }

  const params = {
    groupId: chatGroupId.value,
    config: JSON.stringify(config),
  }
  await fetchUpdateGroupAPI(params)
  await chatStore.queryMyGroup()
  // useGlobalStore.updateModelDialog(false);
}

async function queryModelsList() {
  try {
    const res: any = await fetchQueryModelsListAPI()
    if (!res.success) return
    const { modelMaps, modelTypeList } = res.data
    modelMapsCache.value = modelMaps
    modelTypeListCache.value = modelTypeList
    // 浣跨敤绫诲瀷鏂█鏉ュ憡璇?TypeScript flatModelArray 鏄?Model[] 绫诲瀷
    const flatModelArray = Object.values(modelMaps).flat() as Model[]
    const filteredModelArray = flatModelArray.filter(model => model.keyType === 1)
    modelOptions.value = filteredModelArray.map(model => ({
      label: model.modelName,
      value: model.model,
      deductType: model.deductType,
      keyType: model.keyType,
      deduct: model.deduct,
      isFileUpload: model.isFileUpload,
      isImageUpload: model.isImageUpload,
      isNetworkSearch: model.isNetworkSearch,
      deepThinkingType: model.deepThinkingType,
      isMcpTool: model.isMcpTool,
      modelAvatar: model.modelAvatar,
      modelDescription: model.modelDescription,
    }))
  } catch (error) {}
}

// 在mounted时查询模型列表
onMounted(() => {
  queryModelsList()
})

const externalLinkActive = computed(
  () => useGlobalStore.externalLinkDialog && useGlobalStore.currentExternalLink
)
const currentExternalLink = computed(() => {
  const link = useGlobalStore.currentExternalLink
  return (typeof link === 'object' ? link : {}) as ExternalLink
})

const inboxOpen = ref(false)
const inboxLoading = ref(false)
const messageList = ref<InboxMessage[]>([])
const unreadCount = ref(0)
const inboxTotal = ref(0)
const lastRecipientId = ref(0)
const toastQueue = ref<InboxMessage[]>([])
const toastTimers = new Map<number, number>()
const detailVisible = ref(false)
const detailItem = ref<InboxMessage | null>(null)
let inboxTimer: number | null = null

onMounted(() => {
  if (isLogin.value) {
    initInbox()
  }
})

onBeforeUnmount(() => {
  stopInboxPolling()
  toastTimers.forEach(timer => clearTimeout(timer))
  toastTimers.clear()
})

watch(isLogin, value => {
  if (value) {
    initInbox()
  } else {
    stopInboxPolling()
    messageList.value = []
    unreadCount.value = 0
    inboxTotal.value = 0
    lastRecipientId.value = 0
    toastQueue.value = []
  }
})

watch(inboxOpen, value => {
  if (value) {
    refreshInboxList()
  }
})

// 鎵撳紑鏂囨湰缂栬緫鍣?
const openTextEditor = () => {
  useGlobalStore.updateTextEditor(true)
}

// 娣诲姞涓€涓柊鐨勬柟娉曟潵澶勭悊妯″瀷閫夋嫨
function handleModelSelect(option: any) {
  switchModel(option)
}

function openSettings(tab?: number) {
  if (isMobile.value) {
    useGlobalStore.updateMobileSettingsDialog(true, tab)
    appStore.setSiderCollapsed(true)
  } else {
    useGlobalStore.updateSettingsDialog(true, tab)
  }
}

function formatMessageTime(value?: string, format = 'YYYY-MM-DD hh:mm') {
  if (!value) return ''
  return utcToShanghaiTime(value, format)
}

function formatMessagePreview(content?: string) {
  if (!content) return ''
  return content.replace(/[\r\n]+/g, ' ').slice(0, 80)
}

function updateLatestRecipientId(rows: InboxMessage[]) {
  if (!rows.length) return
  const maxId = rows.reduce((max, item) => Math.max(max, item.recipientId), lastRecipientId.value)
  lastRecipientId.value = maxId
}

async function initInbox() {
  await refreshUnreadCount()
  await refreshInboxList()
  startInboxPolling()
}

async function refreshInboxList() {
  if (!isLogin.value) return
  inboxLoading.value = true
  try {
    const res: any = await fetchMessageList({ page: 1, size: 20 })
    const rows = (res?.data?.rows || []) as InboxMessage[]
    messageList.value = rows
    inboxTotal.value = res?.data?.count || 0
    updateLatestRecipientId(rows)
  } catch (error) {
  } finally {
    inboxLoading.value = false
  }
}

async function refreshUnreadCount() {
  if (!isLogin.value) return
  try {
    const res: any = await fetchMessageUnreadCount()
    unreadCount.value = Number(res?.data?.unreadCount || 0)
  } catch (error) {}
}

function startInboxPolling() {
  stopInboxPolling()
  inboxTimer = window.setInterval(() => {
    pullInboxMessages()
  }, 8000)
}

function stopInboxPolling() {
  if (inboxTimer) {
    clearInterval(inboxTimer)
    inboxTimer = null
  }
}

async function pullInboxMessages() {
  if (!isLogin.value) return
  try {
    const res: any = await fetchMessagePull({
      afterId: lastRecipientId.value,
      size: 20,
    })
    const rows = (res?.data?.rows || []) as InboxMessage[]
    if (rows.length) {
      const existingIds = new Set(messageList.value.map(item => item.recipientId))
      const freshRows = rows.filter(item => !existingIds.has(item.recipientId))
      if (freshRows.length) {
        const ordered = [...freshRows].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        messageList.value = [...ordered, ...messageList.value]
        ordered.forEach(item => pushToast(item))
      }
      updateLatestRecipientId(rows)
    }
    if (typeof res?.data?.unreadCount === 'number') {
      unreadCount.value = Number(res.data.unreadCount)
    }
  } catch (error) {}
}

function pushToast(item: InboxMessage) {
  if (toastQueue.value.some(msg => msg.recipientId === item.recipientId)) return
  if (toastQueue.value.length >= 3) {
    const removed = toastQueue.value.shift()
    if (removed) {
      dismissToast(removed.recipientId)
    }
  }
  toastQueue.value.push(item)
  const timer = window.setTimeout(() => {
    dismissToast(item.recipientId)
  }, 6000)
  toastTimers.set(item.recipientId, timer)
}

function dismissToast(recipientId: number) {
  const timer = toastTimers.get(recipientId)
  if (timer) {
    clearTimeout(timer)
    toastTimers.delete(recipientId)
  }
  toastQueue.value = toastQueue.value.filter(item => item.recipientId !== recipientId)
}

function openDetail(item: InboxMessage) {
  detailItem.value = item
  detailVisible.value = true
  if (!item.isRead) {
    markAsRead([item.recipientId])
  }
}

function closeDetail() {
  detailVisible.value = false
  detailItem.value = null
}

async function markAsRead(ids: number[]) {
  if (!ids.length) return
  try {
    await fetchMarkRead({ ids })
    messageList.value = messageList.value.map(item =>
      ids.includes(item.recipientId)
        ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
        : item
    )
    await refreshUnreadCount()
  } catch (error) {}
}
</script>

<template>
  <header class="sticky top-0 left-0 right-0 z-30 dark:border-neutral-800 h-16 select-none">
    <div class="relative flex items-center justify-center min-w-0 h-full">
      <div class="flex w-full h-full items-center" :class="{ 'px-4': !isMobile, 'px-2': isMobile }">
        <div
          v-if="collapsed && !externalLinkActive && !isPreviewerVisible"
          class="relative group mx-1"
        >
          <button
            type="button"
            class="btn-icon btn-md"
            @click="handleUpdateCollapsed"
            aria-label="Expand sidebar"
          >
            <ExpandLeft size="22" />
          </button>
          <!-- 鎮仠鎻愮ず - 灞曞紑渚ц竟鏍?-->
          <div v-if="!isMobile" class="tooltip tooltip-right">灞曞紑渚ф爮</div>
        </div>

        <!-- pc -->
        <div class="flex justify-between items-center h-full w-full">
          <!-- 褰撳閮ㄩ摼鎺ユ縺娲绘椂鏄剧ず閾炬帴淇℃伅锛屽惁鍒欐樉绀烘ā鍨嬮€夋嫨 -->
          <div
            v-if="externalLinkActive"
            class="relative flex-1 flex ele-drag items-center justify-between h-full"
          >
            <div class="py-1 flex items-center space-x-2">
              <img
                v-if="currentExternalLink && currentExternalLink.icon"
                :src="currentExternalLink.icon"
                alt="缃戠珯鍥炬爣"
                class="w-6 h-6 rounded-lg object-cover"
              />
              <div v-else class="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center">
                <span class="text-xs">{{ currentExternalLink?.name?.charAt(0) || '?' }}</span>
              </div>
              <span
                class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate whitespace-nowrap overflow-hidden max-w-[30vw]"
              >
                {{ currentExternalLink?.name || '澶栭儴閾炬帴' }}
              </span>
            </div>
          </div>

          <!-- 涓嶅彲鍒囨崲妯″瀷鐘舵€侊紝浣跨敤涓庡彲鍒囨崲妯″瀷鐩稿悓鐨勬牱寮?-->
          <div v-else-if="notSwitchModel" class="flex-1 flex items-center">
            <div class="menu menu-md relative">
              <button class="menu-trigger" aria-label="褰撳墠瀵硅瘽" disabled>
                <span class="truncate whitespace-nowrap overflow-hidden max-w-[30vw]">
                  {{ activeGroupInfo?.title || 'New chat' }}
                </span>
              </button>
            </div>
          </div>

          <!-- 浣跨敤閫氱敤涓嬫媺鑿滃崟缁勪欢 - ChatGPT椋庢牸 -->
          <div v-else class="flex-1 flex items-center">
            <DropdownMenu
              v-model="isMenuOpen"
              position="bottom-left"
              max-height="60vh"
              min-width="220px"
              match-trigger-width
            >
              <template #trigger>
                <button
                  class="model-selector-trigger" :class="{ 'model-selector-trigger-open': isMenuOpen }"
                  @mouseover="isHovering = true"
                  @mouseleave="isHovering = false"
                  aria-label="閫夋嫨妯″瀷"
                >
                  <span class="model-selector-avatar">
                    <img
                      v-if="configObj?.modelInfo?.modelAvatar"
                      :src="configObj?.modelInfo?.modelAvatar"
                      :alt="`${configObj?.modelInfo?.modelName || 'AI'}图标`"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="model-selector-avatar-text">
                      {{ (configObj?.modelInfo?.modelName || 'AI').charAt(0) }}
                    </span>
                  </span>
                  <span class="model-selector-text">
                    {{ configObj?.modelInfo?.modelName || '新对话' }}
                  </span>
                  <Down
                    size="16"
                    class="model-selector-chevron"
                    :class="{ 'rotate-180': isMenuOpen }"
                    aria-hidden="true"
                  />
                </button>
              </template>
              <template #menu="{ close }">
                <div class="model-selector-menu">
                  <div
                    v-for="(option, index) in modelOptions"
                    :key="index"
                    class="model-selector-option"
                    :class="{ 'model-selector-option-active': activeModel === option.value }"
                    @click="
                      () => {
                        handleModelSelect(option)
                        close()
                      }
                    "
                    role="menuitem"
                    tabindex="0"
                    :aria-label="`閫夋嫨${option.label}妯″瀷`"
                  >
                    <div class="model-selector-option-avatar">
                      <img
                        v-if="option.modelAvatar"
                        :src="option.modelAvatar"
                        :alt="`${option.label}妯″瀷鍥炬爣`"
                        class="w-full h-full object-cover rounded-full"
                      />
                      <span v-else class="model-selector-option-avatar-text">
                        {{ option.label.charAt(0) }}
                      </span>
                    </div>
                    <div class="model-selector-option-content">
                      <div class="model-selector-option-name">
                        {{ option.label }}
                      </div>
                    </div>
                    <div class="model-selector-option-check" v-if="activeModel === option.value">
                      <CheckOne
                        theme="filled"
                        size="18"
                        class="text-primary-500"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </DropdownMenu>
          </div>

          <div class="flex items-center">
            <!-- 鐢ㄦ埛鏀朵欢绠?-->
            <div v-if="isLogin && !externalLinkActive && !isPreviewerVisible" class="relative group mx-1">
              <DropdownMenu
                v-model="inboxOpen"
                position="bottom-right"
                min-width="320px"
                max-height="70vh"
              >
                <template #trigger>
                  <button type="button" class="btn-icon btn-md inbox-trigger" aria-label="Inbox">
                    <Inbox size="20" />
                    <span v-if="unreadCount > 0" class="inbox-badge">
                      {{ unreadCount > 99 ? '99+' : unreadCount }}
                    </span>
                  </button>
                </template>
                <template #menu="{ close }">
                  <div class="inbox-panel">
                    <div class="inbox-panel-header">
                      <div class="flex items-center gap-2">
                        <span class="inbox-panel-title">Inbox</span>
                        <span v-if="unreadCount > 0" class="inbox-panel-unread">
                          鏈 {{ unreadCount }}
                        </span>
                      </div>
                      <span v-if="inboxTotal > 0" class="inbox-panel-total">Total {{ inboxTotal }}</span>
                    </div>
                    <div v-if="inboxLoading" class="inbox-panel-loading">
                      姝ｅ湪鍔犺浇...
                    </div>
                    <div v-else-if="!messageList.length" class="inbox-panel-empty">
                      <Inbox size="36" class="text-gray-300 dark:text-gray-600" />
                      <div class="text-sm text-gray-500 dark:text-gray-400">鏆傛棤娑堟伅</div>
                    </div>
                    <div v-else class="inbox-panel-list">
                      <button
                        v-for="item in messageList"
                        :key="item.recipientId"
                        type="button"
                        class="inbox-item"
                        :class="{ 'inbox-item-unread': !item.isRead }"
                        @click="
                          () => {
                            openDetail(item)
                            close()
                          }
                        "
                      >
                        <div class="inbox-item-header">
                          <span class="inbox-item-title">{{ item.title }}</span>
                          <span class="inbox-item-time">
                            {{ formatMessageTime(item.createdAt, 'MM-DD hh:mm') }}
                          </span>
                        </div>
                        <div class="inbox-item-preview">
                          {{ formatMessagePreview(item.content) }}
                        </div>
                        <div v-if="item.senderName" class="inbox-item-meta">
                          {{ item.senderName }}
                        </div>
                      </button>
                    </div>
                  </div>
                </template>
              </DropdownMenu>
              <div v-if="!isMobile" class="tooltip tooltip-bottom">Text editor</div>
            </div>
            <!-- 涓婚鍒囨崲鎸夐挳锛屼粎鍦ㄩ潪澶栭儴閾炬帴鍜岄潪棰勮鍣ㄧ姸鎬佷笅鏄剧ず -->
            <div v-if="!externalLinkActive && !isPreviewerVisible" class="relative group mx-1">
              <button
                type="button"
                class="btn-icon btn-md"
                @click="checkMode()"
                aria-label="鍒囨崲涓婚"
              >
                <Brightness v-if="!darkMode" size="20" aria-hidden="true" />
                <DarkMode v-else size="20" aria-hidden="true" />
              </button>
              <!-- 鎮仠鎻愮ず - 鍒囨崲涓婚 -->
              <div v-if="!isMobile" class="tooltip tooltip-bottom">鍒囨崲涓婚</div>
            </div>

            <!-- 瀹㈡湇鎸夐挳锛屼粎鍦ㄩ潪澶栭儴閾炬帴鍜岄潪棰勮鍣ㄧ姸鎬佷笅鏄剧ず -->
            <div v-if="!externalLinkActive && !isPreviewerVisible" class="relative group mx-1">
              <button
                type="button"
                class="btn-icon btn-md"
                @click="() => { useGlobalStore.updateCustomerServiceDialog(true) }"
                aria-label="鑱旂郴瀹㈡湇"
              >
                <Customer size="20" aria-hidden="true" />
              </button>
              <!-- 鎮仠鎻愮ず - 鑱旂郴瀹㈡湇 -->
              <div v-if="!isMobile" class="tooltip tooltip-bottom">鑱旂郴瀹㈡湇</div>
            </div>

            <!-- 宸ュ叿閾炬帴缁勪欢锛屽湪闈為瑙堝櫒鐘舵€併€侀潪澶栭儴閾炬帴鐘舵€併€侀潪搴旂敤骞垮満鐘舵€佷笅鏄剧ず -->
            <ToolLinks v-if="!externalLinkActive && !isPreviewerVisible && !isAppListVisible" />

            <!-- 鏂囨湰缂栬緫鍣ㄦ寜閽?-->
            <div v-if="false" class="relative group mx-1">
              <button
                type="button"
                class="btn-icon btn-md"
                @click="openTextEditor"
                aria-label="Text editor"
              >
                <EditTwo size="20" aria-hidden="true" />
              </button>
              <!-- 鎮仠鎻愮ず - 鏂囨湰缂栬緫鍣?-->
              <div v-if="!isMobile" class="tooltip tooltip-bottom">Text editor</div>
            </div>

            <!-- 澶栭儴閾炬帴鐘舵€佷笅鏄剧ず鍏抽棴鎸夐挳锛屽簲鐢ㄥ箍鍦虹姸鎬佷笅鏄剧ず鍏抽棴鎸夐挳锛屽惁鍒欐樉绀烘柊瀵硅瘽鎸夐挳 -->
            <div v-if="externalLinkActive" class="relative group mx-1">
              <button
                type="button"
                class="btn-icon btn-md"
                @click="
                  () => {
                    useGlobalStore.updateExternalLinkDialog(false)
                    if (!isMobile) {
                      appStore.setSiderCollapsed(false)
                    }
                  }
                "
                aria-label="鍏抽棴澶栭儴閾炬帴"
              >
                <Close size="20" aria-hidden="true" />
              </button>
              <!-- 鎮仠鎻愮ず - 鍏抽棴 -->
              <div v-if="!isMobile" class="tooltip tooltip-bottom">鍏抽棴</div>
            </div>
            <div v-else-if="isAppListVisible" class="relative group mx-1">
              <button
                type="button"
                class="btn-icon btn-md"
                @click="closeAppList"
                aria-label="鍏抽棴搴旂敤骞垮満"
              >
                <Close size="20" aria-hidden="true" />
              </button>
              <!-- 鎮仠鎻愮ず - 鍏抽棴 -->
              <div v-if="!isMobile" class="tooltip tooltip-bottom">鍏抽棴</div>
            </div>
            <div v-else-if="!isPreviewerVisible" class="relative group mx-1">
              <button
                type="button"
                class="btn-icon btn-md"
                @click="createNewChatGroup()"
                :disabled="listSources.length === 0 && !activeAppId && dataSources.length !== 0"
                aria-label="鏂板缓瀵硅瘽"
              >
                <EditTwo size="20" aria-hidden="true" />
              </button>
              <!-- 鎮仠鎻愮ず - 鏂板璇?-->
              <div v-if="!isMobile" class="tooltip tooltip-bottom">鏂板缓瀵硅瘽</div>
            </div>

            <!-- 鐧诲綍鐢ㄦ埛 - 鐩存帴鐐瑰嚮鎵撳紑璁剧疆瀵硅瘽妗?-->
            <!-- <div
              v-if="isLogin"
              @click="openSettings(undefined)"
              class="flex items-center cursor-pointer group relative mr-3"
              role="button"
              aria-label="鎵撳紑璁剧疆涓績"
              tabindex="0"
            >
              <div
                class="w-8 h-8 ml-1 rounded-full bg-primary-500 overflow-hidden flex items-center justify-center shadow-sm"
              >
                <img
                  v-if="avatar"
                  :src="avatar"
                  class="w-full h-full object-cover"
                  alt="鐢ㄦ埛澶村儚"
                />
                <User
                  v-if="!avatar"
                  theme="outline"
                  size="18"
                  class="text-white"
                  aria-hidden="true"
                />
              </div>
              <div v-if="!isMobile" class="tooltip tooltip-bottom">璁剧疆</div>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <div v-if="toastQueue.length" class="inbox-toast-area">
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div v-for="item in toastQueue" :key="item.recipientId" class="inbox-toast-card">
          <div class="inbox-toast-main">
            <div class="inbox-toast-title">{{ item.title }}</div>
            <div class="inbox-toast-preview">
              {{ formatMessagePreview(item.content) }}
            </div>
            <div class="inbox-toast-time">{{ formatMessageTime(item.createdAt, 'hh:mm') }}</div>
          </div>
          <div class="inbox-toast-actions">
            <button
              type="button"
              class="inbox-toast-link"
              @click="
                () => {
                  openDetail(item)
                  dismissToast(item.recipientId)
                }
              "
            >
              鏌ョ湅
            </button>
            <button
              type="button"
              class="inbox-toast-close"
              aria-label="鍏抽棴鎻愮ず"
              @click="dismissToast(item.recipientId)"
            >
              <Close size="16" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>

  <Teleport to="body">
    <transition name="inbox-detail-fade">
      <div v-if="detailVisible" class="inbox-detail-backdrop" @click.self="closeDetail">
        <div class="inbox-detail-panel">
          <div class="inbox-detail-header">
            <div>
              <div class="inbox-detail-title">{{ detailItem?.title || '' }}</div>
              <div class="inbox-detail-meta">
                <span>{{ detailItem?.senderName || '绯荤粺閫氱煡' }}</span>
                <span>{{ formatMessageTime(detailItem?.createdAt) }}</span>
              </div>
            </div>
            <button type="button" class="btn-icon btn-md" @click="closeDetail" aria-label="鍏抽棴璇︽儏">
              <Close size="18" />
            </button>
          </div>
          <div class="inbox-detail-content">
            <MdPreview
              editorId="inbox-detail"
              :modelValue="detailItem?.content || ''"
              :theme="darkMode ? 'dark' : 'light'"
              class="inbox-detail-preview"
            />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style>
/* Model selector */
.model-selector-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.65rem 0.35rem 0.45rem;
  height: 32px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #0f172a;
  background-color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  outline: none;
}

.model-selector-trigger:hover {
  border-color: rgba(59, 130, 246, 0.45);
  background-color: #ffffff;
  transform: translateY(-1px);
}

.model-selector-trigger:active {
  transform: translateY(0);
}

.model-selector-trigger-open {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.18);
}

.dark .model-selector-trigger {
  color: #f8fafc;
  background-color: rgba(15, 23, 42, 0.92);
  border-color: rgba(148, 163, 184, 0.35);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.dark .model-selector-trigger:hover {
  border-color: rgba(147, 197, 253, 0.6);
  background-color: rgba(30, 41, 59, 0.95);
}

.dark .model-selector-trigger-open {
  border-color: rgba(147, 197, 253, 0.75);
  box-shadow: 0 16px 36px rgba(59, 130, 246, 0.28);
}

.model-selector-avatar {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: linear-gradient(145deg, #ffffff, #eef2ff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.45);
}

.dark .model-selector-avatar {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.4);
}

.model-selector-avatar-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
}

.dark .model-selector-avatar-text {
  color: #cbd5f5;
}

.model-selector-text {
  max-width: 38vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-selector-chevron {
  flex-shrink: 0;
  color: #64748b;
  transition: transform 0.25s ease;
}

.dark .model-selector-chevron {
  color: #94a3b8;
}

.model-selector-chevron.rotate-180 {
  transform: rotate(180deg);
}

.model-selector-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.4rem;
}

.model-selector-option {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.6rem;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  background: rgba(248, 250, 252, 0.6);
}

.model-selector-option:hover {
  background-color: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.dark .model-selector-option {
  background: rgba(15, 23, 42, 0.55);
}

.dark .model-selector-option:hover {
  background-color: rgba(59, 130, 246, 0.18);
  border-color: rgba(59, 130, 246, 0.35);
}

.model-selector-option-active {
  background-color: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.3);
}

.dark .model-selector-option-active {
  background-color: rgba(59, 130, 246, 0.22);
  border-color: rgba(59, 130, 246, 0.45);
}

.model-selector-option-avatar {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background-color: rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.dark .model-selector-option-avatar {
  background-color: rgba(148, 163, 184, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

.model-selector-option-avatar-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.dark .model-selector-option-avatar-text {
  color: #cbd5f5;
}

.model-selector-option-content {
  flex: 1;
  min-width: 0;
}

.model-selector-option-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .model-selector-option-name {
  color: #f9fafb;
}

.model-selector-option-check {
  flex-shrink: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
}

.dark .model-selector-option-check {
  color: #93c5fd;
}.inbox-trigger {
  position: relative;
}

.inbox-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff6b6b, #ff8c5b);
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(255, 107, 107, 0.35);
}

.inbox-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inbox-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.inbox-panel-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.inbox-panel-unread {
  font-size: 0.75rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.inbox-panel-total {
  font-size: 0.75rem;
  color: #6b7280;
}

.inbox-panel-loading,
.inbox-panel-empty {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
}

.inbox-panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 2px;
}

.inbox-item {
  text-align: left;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.15s ease;
}

.inbox-item:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.inbox-item-unread {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.08);
}

.inbox-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.inbox-item-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inbox-item-time {
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.inbox-item-preview {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

.inbox-item-meta {
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

.dark .inbox-panel-title,
.dark .inbox-item-title {
  color: #f3f4f6;
}

.dark .inbox-panel-total,
.dark .inbox-item-preview,
.dark .inbox-item-meta,
.dark .inbox-item-time {
  color: #9ca3af;
}

.dark .inbox-item {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(31, 41, 55, 0.7);
}

.dark .inbox-item-unread {
  border-color: rgba(96, 165, 250, 0.5);
  background: rgba(59, 130, 246, 0.18);
}

.inbox-toast-area {
  position: fixed;
  right: 16px;
  top: 76px;
  z-index: 10020;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(360px, calc(100vw - 32px));
}

.inbox-toast-card {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}

.inbox-toast-main {
  flex: 1;
  min-width: 0;
}

.inbox-toast-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #111827;
}

.inbox-toast-preview {
  margin-top: 0.25rem;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.4;
}

.inbox-toast-time {
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

.inbox-toast-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.inbox-toast-link {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
}

.inbox-toast-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 999px;
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
}

.inbox-toast-close:hover {
  background: rgba(107, 114, 128, 0.2);
}

.dark .inbox-toast-card {
  background: rgba(31, 41, 55, 0.96);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.dark .inbox-toast-title {
  color: #f9fafb;
}

.dark .inbox-toast-preview,
.dark .inbox-toast-time {
  color: #9ca3af;
}

.dark .inbox-toast-link {
  color: #93c5fd;
}

.inbox-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10030;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.inbox-detail-panel {
  width: min(720px, 92vw);
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.2);
}

.inbox-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(249, 250, 251, 0.9);
}

.inbox-detail-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #111827;
}

.inbox-detail-meta {
  margin-top: 0.35rem;
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.inbox-detail-content {
  padding: 1rem 1.25rem 1.5rem;
  overflow-y: auto;
}

.inbox-detail-preview {
  background: transparent !important;
}

.dark .inbox-detail-panel {
  background: #111827;
  border-color: rgba(255, 255, 255, 0.08);
}

.dark .inbox-detail-header {
  background: rgba(17, 24, 39, 0.9);
  border-color: rgba(255, 255, 255, 0.08);
}

.dark .inbox-detail-title {
  color: #f9fafb;
}

.dark .inbox-detail-meta {
  color: #9ca3af;
}

.inbox-detail-fade-enter-active,
.inbox-detail-fade-leave-active {
  transition: opacity 0.2s ease;
}

.inbox-detail-fade-enter-from,
.inbox-detail-fade-leave-to {
  opacity: 0;
}
</style>









