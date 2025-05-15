import { EditorState, Modifier, ContentState } from 'draft-js';
import { Map } from 'immutable';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';
import getNextSelection from './get-next-selection';

/**
 * @param oldEditorState 当前状态
 * @param data 需要修改的data
 * @param customContent  自定义contentState
 * @param isDeletePlainLine 是否需要将当前空行删除一次，减少回撤
 * @returns
 */

function changeBlockData(
  oldEditorState: EditorState,
  data: Object,
  customContent?: ContentState,
  isDeletePlainLine?: boolean,
): EditorState {
  let newEditorState = oldEditorState;
  const map = Map(data);
  let contentState = customContent || newEditorState?.getCurrentContent();
  contentState = Modifier.mergeBlockData(contentState, oldEditorState.getSelection(), map);
  newEditorState = EditorState.push(oldEditorState, contentState, 'change-block-data');
  if (isDeletePlainLine) {
    newEditorState = keyCommandPlainBackspace(newEditorState);
    const selection = getNextSelection(newEditorState);
    newEditorState = EditorState.forceSelection(newEditorState, selection);
    newEditorState = keyCommandPlainBackspace(newEditorState);
    newEditorState = EditorState.push(
      oldEditorState,
      newEditorState.getCurrentContent(),
      'change-block-data',
    );
  }
  return newEditorState;
}

export default changeBlockData;
