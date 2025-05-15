import type { PlainObject } from 'types';
import { Api } from '@/services/index';
const apis: Api[] = [
  {
    code: '',
    key: 'judgeTradeTime',
    url: '/crm-base-service/trade/calendar/judgeTradeTime',
    dis: '判断交易时间',
  },
  {
    code: '',
    key: 'queryUploadVideoStatus',
    url: '/crm-ccm-service/viewpoint/v1/queryUploadVideoStatus',
    dis: '查询视频上传状态',
  },
  {
    code: '',
    key: 'getUploadVideoSign',
    url: '/crm-ccm-service/viewpoint/v1/getUploadVideoSign',
    dis: '获取上传签名',
  },
  {
    code: '',
    key: 'getPlayVideoSign',
    url: '/crm-ccm-service/viewpoint/v1/getPlayVideoSign',
    dis: '获取播放视频签名',
  },
];
const apiByKey: PlainObject = {};

apis.forEach((item) => {
  const { key, url, version } = item;
  apiByKey[key] = url;
  apiByKey[`${key}version`] = version || 'v5.0.0.1';
});
export default apiByKey;
