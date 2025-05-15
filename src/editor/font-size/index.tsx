import { Dropdown, Menu } from 'antd';
import { toggleCustomInlineStyle, getSelectionCustomInlineStyle } from 'draftjs-utils';

import { DEFAULT_FONT_SIZE } from '../constant';
import { FontSizeProps } from './interface';
import '../index.less';

const prefixCls = 'community-rich-editor';
const MenuItem = Menu.Item;

// 字体大小
const fontSize = [15, 16, 18, 20, 24, 30];

const FontSizeControl = (props: FontSizeProps) => {
  const { editorState, onChange } = props;

  // 点击菜单
  const clickMenu = (e: { key: string | number }) => {
    const newEditState = toggleCustomInlineStyle(editorState, 'fontSize', +e.key);
    onChange(newEditState);
  };

  // 得到当前的字体大小
  const getCurrentFontSize = () => {
    const currentFontSize: string = getSelectionCustomInlineStyle?.(editorState, [
      'FONTSIZE',
    ])?.FONTSIZE;

    return currentFontSize?.substring(9) ?? DEFAULT_FONT_SIZE;
  };

  // 渲染菜单
  const renderMenu = () => {
    return (
      <Menu onClick={clickMenu} style={{ minHeight: 200, overflow: 'auto' }}>
        {fontSize.map((value) => (
          <MenuItem key={value}>{value + 'px'}</MenuItem>
        ))}
      </Menu>
    );
  };

  return (
    <Dropdown
      overlay={renderMenu()}
      trigger={['hover']}
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span className={`${prefixCls}-toolbar-item ${prefixCls}-toolbar-item-active`}>
        {getCurrentFontSize() + 'px'}
      </span>
    </Dropdown>
  );
};

export default FontSizeControl;
