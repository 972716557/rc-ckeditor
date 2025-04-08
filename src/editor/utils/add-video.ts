import { AtomicBlockUtils, EditorState, Modifier, RichUtils, SelectionState } from 'draft-js';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';
import { getNextSelection, shouldInsertNewLine } from '.';

export default function addVideo(editorState: EditorState, { src }: { src: string }): EditorState {
  if (RichUtils.getCurrentBlockType(editorState) === 'atomic') {
    return editorState;
  }
  let newEditorState = editorState;
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity('VIDEO', 'IMMUTABLE', { src });
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
}
function removeVideoWhenUploadFailure(newEditorState: EditorState) {
  let nextContentState = newEditorState.getCurrentContent();
  const selectionKey = newEditorState.getSelection().getAnchorKey();
  const block = newEditorState.getCurrentContent().getBlockBefore(selectionKey);
  if (block) {
    const blockKey = block?.getKey();
    nextContentState = Modifier.removeRange(
      newEditorState.getCurrentContent(),
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
    newEditorState = EditorState.push(newEditorState, nextContentState, 'remove-range');
  }
  return newEditorState;
}

export { removeVideoWhenUploadFailure };
