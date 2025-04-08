import { EditorState, AtomicBlockUtils, SelectionState, Modifier } from 'draft-js';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';

import { FileItem } from 'types';
import { getNextSelection, shouldInsertNewLine } from '.';

const addImage = (editorState: EditorState, extraData: FileItem): EditorState => {
  let newEditorState = editorState;
  const contentState = editorState.getCurrentContent();
  const data = {
    src: extraData.fileUrl,
    width: 'auto',
    height: 'auto',
    name: extraData.fileName,
  };
  const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', data);
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  newEditorState = AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ');
  if (!shouldInsertNewLine(newEditorState)) {
    newEditorState = keyCommandPlainBackspace(newEditorState);
    let selection = getNextSelection(newEditorState);
    newEditorState = EditorState.push(
      newEditorState,
      newEditorState.getCurrentContent(),
      'insert-characters',
    );
    newEditorState = EditorState.forceSelection(newEditorState, selection);
  }
  return newEditorState;
};

const removeImage = (editorState: EditorState) => {
  const selection = editorState.getSelection();
  const selectionKey = selection.getAnchorKey();
  const block = editorState.getCurrentContent().getBlockForKey(selectionKey);
  let nextContentState, nextEditorState;
  const blockKey = block.getKey();

  nextContentState = Modifier.removeRange(
    editorState.getCurrentContent(),
    new SelectionState({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: block.getLength(),
    }),
    'backward',
  );

  nextContentState = Modifier.setBlockType(
    nextContentState,
    nextContentState.getSelectionAfter(),
    'unstyled',
  );
  nextEditorState = EditorState.push(editorState, nextContentState, 'remove-range');
  return EditorState.forceSelection(nextEditorState, nextContentState.getSelectionAfter());
};

export default addImage;
export { removeImage };
