import TCPlayer from 'tcplayer.js';
import { message } from 'antd';
import 'tcplayer.js/dist/tcplayer.min.css';
import { formatErrorTip } from '@/utils/common';
import { RESPONSE_CODE_MAP } from '@/utils/request';

import { APP_ID, LICENSE_URL } from './constant';
import { uploadFile } from '../image/service';

interface PlayerParams {
  sign: string;
  videoFileId: string;
  onSuccess?: (poster: string) => void;
  onError?: () => void;
  videoId: string;
}

const uploadImg = async (blob: Blob) => {
  const file = new File([blob], 'img.png', { type: 'image/png' });
  let params = new FormData();
  params.append('file', file);
  const res = await uploadFile(params);
  const { data, message: msg, code } = res;
  if (code === RESPONSE_CODE_MAP.INNER.SUCCESS && data.fileUrl) {
    return data.fileUrl;
  }
  const tip = formatErrorTip({ api: 'uploadFile', message: msg, code });
  message.error(tip);
  return '';
};

const getPoster = ({ onSuccess }: { onSuccess?: (poster: string) => void }) => {
  const tempVideo = document.getElementsByTagName('video')[0];
  const video = document.createElement('video');
  video.setAttribute('crossOrigin', 'anonymous'); //处理跨域
  video.setAttribute('src', tempVideo?.src);
  video.setAttribute('preload', 'auto');

  video.addEventListener('loadeddata', function () {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    //canvas的尺寸和图片一样
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    //绘制canvas
    canvas.getContext('2d')!.drawImage(video, 0, 0, width, height);
    canvas.toBlob(async (blob) => {
      const poster = (await uploadImg(blob as Blob)) as unknown as string;
      onSuccess?.(poster);
    }, 'image/png');
    video.remove();
  });
};

const createPlayer = (params: PlayerParams) => {
  const { sign, videoFileId, onSuccess, onError, videoId } = params;
  const obj = {
    psign: sign,
    appID: APP_ID,
    fileID: videoFileId,
    licenseUrl: LICENSE_URL,
  };
  const player = TCPlayer(videoId, obj);
  player.on('canplay', () => {
    getPoster({ onSuccess });
  });
  player.on('error', function () {
    onError?.();
  });

  return player;
};
export default createPlayer;
