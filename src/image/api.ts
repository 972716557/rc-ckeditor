import type { PlainObject } from 'types';
import { Api } from '@/services/index';
const API_PREFIX = '/crm-ccm-service';
const apis: Api[] = [
  {
    code: '',
    key: 'uploadFile',
    url: '/viewpoint/v1/uploadFile',
    dis: '内容社区 图片上传',
  },
];
const apiByKey: PlainObject = {};

apis.forEach((item) => {
  const { key, url, version } = item;
  apiByKey[key] = `${API_PREFIX}${url}`;
  apiByKey[`${key}version`] = version || 'v5.0.0.1';
});
export default apiByKey;
