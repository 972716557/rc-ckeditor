import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useMount, useRequest } from 'ahooks';
import { message } from 'antd';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { uniqueId } from 'lodash';

import { RESPONSE_CODE_MAP } from '@/utils/request';
import { formatErrorTip } from '@/utils/common';

import createPlayer from './create-player';
import RemoveVideoIcon from '../assets/remove-video-icon';
import { getPlayVideoSign } from './service';
import './index.less';

interface VideoProps {
  fileId?: string;
  editor?: TinyMCEEditor;
}
const prefix = 'e-space-editor-video';

const Video: FC<VideoProps> = ({ fileId, editor }) => {
  const [sign, setSign] = useState('');

  const id = useMemo(() => {
    const componentId = prefix + Date.now();
    return componentId;
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const deleteVideo = () => {
    const component = editor?.dom.get(id);
    // 删除组件
    if (component) {
      editor?.dom?.remove(component);

      // 可选：触发内容变更事件（确保撤销/重做功能正常）
      editor?.fire('change');
    }
  };

  const { run: runGetPlayVideoSign } = useRequest(getPlayVideoSign, {
    manual: true,
    onSuccess: ({ code, message: msg, data }) => {
      if (code === RESPONSE_CODE_MAP.INNER.SUCCESS) {
        setSign(data.videoSign);
      } else {
        deleteVideo();
        const tempTip = formatErrorTip({ api: 'getPlayVideoSign', code, message: msg });
        message.error(tempTip);
      }
    },
    onError: (err) => {
      const tempTip = formatErrorTip({
        api: 'getPlayVideoSign',
        message: err.message,
      });
      message.error(tempTip);
      deleteVideo();
    },
  });

  const videoId = useMemo(() => {
    return `${prefix}-${uniqueId()}`;
  }, []);

  useMount(() => {
    const video = document.createElement('video');
    // 设置 id 属性
    video.id = videoId;
    document.body.appendChild(video);
  });

  // player-container-id 为播放器容器 ID，必须与 html 中一致
  useEffect(() => {
    // 处理编辑器回撤的时候没有videoData.videoFileId，这个时候就需要编辑器的src播放
    if (!fileId || !videoId) {
      return;
    }

    if (!sign && fileId) {
      runGetPlayVideoSign({ videoFileId: fileId });
      return;
    }
    const player = createPlayer({
      sign,
      videoFileId: fileId,
      videoId,
      onError: () => {
        // 播放错误延迟删除，不然会导致编辑器里面新增和删除视频出现闪屏
        deleteVideo();
        message.error('播放失败，请检查关联的视频ID');
      },
      onSuccess: (poster: string) => {},
    });
    ref.current?.appendChild(document.querySelector('.tcplayer')!);
    return () => {
      player.dispose();
    };
  }, [fileId, sign]);

  return (
    <div className={`${prefix}-content`} id={id}>
      <div className={`${prefix}-delete`} onClick={deleteVideo}>
        <RemoveVideoIcon />
      </div>
      <div ref={ref}></div>
    </div>
  );
};
export default Video;
