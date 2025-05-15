import type { AxiosRequestConfig } from 'axios';
import requesting from '@/utils/request';
import type { ResponseData, FileItem } from 'types';

import api from './api';

export async function uploadFile(payload: FormData): Promise<ResponseData<FileItem>> {
  const options: AxiosRequestConfig = {
    url: api.uploadFile,
    method: 'post',
    data: payload,
  };
  return requesting(options, {});
}
