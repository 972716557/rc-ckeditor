import React from 'react';
import { Menu, Dropdown, MenuProps } from 'antd';

import { TitleProps } from './interface';

const MenuItem = Menu.Item;
const prefixCls = 'community-rich-editor';
const fontSize = [
  { label: '正文', style: 'paragraph' },
  { label: '标题1', style: 'heading1' },
  { label: '标题2', style: 'heading2' },
];

const FontSize: React.FC<TitleProps> = (props) => {
  const { editor, title } = props;
  const clickMenu: MenuProps['onClick'] = (e) => {
    if (e.key === 'paragraph') {
      editor?.execute('paragraph');
      return;
    }
    editor?.execute('heading', { value: e.key });
  };

  return (
    <Dropdown
      overlay={
        <Menu onClick={clickMenu} className={`${prefixCls}-menu`}>
          <MenuItem key="unstyled">正文</MenuItem>
          <MenuItem key="heading1">
            <h1>标题1</h1>
          </MenuItem>
          <MenuItem key="heading2">
            <h2>标题2</h2>
          </MenuItem>
        </Menu>
      }
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span className={`${prefixCls}-toolbar-item ${prefixCls}-toolbar-item-active`}>
        {fontSize.find((item) => item.style === title)?.label ?? '正文'}
      </span>
    </Dropdown>
  );
};
export default FontSize;
