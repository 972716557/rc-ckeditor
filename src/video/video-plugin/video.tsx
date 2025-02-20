import React, { useEffect, useMemo, useState } from "react";
import { message, Spin } from "antd";
import createPlayer from "./util";

import "./index.less";
import { uniqueId } from "lodash";

import "tcplayer.js/dist/tcplayer.min.css";

const sign =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6MTUwMDAxODUyNiwiZmlsZUlkIjoiMTM5Nzc1NzkwNTUwODcxMDU4OCIsImNvbnRlbnRJbmZvIjp7ImF1ZGlvVmlkZW9UeXBlIjoiT3JpZ2luYWwifSwiY3VycmVudFRpbWVTdGFtcCI6MTc0MDAxNzEzNCwiZXhwaXJlVGltZVN0YW1wIjoxNzQwMDE3NzM0fQ.mIeE_aO_PupSdvSWeEVauXuuGs_Mq3BKoXnEBPzhOcE";
const prefix = "e-space-editor-video";

const Tcplayer = ({ fileId = "1397757905508710588" }) => {
  const tip = "loading";

  const videoId = useMemo(() => {
    return `${prefix}-${uniqueId()}`;
  }, []);

  const [loading, setLoading] = useState(true);

  const deleteVideo = () => {};

  useEffect(() => {
    // 处理编辑器回撤的时候没有videoData.videoFileId，这个时候就需要编辑器的src播放

    const player = createPlayer({
      sign,
      videoFileId: fileId,
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
  }, [fileId]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, []);

  const onDelete = () => {};
  return (
    <div className={`${prefix}__content`}>
      <div className={`${prefix}__delete`} onClick={onDelete}>
        <i className="iconfont icon-delete2" />
      </div>
      <Spin spinning={loading} tip={tip}>
        <video id={videoId}></video>
      </Spin>
    </div>
  );
};

export default Tcplayer;
