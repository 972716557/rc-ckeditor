import { EditorState } from 'draft-js';
import { DefaultControlProps } from '../interface';

export interface TitleProps extends DefaultControlProps {
  editorState: EditorState;
  onChange(editorState: EditorState): void;
}
