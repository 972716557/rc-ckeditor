import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Modal, Upload, message, UploadProps, UploadFile } from 'antd';
import { useSetState } from 'ahooks';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { RcFile } from 'antd/lib/upload';

import { getApiHostname } from '@/utils/common';
import { gettingBase64OfFile } from '@/utils';
import { RESPONSE_CODE_MAP } from '@/utils/request';
import { ImageProps, StateProps } from './interface';
import { uploadFile } from './service';
import './index.less';

const MAX_FILE_VOLUME = 10;

const Picture: React.FC<ImageProps> = (props) => {
  const { onOk, onCancel, isSaveImageWithFullPath, open, editor } = props;
  const [{ fileList, loading, previewOpen, previewTitle, previewImage }, setState] =
    useSetState<StateProps>({
      fileList: [],
      loading: false,
      previewOpen: false,
      previewTitle: '',
      previewImage: '',
    });

  // 点击取消按钮
  const handleCancel = () => {
    if (fileList.length > 0) {
      Modal.confirm({
        title: '确认取消？',
        icon: null,
        content: '取消后图片将不会保存，是否取消',
        okText: '确认',
        cancelText: '取消',
        zIndex: 1400,
        onOk: () => {
          onCancel();
          setState({
            fileList: [],
          });
        },
      });
    } else {
      onCancel();
    }
  };

  // 点击确定按钮
  const handleOk = () => {
    const urls = fileList.map(({ response }) => {
      const host = getApiHostname();
      const tempUrl = isSaveImageWithFullPath ? `${host}${response.fileUrl}` : response.fileUrl;
      return {
        fileName: response.fileName,
        fileUrl: tempUrl,
      };
    });
    if (editor) {
      urls.forEach(({ fileName, fileUrl }) => {
        const imageHtml = `<img src="${fileUrl}" alt="${fileName}" />`;
        editor.insertContent(imageHtml); // 插入图片
      });
    }
    onOk(urls);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await gettingBase64OfFile(file.originFileObj as RcFile);
    }
    setState({
      previewOpen: true,
      previewTitle: file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1),
      previewImage: file.url || (file.preview as string),
    });
  };

  // 渲染图片上传视图
  const renderAddImage = () => {
    const uploadProps: UploadProps = {
      accept: 'image/*',
      fileList,
      multiple: false,
      listType: 'picture-card',
      className: 'avatar-uploader',
      onPreview: handlePreview,
      onRemove() {
        return true;
      },
      customRequest(options: UploadRequestOption) {
        let params = new FormData();
        params.append('file', options.file);
        setState({ loading: true });
        uploadFile(params)
          .then((res) => {
            const { data } = res;
            if (res.code === RESPONSE_CODE_MAP.INNER.SUCCESS) {
              setState({
                loading: false,
              });
              options?.onSuccess(data);
            } else {
              setState({
                loading: false,
              });
              message.error(res.message);
              options?.onError();
            }
          })
          .catch((error) => {
            message.error(error.message);
            options?.onError(error, options.file);
            setState({ loading: false });
          });
      },
      onChange({ fileList: _fileList }) {
        setState({ fileList: _fileList });
      },
      beforeUpload(file) {
        const { size } = file;
        if (size > MAX_FILE_VOLUME * 1024 * 1024) {
          message.warn(`${file.name}超过${MAX_FILE_VOLUME}M大小限制，已被忽略`);
          return Upload.LIST_IGNORE;
        }
        return true;
      },
    };
    return (
      <>
        <div className="editor-picture">
          <Upload {...uploadProps}>
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传图片</div>
            </div>
          </Upload>
          <Modal
            open={previewOpen}
            title={previewTitle}
            footer={null}
            zIndex={1400}
            onCancel={() => {
              setState({ previewOpen: false });
            }}
          >
            <img alt="图片" style={{ width: '100%' }} src={previewImage} />
          </Modal>
        </div>
        {fileList.length === 0 && (
          <div className="editor-picture-description">支持 JPG、JPEG、PNG 等格式</div>
        )}
      </>
    );
  };

  return (
    <Modal
      title="上传图片"
      wrapClassName={fileList.length === 0 ? 'editor-picture-wrapper-empty' : ''}
      open={open}
      onOk={handleOk}
      okButtonProps={{ loading, disabled: fileList.length === 0 }}
      onCancel={handleCancel}
      bodyStyle={{ height: 300 }}
      zIndex={1300}
    >
      {renderAddImage()}
    </Modal>
  );
};
export default Picture;
