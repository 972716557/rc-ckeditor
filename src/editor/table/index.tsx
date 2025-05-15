import { Divider, Input, Space, Table, Tooltip, Form } from 'antd';
import { EditorState, Modifier } from 'draft-js';
import { Map } from 'immutable';
import { FC, useEffect, useRef, useState } from 'react';
import generateRandomKey from 'draft-js/lib/generateRandomKey.js';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';

import { getSelectionForKey } from '../utils';
import { DataType, TableProps } from './interface';
import './index.less';

const EditTable: FC<TableProps> = (props) => {
  const {
    editorState,
    columns: tempColumns = [],
    dataSource: tempDataSource = [],
    onStartEdit,
    onFinishEdit,
    blockKey,
  } = props.blockProps || {};

  const [form] = Form.useForm();
  const [columns, setColumns] = useState<Record<string, any>[]>(tempColumns);
  const [dataSource, setDataSource] = useState<Record<string, any>[]>(tempDataSource);

  const isFocusRef = useRef(false);
  const rowIndexRef = useRef<number>(0);
  const colKeyRef = useRef<string>('');
  const editorStateRef = useRef<EditorState>(editorState);
  const dataSourceRef = useRef<Record<string, any>[]>(tempDataSource);
  const columnsRef = useRef<Record<string, any>[]>(tempColumns);

  const undoStackSize = editorState?.getUndoStack?.()?.size;

  const render = (text: string, record: DataType, index: number, dataIndex: string | number) => (
    <Form.Item name={`${record.id}-${dataIndex}`} key={`${record.id}-${dataIndex}`}>
      <Input
        className="editable-input"
        key={`${record.id}-${dataIndex}`}
        bordered={false}
        onBlur={() => {
          isFocusRef.current = false;
        }}
        onFocus={() => {
          colKeyRef.current = dataIndex as unknown as string;
          rowIndexRef.current = index;
          isFocusRef.current = true;
        }}
        onChange={(e) => {
          const tempData = [...dataSourceRef.current];
          const temp = tempData[index];
          temp[dataIndex] = e.target.value;
          tempData[index] = temp;
          dataSourceRef.current = tempData;
          setDataSource(tempData);
        }}
      />
    </Form.Item>
  );

  const changeRow = (type: 'above' | 'below' | 'delete') => {
    let _dataSource = [...dataSourceRef.current];
    const obj: Record<string, any> = { id: generateRandomKey() };
    columns.forEach(({ key }) => {
      obj[key] = '';
    });
    switch (type) {
      case 'above':
        _dataSource.splice(rowIndexRef.current, 0, obj);
        rowIndexRef.current = rowIndexRef.current + 1;
        break;
      case 'below':
        _dataSource.splice(rowIndexRef.current + 1, 0, obj);
        break;
      case 'delete':
        _dataSource.splice(rowIndexRef.current, 1);
        break;
    }
    setDataSource(_dataSource);
    dataSourceRef.current = _dataSource;
    onFinish();
  };

  const changeCol = (key: string, type: 'left' | 'right' | 'delete') => {
    const _columns = [...columns];
    let _dataSource = [...dataSourceRef.current];
    const index = _columns.findIndex((item) => item.key === key);
    const dataIndex = generateRandomKey();
    switch (type) {
      case 'left':
        _columns.splice(index, 0, {
          render: (text: string, record: DataType, _index: number) =>
            render(text, record, _index, dataIndex),
          title: dataIndex,
          key: dataIndex,
          dataIndex,
          width: 200,
        });
        _dataSource = _dataSource.map((item) => ({ ...item, [dataIndex]: '' }));
        break;
      case 'right':
        _columns.splice(index + 1, 0, {
          render: (text: string, record: DataType, _index: number) =>
            render(text, record, _index, dataIndex),
          title: dataIndex,
          key: dataIndex,
          dataIndex,
          width: 200,
        });
        _dataSource = _dataSource.map((item) => ({ ...item, [dataIndex]: '' }));
        break;
      case 'delete':
        const colKey = columns[index].dataIndex;
        _columns.splice(index, 1);
        _dataSource = _dataSource.map((item) => {
          const temp = item;
          delete temp[colKey];
          return temp;
        });
        break;
    }
    setDataSource(_dataSource);
    setColumns(_columns);
    columnsRef.current = _columns;
    dataSourceRef.current = _dataSource;
    onFinish();
  };

  const deleteTable = () => {
    let newState = editorStateRef.current;
    let contentState = newState.getCurrentContent();
    const selection = getSelectionForKey(blockKey);
    contentState = Modifier.setBlockType(contentState, selection, 'unstyled');
    newState = EditorState.push(newState, contentState, 'remove-range');
    newState = keyCommandPlainBackspace(newState);
    editorStateRef.current = newState;
    onFinishEdit(newState.getCurrentContent(), newState);
  };

  const onFinish = () => {
    const map = Map({
      dataSource: dataSourceRef.current,
      columns: columnsRef.current.map(({ render: _render, ...item }) => item),
    });
    let newState = editorStateRef.current;
    let contentState = editorStateRef.current?.getCurrentContent();

    const selection = getSelectionForKey(blockKey);
    contentState = Modifier.setBlockData(contentState, selection, map);
    newState = EditorState.push(newState, contentState, 'insert-fragment');
    editorStateRef.current = newState;
    onFinishEdit(contentState, newState);
  };

  useEffect(() => {
    isFocusRef.current = false;
    editorStateRef.current = editorState;
    const temp = tempColumns.map((col) => ({
      ...col,
      render: (text: string, record: DataType, _index: number) =>
        render(text, record, _index, col.dataIndex),
    }));
    tempDataSource.forEach((item) => {
      tempColumns.forEach((colItem) => {
        form.setFieldValue(`${item.id}-${colItem.dataIndex}`, item[colItem.dataIndex]);
      });
    });
    setColumns(temp);
    columnsRef.current = temp;
    setDataSource(tempDataSource);
    dataSourceRef.current = tempDataSource;
  }, [blockKey, undoStackSize]);

  return (
    <Tooltip
      overlayClassName="editor-table-tooltip"
      placement="bottom"
      showArrow={false}
      arrowPointAtCenter
      title={
        <Space>
          <span
            onClick={() => {
              changeCol(colKeyRef.current, 'left');
            }}
          >
            <i className="iconfont icon-insertColLeft" />
          </span>
          <span
            onClick={() => {
              changeCol(colKeyRef.current, 'right');
            }}
          >
            <i className="iconfont icon-insertColRight" />
          </span>
          <span
            onClick={() => {
              changeCol(colKeyRef.current, 'delete');
            }}
          >
            <i className="iconfont icon-deleteCol" />
          </span>
          <Divider type="vertical" />
          <span
            onClick={() => {
              changeRow('above');
            }}
          >
            <i className="iconfont icon-insertRowAbove" />
          </span>
          <span
            onClick={() => {
              changeRow('below');
            }}
          >
            <i className="iconfont icon-insertRowBelow" />
          </span>
          <span
            onClick={() => {
              changeRow('delete');
            }}
          >
            <i className="iconfont icon-deleteRow" />
          </span>
          <Divider type="vertical" />
          <span onClick={deleteTable}>
            <i className="iconfont icon-deleteTable" />
          </span>
        </Space>
      }
    >
      <div
        onFocus={() => {
          onStartEdit();
        }}
        onBlur={() => {
          // input失焦并将isFocusRef修改后再延迟调用父组件onBlur，处理input获取焦点，导致父元素失焦多调用的问题
          setTimeout(() => {
            if (!isFocusRef.current) {
              onFinish();
            }
          });
        }}
        className="editor-table"
      >
        <Form form={form}>
          <Table
            showHeader={false}
            size="small"
            rowKey="id"
            bordered
            dataSource={dataSource}
            columns={columns}
            rowClassName={() => 'editable-row'}
            pagination={false}
          />
        </Form>
      </div>
    </Tooltip>
  );
};

export default EditTable;
