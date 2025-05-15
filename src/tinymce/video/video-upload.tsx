import React, { MouseEventHandler, useRef, useState } from 'react';
import { Modal, Upload, Tooltip, message, UploadProps, Input, Form, Button } from 'antd';
import { useRequest } from 'ahooks';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import TcVodParams from 'vod-js-sdk-v6/lib/src/uploader';

import { adsReport } from '@/utils/wmtd';
import VersionUpdateWrapper from '@/components/version-update-wrapper';
import { FuncGuideIdType } from '@/components/Common/guidance/interface';

import upload from './upload';
import { ESpaceEditorInitialVideo, ESpaceEditorLoading } from './constant';
import { VideoUploadProps } from './interface';
import { judgeTradeTime } from './service';
import './index.less';

const prefixCls = 'editor-video-upload';
const MAX_FILE_VOLUME = 500;
const descriptions = [
  { val: 1, label: '1.视频格式：当前仅支持MP4文件格式' },
  { val: 2, label: '2.默认视频首帧为视频封面，文件大小不超过500M' },
  {
    val: 3,
    label: '3.因公司内网带宽限制，无法在高峰使用时段(8:30-11:30、13:00-15:00)上传本地视频',
  },
];

const VideoUpload: React.FC<VideoUploadProps> = (props) => {
  const { editor, updatePercent } = props;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [uploadUrlOpen, setUploadUrlOpen] = useState(false);
  const [form] = Form.useForm();
  const [tradingOpen, setTradingOpen] = useState(false);

  const videoFileId = Form.useWatch('videoFileId', form);
  const isUploadedVideo = false;
  const { data: tradingData } = useRequest(judgeTradeTime);
  const isDisableToUploadVideo: boolean = tradingData?.data ?? true;
  const uploaderRef = useRef<TcVodParams>();

  const commonWarning = () => {
    Modal.warning({
      content: '您已经上传了一个视频，无法再次上传',
      okText: '我知道了',
    });
  };

  const openUploadUrlModal: MouseEventHandler<HTMLElement> = (e) => {
    e.stopPropagation();
    if (isUploadedVideo) {
      commonWarning();
      return;
    }
    // 投顾网页-发现.首页.关联链接_点击
    adsReport('tgpc-discover.sy.gllj_click');
    setUploadUrlOpen(true);
    // onChangeVideoData({ videoType: VideoType.Online });
    setTooltipOpen(false);
  };

  const handleUrlCancel = () => {
    setUploadUrlOpen(false);
  };

  const openUploadFileModal: MouseEventHandler<HTMLElement> = (e) => {
    e.stopPropagation();
    if (isUploadedVideo) {
      commonWarning();
      return;
    }
    // 投顾网页-发现.首页.本地上传_点击
    adsReport('tgpc-discover.sy.bdsc_click');
    // onChangeVideoData({ videoType: VideoType.Local });
    setTooltipOpen(false);
    setUploadFileOpen(true);
  };

  const handleFileCancel = () => {
    setUploadFileOpen(false);
  };

  const uploadCancel = () => {
    uploaderRef.current?.cancel();
    updatePercent(0);
  };

  const uploadUrlOk = () => {
    form.validateFields().then((values: { videoFileId: string }) => {
      const { videoFileId: tempVideoFileId } = values;
      setUploadUrlOpen(false);
      form.resetFields();
      const videoHtml = `<video class="${ESpaceEditorInitialVideo}" width="100%" src="${tempVideoFileId}" ></video> `;
      editor?.insertContent(videoHtml);
      uploadCancel();
    });
  };

  const uploadProps: UploadProps = {
    accept: '.mp4',
    multiple: false,
    fileList: [],
    customRequest(options: UploadRequestOption) {
      const reader = new FileReader();
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      reader.onload = function (e) {
        video.src = e.target?.result as unknown as string;
        video.setAttribute('preload', 'auto');
        video.onloadeddata = function () {
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          canvas.toBlob(function (blob) {
            const poster = new File([blob!], 'poster.png', {
              type: 'image/png',
            });
            const uploader = upload({
              mediaFile: options.file as unknown as File,
              coverFile: poster,
              onProgress: (progress) => {
                console.log(progress, 'progress');
                updatePercent(progress);
              },
              onSuccess: (fileId: string) => {
                const component = editor?.dom.get(ESpaceEditorLoading);
                // 删除组件
                if (component) {
                  editor?.dom?.remove(component);
                }
                message.success('视频上传成功！');
                const videoHtml = `<video class="${ESpaceEditorInitialVideo}" width="100%" src="${fileId}" ></video> `;
                editor?.insertContent(videoHtml);
              },
              onError: () => {
                // onChangeVideoData({ videoFileId: 'err' });
                message.error('上传失败，请检查网络');
              },
              onFinally: () => {
                setUploadFileOpen(false);
                video.remove();
              },
            });
            uploaderRef.current = uploader;
          }, 'image/png');
        };
      };
      reader.readAsDataURL(options.file as unknown as Blob);
    },
    beforeUpload(file) {
      const { size } = file;
      if (size > MAX_FILE_VOLUME * 1024 * 1024) {
        message.warn(`视频过大，请选择${MAX_FILE_VOLUME}M以内的文件`);
        return Upload.LIST_IGNORE;
      }
      uploaderRef.current?.cancel();
      const regex = /\mp4$/i;
      if (!regex.test((file as unknown as File)?.name)) {
        message.warn('当前仅支持MP4文件格式');
        return;
      }
      const videoHtml = `<div id="${ESpaceEditorLoading}"class="${ESpaceEditorLoading}" width="100%"></div> `;
      editor?.insertContent(videoHtml);
      handleFileCancel();
      return true;
    },
  };

  const onClick = () => {
    if (isUploadedVideo) {
      commonWarning();
    }
    adsReport('tgpc-discover.sy.videork_click');
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <Tooltip
        title={
          <>
            <div className={`${prefixCls}-button`} onClick={openUploadFileModal}>
              <i className="iconfont icon-shangchuan1" /> 上传本地视频
            </div>
            <div className={`${prefixCls}-button`} onClick={openUploadUrlModal}>
              <i className="iconfont icon-video1" />
              添加视频ID
            </div>
          </>
        }
        trigger="hover"
        placement="bottom"
        open={tooltipOpen}
        onOpenChange={(visibility: boolean) => {
          setTooltipOpen(visibility);
        }}
        showArrow={false}
      >
        <VersionUpdateWrapper
          isCloseWhenHover
          funcGuideId={FuncGuideIdType.DISCOVERY_EDIT_BUTTON_UPLOAD_VIDEO}
          tooltipProps={{ trigger: ['hover', 'click'] }}
        >
          <span onClick={onClick} className={`${prefixCls}-upload-icon`}>
            <i className="icon-video1 iconfont" />
          </span>
        </VersionUpdateWrapper>
      </Tooltip>
      <Modal
        title="添加视频ID"
        onOk={uploadUrlOk}
        open={uploadUrlOpen}
        onCancel={handleUrlCancel}
        okButtonProps={{ disabled: !videoFileId }}
        zIndex={1001}
      >
        <Form form={form}>
          <Form.Item
            name="videoFileId"
            label="视频ID"
            rules={[{ required: true, message: '请输入内容中台的视频ID' }]}
          >
            <Input placeholder="请输入内容中台的视频ID" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        footer={null}
        title="本地上传"
        open={uploadFileOpen}
        onCancel={handleFileCancel}
        zIndex={1001}
      >
        <div className={`${prefixCls}-upload`}>
          {/* <Upload {...uploadProps} disabled={isDisableToUploadVideo}> */}
          <Upload {...uploadProps}>
            <Tooltip
              open={tradingOpen}
              trigger="hover"
              title="当前在高峰时段，无法上传视频"
              zIndex={1005}
              onOpenChange={(val: boolean) => {
                if (isDisableToUploadVideo) {
                  setTradingOpen(val);
                }
              }}
            >
              {/*  <Button type="primary" disabled={isDisableToUploadVideo}> */}
              <Button type="primary">
                <i className="iconfont icon-shangchuan1" /> 上传本地视频
              </Button>
            </Tooltip>
          </Upload>
        </div>
        {descriptions.map(({ label, val }) => (
          <div className={`${prefixCls}-description`} key={val}>
            {label}
          </div>
        ))}
      </Modal>
    </div>
  );
};
export default VideoUpload;
