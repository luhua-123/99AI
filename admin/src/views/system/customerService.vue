<route lang="yaml">
meta:
  title: 客服配置
</route>

<script lang="ts" setup>
  import apiConfig from '@/api/modules/config';
  import uploadApi from '@/api/modules/upload';
  import type { FormInstance, FormRules } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { MdEditor } from 'md-editor-v3';
  import 'md-editor-v3/lib/style.css';
  import { onMounted, reactive, ref } from 'vue';

  const formInline = reactive({
    customerServiceContactMarkdown: '',
  });

  const rules = ref<FormRules>({
    customerServiceContactMarkdown: [
      { required: true, trigger: 'blur', message: '请填写客服联系方式内容' },
    ],
  });

  const formRef = ref<FormInstance>();

  async function queryAllConfig() {
    const res = await apiConfig.queryConfig({
      keys: ['customerServiceContactMarkdown'],
    });
    const { customerServiceContactMarkdown } = res.data || {};
    Object.assign(formInline, { customerServiceContactMarkdown });
  }

  function handlerUpdateConfig() {
    formRef.value?.validate(async (valid: any) => {
      if (valid) {
        try {
          await apiConfig.setConfig({ settings: formatSetting(formInline) });
          ElMessage.success('变更配置信息成功');
        } catch (error) {}
        queryAllConfig();
      } else {
        ElMessage.error('请填写完整信息');
      }
    });
  }

  function formatSetting(settings: any) {
    return Object.keys(settings).map((key) => {
      return {
        configKey: key,
        configVal: settings[key],
      };
    });
  }

  async function onUploadImg(
    files: Iterable<Blob> | ArrayLike<Blob>,
    callback: (arg0: unknown[]) => void,
  ) {
    const res = await Promise.all(
      Array.from(files).map((file) => {
        return new Promise(async (resovle, reject) => {
          const form = new FormData();
          form.append('file', file);
          try {
            const response = await uploadApi.uploadFile(form, 'system/others');
            if (!response?.data?.data) {
              ElMessage.error('图片上传失败、请检查您的配置信息！');
            }
            resovle(response.data.data);
          } catch (error) {
            ElMessage.error(error || '图片上传失败、请检查您的配置信息！');
            reject(error);
          }
        });
      }),
    );
    callback(res.map((item) => item));
    ElMessage({ message: '图片上传成功！', type: 'success' });
  }

  onMounted(() => {
    queryAllConfig();
  });
</script>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">客服配置</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>此处内容将展示在用户端“联系方式”标签页。</div>
          <div>支持 Markdown 格式，可插入图片与链接。</div>
        </div>
      </template>
      <HButton outline @click="handlerUpdateConfig">
        <SvgIcon name="i-ri:file-text-line" />
        保存设置
      </HButton>
    </PageHeader>
    <el-card style="margin: 20px">
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="140px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="联系方式内容" prop="customerServiceContactMarkdown">
              <MdEditor
                v-model="formInline.customerServiceContactMarkdown"
                style="min-height: 70vh"
                @on-upload-img="onUploadImg"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
