import { EditorState } from 'draft-js';
import { FileItem } from 'types';
import addImage from './add-image';

const pastedFiles = (
  url: FileItem[],
  editorState: EditorState,
  onChange: (state: EditorState) => void,
) => {
  let newEditorState = editorState;
  url.forEach((item: FileItem) => {
    newEditorState = addImage(newEditorState, item);
  });
  onChange(newEditorState);
};

export default pastedFiles;
