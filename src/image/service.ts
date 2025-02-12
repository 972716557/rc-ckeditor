import type { AxiosRequestConfig } from "axios";
import type { ResponseData, FileItem } from "types";

import api from "./api";
const requesting = () => {};

export async function uploadFile(
  payload: FormData
): Promise<ResponseData<FileItem>> {
  const options: AxiosRequestConfig = {
    url: api.uploadFile,
    method: "post",
    data: payload,
  };
  return requesting(options, {});
}
