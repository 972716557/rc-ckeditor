import TcVod from 'vod-js-sdk-v6';
import TcVodParams from 'vod-js-sdk-v6/lib/src/uploader';

import { getUploadVideoSign } from './service';
import { UploadVideoResult } from './interface';

interface UploadParams {
  mediaFile?: File;
  coverFile?: File;
  onProgress?: (progress: number) => void;
  onSuccess?: (fileId: string) => void;
  onError?: () => void;
  onFinally?: () => void;
}

const getSignature: TcVodParams['getSignature'] = () => {
  return getUploadVideoSign().then((response) => response.data.videoSign);
};

const tcVod = new TcVod({
  getSignature,
});

const upload = (params: UploadParams) => {
  const { mediaFile, coverFile, onProgress, onError, onFinally, onSuccess } = params;
  const uploader = tcVod.upload({
    mediaFile,
    coverFile,
  });
  uploader.on('media_progress', function (info) {
    onProgress?.(info.percent);
  });
  uploader
    .done()
    .then((doneResult: UploadVideoResult) => {
      const { fileId } = doneResult || {};
      if (fileId) {
        onSuccess?.(fileId);
      }
    })
    .catch(() => {
      onError?.();
    })
    .finally(() => {
      onFinally?.();
    });
  return uploader;
};

export default upload;
