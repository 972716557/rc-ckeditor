import { FC, useContext, useEffect, useMemo, useState } from "react";
import { useRequest } from "ahooks";
import { Spin, message } from "antd";

import { formatErrorTip } from "@/utils/common";

import "./index.less";
import EditorContext from "../context";
import { getPlayVideoSign } from "./service";
import createPlayer from "@/components/editor/video/create-player";
import { uniqueId } from "lodash";

interface VideoProps {
  src?: string;
}
const prefix = "e-space-editor-video";

const Video: FC<VideoProps> = ({ src }) => {
  const [sign, setSign] = useState("");

  const videoId = useMemo(() => {
    return `${prefix}-${uniqueId()}`;
  }, []);

  const deleteVideo = () => {};

  const { run: runGetPlayVideoSign } = useRequest(getPlayVideoSign, {
    manual: true,
    onSuccess: ({ code, message: msg, data }) => {
      if (code === 200) {
        setSign(data.videoSign);
      } else {
        deleteVideo();
        const tempTip = formatErrorTip({
          api: "getPlayVideoSign",
          code,
          message: msg,
        });
        message.error(tempTip);
      }
    },
    onError: (err) => {
      const tempTip = formatErrorTip({
        api: "getPlayVideoSign",
        message: err.message,
      });
      message.error(tempTip);
      deleteVideo();
    },
  });

  const onDelete = () => {
    // const blockKey = block.getKey();
    // const selection = getSelectionForKey(blockKey);
    // let currentEditorState = EditorState.forceSelection(editorState, selection);
    // currentEditorState = removeImage(currentEditorState);
    // if (currentEditorState) {
    //   setEditorState(currentEditorState);
    // }
  };

  //   const tip =
  //     (uploadVideoData?.uploadVideoPercent || 0) > 0
  //       ? `视频上传中，请耐心等待...${((uploadVideoData?.uploadVideoPercent || 0) * 100).toFixed(0)}%`
  //       : '视频上传中，请耐心等待...';

  // player-container-id 为播放器容器 ID，必须与 html 中一致
  useEffect(() => {
    // 处理编辑器回撤的时候没有videoData.videoFileId，这个时候就需要编辑器的src播放

    const player = createPlayer({
      sign,
      videoFileId: src,
      videoId,
      onError: () => {
        // 播放错误延迟删除，不然会导致编辑器里面新增和删除视频出现闪屏
        deleteVideo();
        message.error("播放失败，请检查关联的视频ID");
      },
      onSuccess: (poster: string) => {},
    });

    return () => {
      player.dispose();
    };
  }, [sign]);

  return (
    <div className={`${prefix}__content`}>
      <div className={`${prefix}__delete`} onClick={onDelete}>
        <i className="iconfont icon-delete2" />
      </div>
      <Spin>
        <video id={videoId}></video>
      </Spin>
    </div>
  );
};
export default Video;
