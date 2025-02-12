import { Dropdown, Menu } from 'antd';

import { FontSizeProps } from './interface';

const prefixCls = 'community-rich-editor';
const MenuItem = Menu.Item;

// 字体大小
const fontSize = [15, 16, 18, 20, 24, 30];

const FontSize = (props: FontSizeProps) => {
  const { editor, fontSize: size } = props;

  // 点击菜单
  const clickMenu = (e: { key: string | number }) => {
    editor.execute('fontSize', { value: e.key + 'px' });
  };

  return (
    <Dropdown
      overlay={
        <Menu onClick={clickMenu} style={{ minHeight: 200, overflow: 'auto' }}>
          {fontSize.map((value) => (
            <MenuItem key={value}>{value + 'px'}</MenuItem>
          ))}
        </Menu>
      }
      trigger={['hover']}
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span className={`${prefixCls}-toolbar-item ${prefixCls}-toolbar-item-active`}>
        {size + 'px'}
      </span>
    </Dropdown>
  );
};

export default FontSize;
