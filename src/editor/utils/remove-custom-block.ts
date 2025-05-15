import { EditorState, Modifier } from 'draft-js';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';

const removeCustomBlock = (editorState: EditorState) => {
  const content = editorState.getCurrentContent();
  const contentState = Modifier.setBlockType(content, editorState.getSelection(), 'unstyled');
  let newEditorState = EditorState.push(editorState, contentState, 'remove-range');
  newEditorState = keyCommandPlainBackspace(newEditorState);
  newEditorState = EditorState.push(
    editorState,
    newEditorState.getCurrentContent(),
    'remove-range',
  );
  return newEditorState;
};
export default removeCustomBlock;
