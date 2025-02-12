import { Form, Input, Modal } from 'antd';
import { FC, useEffect } from 'react';

import { DrawerProps } from './interface';

const EditDrawer: FC<DrawerProps> = (props) => {
  const { visible, onOk, onCancel, initialTitle } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ title: initialTitle });
  }, [initialTitle, , visible]);

  const onDrawerOk = () => {
    form.validateFields().then((values) => {
      onOk(values);
      form.resetFields();
    });
  };

  const onDrawerCancel = () => {
    onCancel();
    form.resetFields();
  };

  return (
    <Modal
      open={visible}
      onOk={onDrawerOk}
      onCancel={onDrawerCancel}
      title="设置链接"
      zIndex={10000}
    >
      <Form form={form}>
        <Form.Item name="title" rules={[{ required: true, message: '请输入链接文本' }]}>
          <Input placeholder="链接文本" />
        </Form.Item>
        <Form.Item
          name="url"
          rules={[
            {
              type: 'url',
              message: '无效链接',
            },
            { required: true, message: '请输入链接地址' },
          ]}
        >
          <Input placeholder="链接地址" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default EditDrawer;
