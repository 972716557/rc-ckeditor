import React from 'react';
import { Tooltip } from 'antd';
import { useSetState } from 'ahooks';
import { LinkOutlined } from '@ant-design/icons';
import { EditorState } from 'draft-js';

import EditDrawer from './edit-drawer';
import { addLink } from '../utils';
import { LinkProps, LinkState, SaveType } from './interface';
import '../index.less';

const prefixCls = 'community-rich-editor';
const Link: React.FC<LinkProps> = (props) => {
  const { editorState, onChange, icon, tooltip, showTooltip } = props;
  const [{ visible }, setState] = useSetState<LinkState>({
    visible: false,
  });

  // 得到editorState的title
  const getBeginTitle = (state: EditorState) => {
    const selectionState = state.getSelection();
    const anchorKey = selectionState.getAnchorKey();
    const currentContent = state.getCurrentContent();
    const currentContentBlock = currentContent.getBlockForKey(anchorKey);
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const title = currentContentBlock.getText().slice(start, end);
    return title;
  };

  // 得到editorState的url
  const getBeginUrl = (state: EditorState) => {
    const selection = state.getSelection();
    let editorUrl = '';
    if (!selection.isCollapsed()) {
      const contentState = state.getCurrentContent();
      const startKey = state.getSelection().getStartKey();
      const startOffset = state.getSelection().getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

      if (linkKey) {
        const linkInstance = contentState.getEntity(linkKey);
        editorUrl = linkInstance.getData().url;
      }
    }

    return editorUrl;
  };

  const handleOk = (data: SaveType) => {
    onChange(addLink(editorState, data));
    setState({ visible: false });
  };

  // 点击取消按钮
  const onCancel = () => {
    setState({ visible: false });
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <Tooltip
        title={showTooltip && (tooltip || '插入链接')}
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
          {icon || <LinkOutlined />}
        </span>
      </Tooltip>
      <EditDrawer
        visible={visible}
        onOk={handleOk}
        onCancel={onCancel}
        initialTitle={getBeginTitle(editorState)}
        initialUrl={getBeginUrl(editorState)}
      />
    </div>
  );
};

export default Link;
