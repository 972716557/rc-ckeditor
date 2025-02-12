import type { AxiosRequestConfig } from "axios";
import type { ResponseData } from "types";

import api from "./api";
const request = () => {};

export async function judgeTradeTime(payload: {}): Promise<
  ResponseData<boolean>
> {
  const options: AxiosRequestConfig = {
    url: api.judgeTradeTime,
    method: "post",
    data: payload,
  };
  return requesting(
    options,
    {},
    { showErrorTips: true, successCode: RESPONSE_CODE_MAP.INNER.SUCCESS }
  );
}

export async function getPlayVideoSign(payload: {
  videoFileId: string;
}): Promise<ResponseData<{ videoSign: string }>> {
  const options: AxiosRequestConfig = {
    url: api.getPlayVideoSign,
    method: "post",
    data: payload,
  };
  return requesting(
    options,
    {},
    { showErrorTips: true, successCode: RESPONSE_CODE_MAP.INNER.SUCCESS }
  );
}

export async function getUploadVideoSign(): Promise<
  ResponseData<{ videoSign: string }>
> {
  const options: AxiosRequestConfig = {
    url: api.getUploadVideoSign,
    method: "post",
    data: {},
  };
  return requesting(
    options,
    {},
    { showErrorTips: true, successCode: RESPONSE_CODE_MAP.INNER.SUCCESS }
  );
}
