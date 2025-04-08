import * as React from 'react';
import classNames from 'classnames';
import { Tooltip } from 'antd';
import { RichUtils } from 'draft-js';

import { InlineProps } from './interface';
import '../index.less';

const prefixCls = 'community-rich-editor';

const configMap = { bold: 'BOLD', italic: 'ITALIC', underline: 'UNDERLINE', del: 'STRIKETHROUGH' };
const Inline: React.FC<InlineProps> = (props) => {
  const { onChange, editorState, showTooltip, type, tooltip, icon } = props;
  const internalType = configMap[type];

  const clickBtn = (e: React.MouseEvent, style: string) => {
    // 阻止点击按钮后editor失去了焦点，而且按钮的事件必须是onMouseDown，onClick调用该方法editor还是会失去焦点
    e.preventDefault();
    const newEditState = RichUtils.toggleInlineStyle(editorState, style);
    onChange(newEditState);
  };

  const currentStyle = editorState?.getCurrentInlineStyle();

  return (
    <div style={{ display: 'inline-block' }}>
      <span
        key={internalType}
        onMouseDown={(e) => {
          clickBtn(e, internalType);
        }}
      >
        <Tooltip
          title={showTooltip && tooltip}
          getPopupContainer={(triggerNode) => {
            return triggerNode.parentElement?.parentElement || triggerNode;
          }}
        >
          <span
            className={
              currentStyle?.has(internalType)
                ? classNames(`${prefixCls}-toolbar-item ${prefixCls}-toolbar-item-active`)
                : classNames(`${prefixCls}-toolbar-item`)
            }
          >
            {icon}
          </span>
        </Tooltip>
      </span>
    </div>
  );
};

export default Inline;
