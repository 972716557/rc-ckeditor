import React, { useState } from 'react';
import { Form, InputNumber, Modal, Tooltip } from 'antd';
import { RichUtils, EditorState, Modifier } from 'draft-js';
import { getSelectedBlocksType } from 'draftjs-utils';
import classNames from 'classnames';
import generateRandomKey from 'draft-js/lib/generateRandomKey.js';
import { Map } from 'immutable';

import { shouldInsertNewLine } from '../utils';
import { BlockProps } from './interface';
import '../index.less';

const prefixCls = 'community-rich-editor';
const configMap = {
  ol: 'ordered-list-item',
  ul: 'unordered-list-item',
  blockquote: 'blockquote',
  divider: 'divider',
  table: 'table',
  code: 'code',
};

const Block: React.FC<BlockProps> = (props) => {
  const { onChange, editorState, showTooltip, type, tooltip, icon } = props;
  const internalType = configMap[type];
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  // 点击按钮
  const clickBtn = (e: React.MouseEvent, _type: string) => {
    let newState;
    const selection = editorState.getSelection();
    const key = selection.getAnchorKey();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(key);
    const blockType = block.getType();
    switch (_type) {
      case 'code':
        newState = RichUtils.toggleCode(editorState);
        if (blockType !== 'code-block') {
          const tempContentState = Modifier.splitBlock(
            newState.getCurrentContent(),
            newState.getSelection(),
          );
          newState = EditorState.push(newState, tempContentState, 'split-block');
          newState = RichUtils.toggleCode(newState);
        }
        break;
      case 'divider':
        newState = editorState;
        let contentState = newState.getCurrentContent();
        //如果当前行不是空行，就新增一行
        if (newState.getSelection().getAnchorOffset() !== 0) {
          contentState = Modifier.splitBlock(newState.getCurrentContent(), newState.getSelection());
          newState = EditorState.push(newState, contentState, 'split-block');
        }
        contentState = Modifier.setBlockType(contentState, newState.getSelection(), 'divider');
        // 如果新增的分割线下面一行需要新增行
        if (shouldInsertNewLine(newState)) {
          contentState = Modifier.splitBlock(contentState, newState.getSelection());
          contentState = Modifier.setBlockType(
            contentState,
            contentState.getSelectionAfter(),
            'unstyled',
          );
        }
        newState = EditorState.push(editorState, contentState, 'split-block');
        break;
      case 'table':
        setVisible(true);
        break;
      default:
        newState = RichUtils.toggleBlockType(editorState, _type);
        break;
    }
    if (newState) {
      onChange(newState);
    }
  };

  const currentContentBlock = getSelectedBlocksType(editorState);

  const onCancel = () => {
    form.resetFields();
    setVisible(false);
  };

  const onAddTable = () => {
    form.validateFields().then((values) => {
      const { row, column } = values;

      let newState = editorState;
      let contentState = newState.getCurrentContent();
      if (newState.getSelection().getAnchorOffset() !== 0) {
        contentState = Modifier.splitBlock(newState.getCurrentContent(), newState.getSelection());
        newState = EditorState.push(newState, contentState, 'split-block');
      }
      contentState = Modifier.setBlockType(contentState, newState.getSelection(), 'table');
      const obj: Record<string, any> = {};
      const tempColumn = new Array(column).fill(0).map((item, index) => {
        const key = generateRandomKey();
        obj[key] = '';
        return { title: key, key, dataIndex: key, width: 200 };
      });
      const tempDataSource = new Array(row)
        .fill(obj)
        .map((item) => ({ id: generateRandomKey(), ...item }));
      const map = { Map }.Map({
        dataSource: tempDataSource,
        columns: tempColumn,
        id: generateRandomKey(),
      });
      contentState = Modifier.setBlockData(contentState, newState.getSelection(), map);
      newState = EditorState.push(newState, contentState, 'insert-fragment');
      if (shouldInsertNewLine(newState)) {
        contentState = Modifier.splitBlock(contentState, newState.getSelection());
        newState = EditorState.push(newState, contentState, 'split-block');
        newState = EditorState.forceSelection(newState, contentState.getSelectionAfter());
        contentState = Modifier.setBlockType(contentState, newState.getSelection(), 'unstyled');
      }
      newState = EditorState.push(editorState, contentState, 'split-block');
      onChange(newState);
      onCancel();
    });
  };

  const getClassName = (_type: string) =>
    classNames(
      `${prefixCls}-toolbar-item`,
      currentContentBlock === _type && `${prefixCls}-toolbar-item-active`,
    );

  return (
    <div style={{ display: 'inline-block' }}>
      <span
        key={internalType}
        onMouseDown={(e) => {
          clickBtn(e, internalType);
        }}
      >
        <Tooltip
          title={showTooltip ? tooltip : ''}
          getPopupContainer={(triggerNode) => {
            return triggerNode.parentElement?.parentElement || triggerNode;
          }}
        >
          <span className={getClassName(internalType)}>{icon}</span>
        </Tooltip>
      </span>
      <Modal title="插入表格" open={visible} onOk={onAddTable} onCancel={onCancel}>
        <Form form={form}>
          <Form.Item label="" name="row" required>
            <InputNumber
              addonBefore={<i className="iconfont icon-nav-user" />}
              style={{ width: '100%' }}
              max={50}
              min={1}
              placeholder="输入表格行数（最大50行）"
            />
          </Form.Item>
          <Form.Item label="" name="column" required>
            <InputNumber
              max={4}
              min={1}
              style={{ width: '100%' }}
              addonBefore={<i className="iconfont icon-nav-user" />}
              placeholder="输入表格列数（最大4列）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Block;
