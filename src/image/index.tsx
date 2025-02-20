import React, { useState } from "react";
import { Form, Input, Modal } from "antd";
import { PictureOutlined } from "@ant-design/icons";

// import Modal from "./modal";

const prefixCls = "community-rich-editor";

const Image = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const onClick = () => {
    setOpen(true);
  };

  const onOk = (data) => {
    const {
      src = "https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png",
    } = form.getFieldsValue();
    editor!.execute("insetCustomImg", {
      src,
    });
    setOpen(false);
  };

  const onCancel = () => {
    setOpen(false);
  };
  return (
    <>
      <span className={`${prefixCls}-toolbar-item`} onClick={onClick}>
        <PictureOutlined />
      </span>
      {/* <Modal onOk={onOk} onCancel={onCancel} open={open} /> */}
      <Modal onOk={onOk} open={open} onCancel={onCancel}>
        <Form>
          <Form.Item name="src">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
export default Image;
