import React from 'react';
import { RichUtils } from 'draft-js';
import { Menu, Dropdown, MenuProps } from 'antd';

import { TitleProps } from './interface';
import '../index.less';

const MenuItem = Menu.Item;
const prefixCls = 'community-rich-editor';
const fontSize = [
  { label: '正文', style: 'unstyled' },
  { label: '标题1', style: 'header-one' },
  { label: '标题2', style: 'header-two' },
];

const FontSize: React.FC<TitleProps> = (props) => {
  const { onChange, editorState } = props;

  // 点击菜单
  const clickMenu: MenuProps['onClick'] = (e) => {
    const newEditState = RichUtils.toggleBlockType(editorState, e.key);
    onChange(newEditState);
  };

  // 得到当前块样式的label
  const getCurrentBlockLabel = () => {
    const selection = editorState.getSelection();
    const blockStyle = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      ?.getType();
    let blockLabel = '正文';
    fontSize.forEach((blockType) => {
      if (blockType.style === blockStyle) {
        blockLabel = blockType.label;
      }
    });
    return blockLabel;
  };

  // 渲染菜单
  const renderMenu = () => {
    return (
      <Menu onClick={clickMenu} className={`${prefixCls}-menu`}>
        <MenuItem key="unstyled">正文</MenuItem>
        <MenuItem key="header-one">
          <h1>标题1</h1>
        </MenuItem>
        <MenuItem key="header-two">
          <h2>标题2</h2>
        </MenuItem>
      </Menu>
    );
  };

  return (
    <Dropdown
      overlay={renderMenu()}
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span className={`${prefixCls}-toolbar-item ${prefixCls}-toolbar-item-active`}>
        {getCurrentBlockLabel()}
      </span>
    </Dropdown>
  );
};
export default FontSize;
