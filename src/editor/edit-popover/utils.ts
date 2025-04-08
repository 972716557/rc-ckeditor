import { EditorState, ContentBlock, SelectionState, Modifier } from 'draft-js';
import { getEntityRange, getSelectionEntity } from 'draftjs-utils';
import { Map } from 'immutable';

import { changeBlockData } from '../utils';
import { LinkType } from '../link/interface';
import { SelectionStateType } from './interface';

export const getCurrentBlock = (editorState: EditorState): ContentBlock => {
  const selectionState = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const block = contentState.getBlockForKey(selectionState.getStartKey());
  return block;
};

export const isShowEditorPopover = (editorState: EditorState): boolean => {
  const selection = editorState.getSelection();
  const content = editorState.getCurrentContent();
  const currentBlock = getCurrentBlock(editorState);
  if (!currentBlock) {
    return false;
  }

  if (currentBlock.getType() === 'atomic' || currentBlock.getType() === LinkType.LinkCard) {
    return true;
  }

  let entityKey = null;
  if (selection.getAnchorOffset() > 0) {
    entityKey = currentBlock.getEntityAt(selection.getAnchorOffset() - 1);
    if (entityKey !== null) {
      const entity = content.getEntity(entityKey);
      return entity.getType() === 'LINK';
    }
  }
  return false;
};

// 当鼠标没有选中文字的时候，获取当前鼠标所在位置的selection
export const getSelection = (editorState: EditorState): SelectionState | null => {
  const currentEntity = editorState ? getSelectionEntity(editorState) : undefined;
  let selection = editorState.getSelection();
  if (currentEntity) {
    const entityRange = getEntityRange(editorState, currentEntity);
    const isBackward = selection.getIsBackward();
    if (isBackward) {
      selection = selection.merge({
        anchorOffset: entityRange.end,
        focusOffset: entityRange.start,
      });
    } else {
      selection = selection.merge({
        anchorOffset: entityRange.start,
        focusOffset: entityRange.end,
      });
    }

    return selection;
  }
  return null;
};

export const getSelectionData = (editorState: EditorState): SelectionStateType => {
  if (!editorState) return { data: {} };
  const key = editorState.getSelection().getAnchorKey();
  const content = editorState.getCurrentContent();
  const block = content.getBlockForKey(key);
  const blockType = block.getType();
  const entityKey = getSelectionEntity(editorState);
  const entityData = entityKey ? content.getEntity(entityKey).getData() : {};
  const blockData = block.getData().toJS();
  const { text: title } = getEntityRange(editorState, entityKey) || {};
  const data = blockType === 'link-card' ? blockData : { ...entityData, title };
  return { data, entityKey, blockType };
};

export function toggleLinkType(editorState: EditorState, checked: boolean): EditorState {
  let selection = getSelection(editorState);
  let tempContentState = editorState.getCurrentContent();
  const { data, entityKey: id } = getSelectionData(editorState);
  let newEditorState = editorState;

  if (checked) {
    if (!selection) return editorState;

    const { url } = data;
    const { text: title } = getEntityRange(editorState, id) || {};

    tempContentState = Modifier.removeRange(tempContentState, selection, 'backward');
    newEditorState = EditorState.push(editorState, tempContentState, 'remove-range');
    tempContentState = Modifier.splitBlock(tempContentState, newEditorState.getSelection());
    tempContentState = Modifier.splitBlock(tempContentState, tempContentState.getSelectionBefore());
    newEditorState = EditorState.push(newEditorState, tempContentState, 'split-block');

    tempContentState = Modifier.setBlockType(
      tempContentState,
      newEditorState.getSelection(),
      LinkType.LinkCard,
    );
    const map = Map({ title, url, id });
    tempContentState = Modifier.setBlockData(tempContentState, newEditorState.getSelection(), map);
    newEditorState = EditorState.push(editorState, tempContentState, 'change-block-type');
    return newEditorState;
  } else {
    const { url, title } = data;
    let preSelection = newEditorState.getSelection();
    const entityKey = newEditorState
      .getCurrentContent()
      .createEntity('LINK', 'MUTABLE', {
        url,
        target: '_blank',
        title,
      })
      .getLastCreatedEntityKey();

    tempContentState = Modifier.replaceText(
      newEditorState.getCurrentContent(),
      preSelection,
      title!,
      newEditorState.getCurrentInlineStyle(),
      entityKey,
    );
    tempContentState = Modifier.setBlockType(
      tempContentState,
      newEditorState.getSelection(),
      'unstyled',
    );
    newEditorState = changeBlockData(newEditorState, {}, tempContentState, true);
    return newEditorState;
  }
}
