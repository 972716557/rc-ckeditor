import React, { FC } from 'react';
import { Dropdown, Menu } from 'antd';
import { EditorState } from 'draft-js';
import { setBlockData } from 'draftjs-utils';

import { AlignProps } from './interface';
import styles from './index.less';

const MenuItem = Menu.Item;

const prefixCls = 'community-rich-editor';
const menus = [
  { key: 'left', icon: <i className="iconfont icon-duiqi-zuo" />, label: '左对齐' },
  { key: 'center', icon: <i className="iconfont icon-duiqi-zhong" />, label: '居中对齐' },
  { key: 'right', icon: <i className="iconfont icon-duiqi-you" />, label: '右对齐' },
];

const Align: FC<AlignProps> = (props) => {
  const { onChange, editorState, textAlignment } = props;

  const getCurrentAlignmentData = () => {
    const selection = editorState.getSelection();
    const selectionKey = selection.getAnchorKey();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selectionKey);
    const blockData = block.getData().toJS();
    const selectionTextAlign: string = blockData.textAlign;
    const currentAlignment = selectionTextAlign || textAlignment;

    const currentData = menus.find((item) => item.key === currentAlignment) || menus[0];
    return currentData;
  };

  // 点击菜单
  const clickMenu = (e: { key: string }) => {
    const { key } = e;
    let newEditorState = editorState;
    const selectionState = newEditorState.getSelection();
    const contentState = newEditorState.getCurrentContent();
    const selectionBlock = contentState.getBlockForKey(selectionState.getAnchorKey());
    const blockData = selectionBlock.getData().toJS();
    const newBlockData = Object.assign({}, blockData, { textAlign: key });
    Object.keys(newBlockData).forEach((tempKey) => {
      if (newBlockData.hasOwnProperty(tempKey) && newBlockData[tempKey] === undefined) {
        delete newBlockData[tempKey];
      }
    });

    let newState = setBlockData(newEditorState, newBlockData);
    newState = EditorState.acceptSelection(newState, editorState.getSelection());
    onChange(newState, key);
  };

  // 渲染菜单
  const renderMenu = () => {
    return (
      <Menu onClick={clickMenu} style={{ overflow: 'auto' }}>
        {menus.map(({ key, icon, label }) => (
          <MenuItem
            key={key}
            className={getCurrentAlignmentData().key === key ? styles.active : ''}
          >
            {icon}
            <span style={{ marginLeft: 20 }}>{label}</span>
          </MenuItem>
        ))}
      </Menu>
    );
  };

  return (
    <Dropdown
      overlay={renderMenu()}
      trigger={['click']}
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span className={`${prefixCls}-toolbar-item ${prefixCls}-toolbar-item-active`}>
        {getCurrentAlignmentData().icon}
      </span>
    </Dropdown>
  );
};
export default Align;
