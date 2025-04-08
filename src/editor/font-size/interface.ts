import { EditorState } from 'draft-js';
import { DefaultControlProps } from '../interface';

export interface FontSizeProps extends DefaultControlProps {
  editorState: EditorState;
  onChange(editorState: EditorState): void;
}
