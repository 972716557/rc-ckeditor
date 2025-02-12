import { FC } from "react";
import { Popover } from "antd";
import { FontColorsOutlined } from "@ant-design/icons";
import { SketchPicker } from "react-color";

import { Props } from "./interface";

import { DEFAULT_COLOR } from "../constant";
const prefixCls = "community-rich-editor";

const Color: FC<Props> = (props) => {
  const { editor, color } = props;

  // 颜色选择器选择的颜色改变，draft.js不支持更改文字透明度
  const handleChangeComplete = (tempColor: {
    rgb: { r: string; g: string; b: string };
  }) => {
    const newTextColor = `rgb(${tempColor.rgb.r}, ${tempColor.rgb.g}, ${tempColor.rgb.b})`;
    editor.execute("fontColor", { value: newTextColor });
  };

  // 渲染颜色选择器
  const renderColorPicker = () => {
    return (
      <SketchPicker
        color={color}
        onChangeComplete={handleChangeComplete}
        presetColors={[
          DEFAULT_COLOR,
          ...SketchPicker.defaultProps.presetColors,
        ]}
      />
    );
  };

  return (
    <Popover
      content={renderColorPicker()}
      overlayClassName={"popover"}
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span>
        <span className={`${prefixCls}-toolbar-item ${"color"}`}>
          <span style={{ color }}>
            <FontColorsOutlined />
          </span>
        </span>
      </span>
    </Popover>
  );
};
export default Color;
