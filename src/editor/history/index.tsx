import React from 'react';
import { Tooltip } from 'antd';
import { EditorState, Modifier } from 'draft-js';
import { getSelectionCustomInlineStyle } from 'draftjs-utils';
import { forEach } from 'lodash';

import { HistoryProps } from './interface';
import '../index.less';

const prefixCls = 'community-rich-editor';

const remove: Function = (editorState: EditorState) => {
  let contentState = editorState.getCurrentContent();
  ['BOLD', 'ITALIC', 'UNDERLINE', 'STRIKETHROUGH', 'MONOSPACE', 'SUPERSCRIPT', 'SUBSCRIPT'].forEach(
    (style) => {
      contentState = Modifier.removeInlineStyle(contentState, editorState.getSelection(), style);
    },
  );
  const customStyles = getSelectionCustomInlineStyle(editorState, [
    'FONTSIZE',
    'FONTFAMILY',
    'COLOR',
    'BGCOLOR',
  ]);

  forEach(customStyles, (key: string, value: string) => {
    if (value) {
      contentState = Modifier.removeInlineStyle(contentState, editorState.getSelection(), value);
    }
  });

  return EditorState.push(editorState, contentState, 'change-inline-style');
};

const History: React.FC<HistoryProps> = (props) => {
  const { onChange, editorState, type, icon, tooltip, showTooltip } = props;

  // 点击按钮
  const clickBtn = (e: React.MouseEvent, _type: string) => {
    // 阻止点击按钮后editor失去了焦点，而且按钮的事件必须是onMouseDown，onClick调用该方法editor还是会失去焦点
    e.preventDefault();
    let newState;
    switch (_type) {
      case 'redo':
        newState = EditorState.redo(editorState);
        break;
      case 'undo':
        newState = EditorState.undo(editorState);
        break;
      case 'clear':
        newState = remove(editorState);
        break;
    }
    if (newState) {
      onChange(newState);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <span
        key={type}
        className={`${prefixCls}-toolbar-item ${
          ((editorState?.getUndoStack()?.size === 0 && type === 'undo') ||
            (editorState.getRedoStack().size === 0 && type === 'redo') ||
            (editorState.getSelection()?.isCollapsed() && type === 'clear')) &&
          `${prefixCls}-toolbar-item-disabled`
        } `}
      >
        <Tooltip
          title={showTooltip && tooltip}
          getPopupContainer={(triggerNode) => {
            return triggerNode.parentElement?.parentElement || triggerNode;
          }}
        >
          <span>
            <span
              onMouseDown={(e) => {
                clickBtn(e, type);
              }}
            >
              {icon}
            </span>
          </span>
        </Tooltip>
      </span>
    </div>
  );
};

export default History;
