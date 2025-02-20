import React, { useState } from "react";
import { Modal, Input, Form } from "antd";

import { VideoUploadProps } from "./interface";

const prefixClsCommon = "community-rich-editor";

const VideoUpload: React.FC<VideoUploadProps> = (props) => {
  const { editor } = props;

  const [uploadUrlOpen, setUploadUrlOpen] = useState(false);
  const [form] = Form.useForm();

  const videoFileId = Form.useWatch("videoFileId", form);
  const isUploadedVideo = false;

  const uploadUrlOk = () => {
    form.validateFields().then((values: { videoFileId: string }) => {
      const { videoFileId: tempVideoFileId } = values;
      setUploadUrlOpen(false);
      form.resetFields();
      editor!.execute("insertCustomComponent", { message: tempVideoFileId });
    });
  };

  const onClick = () => {
    setUploadUrlOpen(true);
  };

  return (
    <div style={{ display: "inline-block" }}>
      <span className={`${prefixClsCommon}-toolbar-item`} onClick={onClick}>
        视频
      </span>
      <Modal
        title="添加视频ID"
        onOk={uploadUrlOk}
        open={uploadUrlOpen}
        okButtonProps={{ disabled: !videoFileId }}
        zIndex={1001}
      >
        <Form form={form}>
          <Form.Item
            name="videoFileId"
            label="视频ID"
            rules={[{ required: true, message: "请输入内容中台的视频ID" }]}
          >
            <Input placeholder="请输入内容中台的视频ID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default VideoUpload;
