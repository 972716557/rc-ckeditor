import { Spin } from 'antd';

import { ESpaceEditorLoading } from './constant';

const VideoLoading = ({ percent }) => {
  console.log(percent, 'VideoLoading');
  const tip = percent
    ? `视频上传中，请耐心等待...${(percent * 100).toFixed(0)}%`
    : '视频上传中，请耐心等待...';

  return (
    <div id={ESpaceEditorLoading} className="e-space-editor-video-content">
      <Spin tip={tip} spinning={true}>
        <div></div>
      </Spin>
    </div>
  );
};

export default VideoLoading;
