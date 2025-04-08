import { FC, useContext, useEffect, useMemo, useState } from 'react';
import { ContentBlock, EditorState } from 'draft-js';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';
import { useRequest } from 'ahooks';
import { Spin, message } from 'antd';

import { RESPONSE_CODE_MAP } from '@/utils/request';
import { formatErrorTip } from '@/utils/common';

import EditorContext from '../context';
import createPlayer from './create-player';
import { generateRandomKey } from '../utils/convert-from-html-to-content-block';
import { getSelectionForKey, removeImage, removeVideoWhenUploadFailure } from '../utils';
import { getPlayVideoSign } from '../video-upload/service';
import './index.less';

interface VideoProps {
  blockProps: {
    getEditorState: () => EditorState;
    setEditorState: (state: EditorState) => void;
    entityKey: string;
    src?: string;
  };
  block: ContentBlock;
}
const prefix = 'e-space-editor-video';

const Video: FC<VideoProps> = ({ blockProps, block }) => {
  const { getEditorState, setEditorState, entityKey, src } = blockProps;

  const editorState = getEditorState();
  const [sign, setSign] = useState('');

  const { uploadVideoData, onChangeUploadVideoData, onChangeVideoData, videoData } =
    useContext(EditorContext);

  const videoId = useMemo(() => {
    return `${prefix}-${generateRandomKey()}`;
  }, []);

  const deleteVideo = () => {
    let currentEditorState = getEditorState();
    currentEditorState = removeVideoWhenUploadFailure(currentEditorState);
    // 因播放失败，但已经插入的视频需要移除，这样会导致空行，需要删除空行
    currentEditorState = keyCommandPlainBackspace(currentEditorState);
    setEditorState(currentEditorState);
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

  const onDelete = () => {
    const blockKey = block.getKey();
    const selection = getSelectionForKey(blockKey);
    let currentEditorState = EditorState.forceSelection(editorState, selection);
    currentEditorState = removeImage(currentEditorState);
    if (currentEditorState) {
      setEditorState(currentEditorState);
    }
  };

  const tip =
    (uploadVideoData?.uploadVideoPercent || 0) > 0
      ? `视频上传中，请耐心等待...${((uploadVideoData?.uploadVideoPercent || 0) * 100).toFixed(0)}%`
      : '视频上传中，请耐心等待...';

  const renderSrc = videoData.videoFileId || src;

  // player-container-id 为播放器容器 ID，必须与 html 中一致
  useEffect(() => {
    // 处理编辑器回撤的时候没有videoData.videoFileId，这个时候就需要编辑器的src播放
    if (!renderSrc) {
      return;
    }
    if (!sign && renderSrc) {
      runGetPlayVideoSign({ videoFileId: renderSrc });
      return;
    }

    const player = createPlayer({
      sign,
      videoFileId: renderSrc,
      videoId,
      onError: () => {
        // 播放错误延迟删除，不然会导致编辑器里面新增和删除视频出现闪屏
        onChangeUploadVideoData({ uploadVideoLoading: false });
        deleteVideo();
        message.error('播放失败，请检查关联的视频ID');
      },
      onSuccess: (poster: string) => {
        if (!videoData?.videoCoverUrl) {
          onChangeVideoData?.({ videoCoverUrl: poster, videoFileId: renderSrc });
        }
        setTimeout(() => {
          onChangeUploadVideoData({ uploadVideoLoading: false });
        }, 100);
      },
    });

    return () => {
      player.dispose();
    };
  }, [renderSrc, sign]);

  useEffect(() => {
    if (videoData.videoFileId && entityKey && !uploadVideoData.uploadVideoLoading) {
      const contentState = editorState.getCurrentContent();
      const entityData = contentState.getEntity(entityKey)?.getData();
      const { src: tempSrc } = entityData;
      if (!tempSrc) {
        contentState.mergeEntityData(entityKey, { src: videoData.videoFileId });
        setEditorState(EditorState.push(editorState, contentState, 'insert-characters'));
      }
    }
  }, [uploadVideoData.uploadVideoLoading, videoData.videoFileId]);

  return (
    <div className={`${prefix}__content`}>
      <div className={`${prefix}__delete`} onClick={onDelete}>
        <i className="iconfont icon-delete2" />
      </div>
      <Spin spinning={uploadVideoData.uploadVideoLoading} tip={tip}>
        <video id={videoId}></video>
      </Spin>
    </div>
  );
};
export default Video;
