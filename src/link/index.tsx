import React from 'react';
import { Tooltip } from 'antd';
import { useSetState } from 'ahooks';
import { LinkOutlined } from '@ant-design/icons';

import EditDrawer from './edit-drawer';
import { LinkProps, LinkState, SaveType } from './interface';

const prefixCls = 'community-rich-editor';
const Link: React.FC<LinkProps> = (props) => {
  const { editor, text } = props;
  const [{ visible }, setState] = useSetState<LinkState>({
    visible: false,
  });

  const handleOk = (data: SaveType) => {
    if (!editor) return;
    editor.model.change((writer) => {
      const linkedText = writer.createText(data.title, { linkHref: data.url });
      editor.model.insertContent(linkedText, editor.model.document.selection);
    });
    setState({ visible: false });
  };

  // 点击取消按钮
  const onCancel = () => {
    setState({ visible: false });
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <Tooltip
        title="插入链接"
        getPopupContainer={(triggerNode) => {
          return triggerNode.parentElement?.parentElement || triggerNode;
        }}
      >
        <span
          className={`${prefixCls}-toolbar-item`}
          onClick={() => {
            setState({ visible: true });
          }}
        >
          <LinkOutlined />
        </span>
      </Tooltip>
      <EditDrawer initialTitle={text} visible={visible} onOk={handleOk} onCancel={onCancel} />
    </div>
  );
};

export default Link;
