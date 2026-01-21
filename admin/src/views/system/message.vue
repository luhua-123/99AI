<route lang="yaml">
meta:
  title: 站内信推送
</route>

<script lang="ts" setup>
  import ApiMessage from '@/api/modules/message';
  import ApiUser from '@/api/modules/user';
  import useSettingsStore from '@/store/modules/settings';
  import type { FormInstance, FormRules } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { MdEditor } from 'md-editor-v3';
  import 'md-editor-v3/lib/style.css';
  import { computed, reactive, ref } from 'vue';

  const settingsStore = useSettingsStore();
  const theme = computed(() => settingsStore.settings.app.colorScheme);

  const formRef = ref<FormInstance>();
  const loadingUsers = ref(false);
  const userOptions = ref<{ label: string; value: number }[]>([]);

  const formInline = reactive({
    title: '',
    content: '',
    sendType: 1,
    userIds: [] as number[],
  });

  const rules = ref<FormRules>({
    title: [{ required: true, trigger: 'blur', message: '请填写消息标题' }],
    content: [{ required: true, trigger: 'blur', message: '请填写消息内容' }],
    sendType: [{ required: true, trigger: 'change', message: '请选择推送类型' }],
    userIds: [
      {
        required: true,
        trigger: 'change',
        message: '请至少选择一个用户',
      },
    ],
  });

  function formatUserLabel(user: any) {
    const name = user?.username || user?.email || `用户${user?.id}`;
    const nickname = user?.nickname ? `(${user.nickname})` : '';
    return `${name}${nickname}`;
  }

  async function queryUsers(keyword: string) {
    if (!keyword) {
      userOptions.value = [];
      return;
    }
    loadingUsers.value = true;
    try {
      const res: any = await ApiUser.queryAllUser({
        keyword,
        page: 1,
        size: 20,
      });
      const rows = res?.data?.rows || [];
      const options = rows.map((item: any) => ({
        value: item.id,
        label: formatUserLabel(item),
      }));
      const selectedMap = new Map(
        formInline.userIds.map((id) => [id, { value: id, label: `用户${id}` }]),
      );
      options.forEach((opt: any) => selectedMap.set(opt.value, opt));
      userOptions.value = Array.from(selectedMap.values());
    } finally {
      loadingUsers.value = false;
    }
  }

  function handleSendTypeChange(value: number) {
    if (Number(value) === 1) {
      formInline.userIds = [];
    }
  }

  async function handleSend() {
    formRef.value?.validate(async (valid: any) => {
      if (!valid) {
        ElMessage.error('请填写完整信息');
        return;
      }
      const payload = {
        title: formInline.title,
        content: formInline.content,
        sendType: Number(formInline.sendType),
        userIds: formInline.userIds,
      };
      try {
        const res: any = await ApiMessage.sendMessage(payload);
        if (res?.success) {
          ElMessage.success(`推送成功，已发送 ${res.data?.total || 0} 人`);
          formInline.title = '';
          formInline.content = '';
          formInline.userIds = [];
        }
      } catch (error) {}
    });
  }

  function onChange() {}
</script>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">站内信推送</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>支持全量推送或指定用户推送，消息会同步到用户端收件箱。</div>
        </div>
      </template>
      <HButton outline @click="handleSend">
        <SvgIcon name="i-ri:send-plane-line" />
        立即推送
      </HButton>
    </PageHeader>

    <el-card style="margin: 20px">
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="120px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="14" :xl="10">
            <el-form-item label="消息标题" prop="title">
              <el-input v-model="formInline.title" placeholder="请输入消息标题" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="20" :lg="14" :xl="10">
            <el-form-item label="推送类型" prop="sendType">
              <el-radio-group v-model="formInline.sendType" @change="handleSendTypeChange">
                <el-radio :label="1">全量推送</el-radio>
                <el-radio :label="2">指定用户</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="Number(formInline.sendType) === 2">
          <el-col :xs="24" :md="20" :lg="16" :xl="12">
            <el-form-item label="选择用户" prop="userIds">
              <el-select
                v-model="formInline.userIds"
                multiple
                filterable
                remote
                reserve-keyword
                :remote-method="queryUsers"
                :loading="loadingUsers"
                placeholder="搜索用户名/邮箱/手机号/昵称"
                style="width: 100%"
              >
                <el-option
                  v-for="item in userOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="消息内容" prop="content">
              <MdEditor
                v-model="formInline.content"
                style="min-height: 70vh"
                :theme="theme"
                @on-change="onChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
