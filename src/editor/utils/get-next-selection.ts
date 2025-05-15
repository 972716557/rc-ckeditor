import { EditorState, SelectionState } from 'draft-js';

const getNextSelection = (editorState: EditorState) => {
  const blockKey = editorState.getSelection().getAnchorKey();
  const contentState = editorState.getCurrentContent();
  const afterKey = contentState.getKeyAfter(blockKey);
  return getSelectionForKey(afterKey);
};

const getSelectionForKey = (key: string) => {
  const selection = new SelectionState({
    anchorKey: key,
    anchorOffset: 0,
    focusKey: key,
    focusOffset: 0,
    hasFocus: true,
  });
  return selection;
};

export default getNextSelection;
export { getSelectionForKey };
