import { FC, useState } from 'react';
import { Popover } from 'antd';
import { toggleCustomInlineStyle, getSelectionCustomInlineStyle } from 'draftjs-utils';
import { FontColorsOutlined } from '@ant-design/icons';
import { SketchPicker } from 'react-color';

import { DEFAULT_COLOR } from '../constant';
import { Props } from './interface';

import '../index.less';
import colorStyle from './index.less';

const prefixCls = 'community-rich-editor';

const Color: FC<Props> = (props) => {
  const [color, setColor] = useState<string>('rgb(29 33 41)');

  const { onChange, editorState, icon } = props;

  // 颜色选择器选择的颜色改变，draft.js不支持更改文字透明度
  const handleChangeComplete = (tempColor: { rgb: { r: string; g: string; b: string } }) => {
    const newTextColor = `rgb(${tempColor.rgb.r}, ${tempColor.rgb.g}, ${tempColor.rgb.b})`;
    setColor(newTextColor);
    const newEditState = toggleCustomInlineStyle(editorState, 'color', newTextColor);
    onChange(newEditState);
  };

  // 得到当前的字体颜色
  const getCurrentColor = () => {
    const currentColor: string = getSelectionCustomInlineStyle?.(props.editorState, [
      'color',
    ])?.color;
    return currentColor?.substring(6) ?? DEFAULT_COLOR;
  };

  // 渲染颜色选择器
  const renderColorPicker = () => {
    return (
      <SketchPicker
        color={color}
        onChangeComplete={handleChangeComplete}
        presetColors={[DEFAULT_COLOR, ...SketchPicker.defaultProps.presetColors]}
      />
    );
  };

  return (
    <Popover
      content={renderColorPicker()}
      overlayClassName={colorStyle.popover}
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span>
        <span className={`${prefixCls}-toolbar-item ${colorStyle.color}`}>
          <span style={{ color: getCurrentColor() }}>{icon || <FontColorsOutlined />}</span>
        </span>
      </span>
    </Popover>
  );
};
export default Color;
