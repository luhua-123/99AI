<route lang="yaml">
meta:
  title: 客服工作台
</route>

<script lang="ts" setup>
  import SupportApi from '@/api/modules/support';
  import type { FormInstance } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { computed, onMounted, reactive, ref } from 'vue';

  const filterForm = reactive({
    status: '',
    page: 1,
    size: 20,
  });

  const replyFormRef = ref<FormInstance>();
  const replyContent = ref('');
  const replyStatus = ref('processing');
  const loadingGroups = ref(false);
  const loadingMessages = ref(false);
  const groups = ref<any[]>([]);
  const total = ref(0);
  const currentGroup = ref<any | null>(null);
  const messages = ref<any[]>([]);

  const statusOptions = [
    { label: '全部', value: '' },
    { label: '待处理', value: 'open' },
    { label: '处理中', value: 'processing' },
    { label: '已关闭', value: 'closed' },
  ];

  const statusMap: Record<string, string> = {
    open: '待处理',
    processing: '处理中',
    closed: '已关闭',
  };

  const currentUserLabel = computed(() => {
    if (!currentGroup.value?.user) return '未选择';
    const user = currentGroup.value.user;
    return user.nickname || user.username || user.email || `用户#${user.id}`;
  });

  async function querySupportGroups() {
    try {
      loadingGroups.value = true;
      const res = await SupportApi.querySupportGroups(filterForm);
      groups.value = res.data.rows || [];
      total.value = res.data.count || 0;
    } finally {
      loadingGroups.value = false;
    }
  }

  async function querySupportMessages(groupId: number) {
    try {
      loadingMessages.value = true;
      const res = await SupportApi.querySupportMessages({ groupId });
      messages.value = res.data || [];
    } finally {
      loadingMessages.value = false;
    }
  }

  async function handleSelectGroup(group: any) {
    currentGroup.value = group;
    replyStatus.value = group.supportStatus || 'processing';
    await querySupportMessages(group.id);
  }

  async function handleReply() {
    if (!currentGroup.value) {
      ElMessage.warning('请先选择一个对话');
      return;
    }
    if (!replyContent.value.trim()) {
      ElMessage.warning('请输入回复内容');
      return;
    }

    await SupportApi.replySupport({
      groupId: currentGroup.value.id,
      content: replyContent.value.trim(),
      status: replyStatus.value,
    });
    ElMessage.success('回复已发送');
    replyContent.value = '';
    await querySupportMessages(currentGroup.value.id);
    await querySupportGroups();
    const updated = groups.value.find(item => item.id === currentGroup.value?.id);
    if (updated) {
      currentGroup.value = updated;
    } else if (currentGroup.value) {
      currentGroup.value.supportStatus = replyStatus.value;
    }
  }

  onMounted(() => {
    querySupportGroups();
  });
</script>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">客服工作台</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>查看用户客服会话并进行人工回复。</div>
          <div>回复后可调整对话状态为处理中或已关闭。</div>
        </div>
      </template>
      <HButton outline @click="querySupportGroups">
        <SvgIcon name="i-ri:refresh-line" />
        刷新列表
      </HButton>
    </PageHeader>

    <page-main>
      <el-form inline :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="querySupportGroups">查询</el-button>
        </el-form-item>
      </el-form>
    </page-main>

    <page-main>
      <div class="support-layout">
        <div class="support-groups">
          <el-table
            v-loading="loadingGroups"
            :data="groups"
            height="600"
            size="large"
            @row-click="handleSelectGroup"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="user.nickname" label="用户" min-width="120">
              <template #default="scope">
                {{ scope.row.user?.nickname || scope.row.user?.username || scope.row.user?.email || `用户#${scope.row.userId}` }}
              </template>
            </el-table-column>
            <el-table-column prop="supportStatus" label="状态" width="120">
              <template #default="scope">
                {{ statusMap[scope.row.supportStatus] || scope.row.supportStatus }}
              </template>
            </el-table-column>
            <el-table-column prop="lastMessage" label="最新消息" min-width="200" />
            <el-table-column prop="updatedAt" label="更新时间" width="180" />
          </el-table>
          <el-pagination
            v-model:current-page="filterForm.page"
            v-model:page-size="filterForm.size"
            class="mt-4"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next"
            :total="total"
            @size-change="querySupportGroups"
            @current-change="querySupportGroups"
          />
        </div>

        <div class="support-messages">
          <el-card>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="text-sm font-semibold">当前会话：{{ currentUserLabel }}</div>
                <el-tag v-if="currentGroup" type="info">
                  {{ statusMap[currentGroup.supportStatus] || currentGroup.supportStatus }}
                </el-tag>
              </div>
            </template>

            <div v-loading="loadingMessages" class="messages-container">
              <div v-if="!currentGroup" class="empty-state">请选择一个会话开始查看</div>
              <div v-else-if="messages.length === 0" class="empty-state">暂无消息</div>
              <div v-else class="message-list">
                <div v-for="msg in messages" :key="msg.chatId" class="message-item">
                  <div class="message-meta">
                    <span class="message-role">{{ msg.role === 'assistant' ? '客服' : '用户' }}</span>
                    <span class="message-time">{{ msg.dateTime }}</span>
                  </div>
                  <div class="message-content">{{ msg.content }}</div>
                </div>
              </div>
            </div>

            <div class="reply-box">
              <el-form ref="replyFormRef" class="reply-form">
                <el-form-item label="回复内容">
                  <el-input
                    v-model="replyContent"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入客服回复内容"
                  />
                </el-form-item>
                <el-form-item label="对话状态">
                  <el-select v-model="replyStatus" style="width: 200px">
                    <el-option v-for="item in statusOptions.slice(1)" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleReply">发送回复</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-card>
        </div>
      </div>
    </page-main>
  </div>
</template>

<style scoped>
  .support-layout {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
  }

  .support-groups {
    min-width: 480px;
  }

  .support-messages {
    min-width: 360px;
  }

  .messages-container {
    min-height: 400px;
    max-height: 420px;
    overflow-y: auto;
    padding: 8px 4px;
  }

  .message-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .message-item {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
  }

  .message-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }

  .message-role {
    font-weight: 600;
  }

  .message-content {
    white-space: pre-wrap;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  .empty-state {
    text-align: center;
    color: var(--el-text-color-secondary);
    padding: 80px 0;
  }

  .reply-box {
    margin-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
    padding-top: 16px;
  }
</style>
