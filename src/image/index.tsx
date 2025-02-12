import { useState } from 'react';
import Modal from './modal';
import { FileItem } from 'types';
import { PictureOutlined } from '@ant-design/icons';
const prefixCls = 'community-rich-editor';

const Image = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const onClick = () => {
    setOpen(true);
  };

  const onOk = (data: FileItem[]) => {
    data.forEach((image) => {
      editor.execute('insertImage', { source: image.fileUrl, alt: image.fileName });
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
      <Modal onOk={onOk} onCancel={onCancel} open={open} />
    </>
  );
};
export default Image;
