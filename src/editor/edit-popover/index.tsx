import { FC, useState, useRef, useEffect } from 'react';
import { EditorState, Modifier, RichUtils } from 'draft-js';
import { Divider } from 'antd';
import { DisconnectOutlined, EditOutlined } from '@ant-design/icons';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';

import EditDrawer from '../link/edit-drawer';
import { getSelection, getSelectionData } from './utils';
import { changeBlockData, getNextSelection } from '../utils';

import { EditPopoverProps } from './interface';
import { SaveType, LinkType } from '../link/interface';
import styles from './index.less';

const getRelativeParent = (element: Element | null): Element | null => {
  if (!element) {
    return null;
  }

  const position = window.getComputedStyle(element).getPropertyValue('position');
  if (position !== 'static') {
    return element;
  }

  return getRelativeParent(element?.parentElement);
};

// 总共3种情况： 链接 图片 链接卡片  展示
const EditPopover: FC<EditPopoverProps> = (props) => {
  const { editorState, onChange } = props;
  const selectionId = editorState.getSelection().getAnchorKey();
  const { entityKey, data, blockType } = getSelectionData(editorState);
  const { url, title } = data;
  const isImage = blockType === 'atomic';
  const domId = (isImage ? selectionId : entityKey) || data.id;
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isLinkCard = blockType === LinkType.LinkCard;

  const [position, setPosition] = useState({});
  const [visible, setVisible] = useState(false);

  const calculatePosition = () => {
    if (!toolbarRef?.current) {
      return;
    }
    const relativeParent = getRelativeParent(toolbarRef.current?.parentElement);
    const relativeRect = relativeParent
      ? relativeParent.getBoundingClientRect()
      : window.document.body.getBoundingClientRect();
    if (!domId) {
      setPosition({ left: '-100vw', top: '-100vh' });
      return;
    }

    //获取当前选中项坐标
    setTimeout(() => {
      const currentDom = document.getElementById(domId);
      const selectionRect = currentDom?.getBoundingClientRect();
      if (!selectionRect) return;
      const float = () => {
        const tempPosition: { [key: string]: string | number } = {};
        const width = toolbarRef?.current?.scrollWidth || 0;
        const now = selectionRect.left - relativeRect.left;
        tempPosition.left = now + selectionRect.width / 2 - width / 2;
        return tempPosition;
      };

      const top = () => {
        const now = selectionRect.bottom - relativeRect.top;
        return now + 10;
      };

      const newPosition = () => {
        let tempNewPosition: { [key: string]: string | number } = {};
        tempNewPosition = float();
        tempNewPosition.top = top();
        return tempNewPosition;
      };
      setPosition(newPosition);
    });
  };

  useEffect(() => {
    calculatePosition();
  }, [editorState]);

  const removeLink = (): void => {
    if (isLinkCard) {
      let contentState = editorState.getCurrentContent();
      contentState = Modifier.setBlockType(contentState, editorState.getSelection(), 'unstyled');
      contentState = Modifier.insertText(contentState, contentState.getSelectionAfter(), title!);
      let newEditorState = EditorState.push(editorState, contentState, 'change-block-type');
      const _selection = getNextSelection(newEditorState);
      newEditorState = EditorState.forceSelection(newEditorState, _selection);
      newEditorState = keyCommandPlainBackspace(newEditorState);
      newEditorState = EditorState.push(
        editorState,
        newEditorState.getCurrentContent(),
        'change-block-type',
      );
      onChange(newEditorState);
      return;
    }
    const selection = getSelection(editorState);
    if (selection) {
      onChange(RichUtils.toggleLink(editorState, selection, null));
    }
  };

  const onVisit = () => {
    const a = document.createElement('a');
    a.href = url!;
    a.target = '_blank';
    a.click();
  };

  const onOk = (_data: SaveType) => {
    const { url: _url, title: _title } = _data;
    const selection = getSelection(editorState);

    if (isLinkCard) {
      const newState = changeBlockData(editorState, { url: _url, title: _title });
      onChange(newState);
      return;
    }
    if (selection && entityKey) {
      const contentState = Modifier.replaceText(
        editorState.getCurrentContent(),
        selection,
        _title,
        editorState.getCurrentInlineStyle(),
        entityKey,
      );
      contentState.mergeEntityData(entityKey, { url: _url });
      onChange(EditorState.push(editorState, contentState, 'insert-characters'));
    }
    setVisible(false);
  };

  const onEdit = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    setVisible(true);
    setPosition({ left: '-100vw', top: '-100vh' });
  };

  // TODO:暂时注释卡片功能  const toggleType = (checked: boolean) => {
  // TODO: onChange(toggleLinkType(editorState, checked));
  // TODO: };

  return data?.url || isLinkCard ? (
    <div className={styles.toolbar} style={position} ref={toolbarRef}>
      <span onClick={onVisit}>访问链接</span>
      <Divider type="vertical" />
      <span onClick={onEdit}>
        <EditOutlined /> 编辑链接
      </span>
      <Divider type="vertical" />
      <span onClick={removeLink}>
        <DisconnectOutlined /> 取消链接
      </span>
      {/*TODO 暂时注释展示卡片，后续可能需要
      <Divider type="vertical" />
      <span>
        展示为卡片
        <Switch
          size="small"
          checked={blockType === LinkType.LinkCard}
          onClick={toggleType}
        ></Switch>
      </span> */}
      <EditDrawer
        visible={visible}
        onOk={onOk}
        initialTitle={title}
        initialUrl={url}
        onCancel={() => {
          setVisible(false);
        }}
      />
    </div>
  ) : (
    <></>
  );
};

export default EditPopover;
