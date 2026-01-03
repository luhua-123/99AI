<script setup lang="ts">
import {
  fetchCreateSupportGroup,
  fetchQuerySupportMessages,
  fetchSendSupportMessage,
  fetchUpdateSupportStatus,
} from '@/api/customerService'
import { useAppStore, useAuthStore } from '@/store'
import { Close, Customer } from '@icon-park/vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from '@/utils/message'
import Message from '@/views/chat/components/Message/index.vue'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

// message 实例
const ms = message()

// Props定义
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

// Emits定义
const emit = defineEmits(['close'])

// Store实例
const appStore = useAppStore()
const authStore = useAuthStore()

// 响应式状态
const activeTab = ref<'chat' | 'contact'>('chat') // 当前标签页
const inputMessage = ref('') // 输入消息
const messages = ref<any[]>([]) // 消息列表
const scrollRef = ref<HTMLElement | null>(null) // 滚动容器
const config = ref<any>({}) // 客服配置
const supportGroupId = ref<number | null>(null) // 客服对话组ID
const supportStatus = ref<'open' | 'processing' | 'closed'>('open') // 客服对话状态
let refreshTimer: number | null = null

// 计算属性
const globalConfig = computed(() => authStore.globalConfig)
const darkMode = computed(() => appStore.theme === 'dark')
const contactMarkdown = computed(() =>
  String(config.value?.customerServiceContactMarkdown || '').trim()
)
const statusTextMap: Record<string, string> = {
  open: '待处理',
  processing: '处理中',
  closed: '已关闭',
}
const statusText = computed(() => statusTextMap[supportStatus.value] || supportStatus.value)
const isClosed = computed(() => supportStatus.value === 'closed')

// 初始化时加载数据
onMounted(async () => {
  if (props.visible) {
    await initCustomerService()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})

// 监听visible变化
watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      await initCustomerService()
    } else {
      stopPolling()
    }
  },
)

// 初始化客服功能
async function initCustomerService() {
  // 加载客服配置
  config.value = globalConfig.value || {}

  try {
    const groupRes: any = await fetchCreateSupportGroup()
    supportGroupId.value = groupRes?.data?.id || null
    supportStatus.value = groupRes?.data?.supportStatus || 'open'
    await loadSupportMessages()
    startPolling()
  } catch (error) {
    console.error('初始化客服对话失败:', error)
  }
}

async function loadSupportMessages() {
  const res: any = await fetchQuerySupportMessages({
    groupId: supportGroupId.value || undefined,
  })
  messages.value = res?.data || []
  await nextTick()
  scrollToBottom()
}

function startPolling() {
  stopPolling()
  refreshTimer = window.setInterval(() => {
    if (!props.visible) return
    loadSupportMessages()
  }, 5000)
}

function stopPolling() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 发送消息
async function sendMessage() {
  if (isClosed.value) {
    ms.warning('会话已关闭，可点击“继续沟通”重新开启')
    return
  }
  if (!inputMessage.value.trim()) {
    ms.warning('请输入消息内容')
    return
  }

  try {
    // 发送到后端
    const res = await fetchSendSupportMessage({ content: inputMessage.value })

    if (res.data.autoReply) {
      ms.success('已触发自动回复')
    } else {
      // 提示消息已发送，等待人工回复
      ms.success(res.data.message || '消息已发送，客服将尽快回复')
    }
  } catch (error: any) {
    console.error('发送消息失败:', error)
    ms.error(error.response?.data?.message || '发送失败，请稍后重试')
  }

  inputMessage.value = ''
  await loadSupportMessages()
}

async function updateSupportStatus(status: 'open' | 'closed') {
  try {
    await fetchUpdateSupportStatus({
      status,
      groupId: supportGroupId.value || undefined,
    })
    supportStatus.value = status
    const successText = status === 'closed' ? '会话已关闭' : '已重新开启会话'
    ms.success(successText)
  } catch (error: any) {
    console.error('更新客服对话状态失败:', error)
    ms.error(error.response?.data?.message || '状态更新失败')
  }
}
// 滚动到底部
function scrollToBottom() {
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  }
}

// 关闭弹窗
function handleClose() {
  stopPolling()
  emit('close')
}

// 清空历史消息
function clearHistory() {
  ms.info('暂不支持清空历史记录')
}

// 检查是否有联系方式
const hasContactInfo = computed(() => contactMarkdown.value.length > 0)
</script>

<template>
  <!-- 客服对话框 -->
  <transition name="modal-fade">
    <div
      v-if="visible"
      class="fixed bottom-4 right-4 z-[10002] w-96 h-[580px] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <!-- 标题栏 -->
      <div class="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <Customer size="20" class="text-primary-500" />
          <span class="font-bold text-gray-800 dark:text-gray-200">官方客服</span>
        </div>
        <button @click="handleClose" class="btn-icon btn-md" aria-label="关闭">
          <Close size="18" />
        </button>
      </div>

      <!-- 标签页切换 -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          @click="activeTab = 'chat'"
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'chat' ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'"
        >
          在线客服
        </button>
        <button
          @click="activeTab = 'contact'"
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'contact' ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'"
        >
          联系方式
        </button>
      </div>

      <!-- 在线客服标签页内容 -->
      <div v-if="activeTab === 'chat'" class="flex-1 flex flex-col overflow-hidden">
        <!-- 消息列表 -->
        <div
          ref="scrollRef"
          class="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Customer size="48" class="mb-4 opacity-50" />
            <p class="text-sm">您还没有发送过客服消息</p>
            <p class="text-xs mt-2">有任何问题可以随时联系我们</p>
          </div>
          <Message
            v-for="(msg, index) in messages"
            :key="index"
            :index="index"
            :role="msg.role"
            :content="msg.content"
            :date-time="msg.dateTime"
            :model-name="msg.modelName || (msg.role === 'assistant' ? '官方客服' : '用户')"
            :model-avatar="msg.modelAvatar"
          />
        </div>

        <!-- 对话状态与评价 -->
        <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800">
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>对话状态：{{ statusText }}</span>
            <div class="flex items-center gap-2">
              <button
                v-if="!isClosed"
                @click="updateSupportStatus('closed')"
                class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
              >
                已解决并结束
              </button>
              <button
                v-else
                @click="updateSupportStatus('open')"
                class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
              >
                继续沟通
              </button>
            </div>
          </div>
        </div>

        <!-- 输入框区域 -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-750">
          <div class="flex gap-2 items-end">
            <textarea
              v-model="inputMessage"
              :disabled="isClosed"
              @keydown.enter.prevent="sendMessage"
              :placeholder="isClosed ? '会话已关闭，可点击“继续沟通”重新开启' : '输入您的问题...（Enter发送）'"
              class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-200 resize-none disabled:opacity-60"
              rows="2"
            />
            <button
              @click="sendMessage"
              :disabled="isClosed"
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              发送
            </button>
          </div>
          <div class="flex justify-between items-center mt-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ messages.length }} 条消息</span>
            <button
              v-if="messages.length > 0"
              @click="clearHistory"
              class="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              清空历史
            </button>
          </div>
        </div>
      </div>

      <!-- 联系方式标签页内容 -->
      <div v-if="activeTab === 'contact'" class="flex-1 p-6 overflow-y-auto">
        <div
          v-if="!hasContactInfo"
          class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400"
        >
          <Customer size="48" class="mb-4 opacity-50" />
          <p class="text-sm">暂无客服内容</p>
          <p class="text-xs mt-2">请通过在线客服联系我们</p>
        </div>
        <div v-else class="space-y-6">
          <div class="text-center mb-6">
            <Customer size="64" class="mx-auto text-primary-500 mb-4" />
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">官方客服联系方式</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              如果您有任何问题或建议，欢迎通过以下方式联系我们
            </p>
          </div>

          <div
            class="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <MdPreview
              editorId="customer-service-contact"
              :modelValue="contactMarkdown"
              :theme="darkMode ? 'dark' : 'light'"
              class="dark:bg-gray-750 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 模态框动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.8);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(55, 65, 81, 0.8);
}
</style>



