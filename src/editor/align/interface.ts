import { EditorState } from 'draft-js';
import { DefaultControlProps } from '../interface';

export interface AlignProps extends DefaultControlProps {
  editorState: EditorState;
  onChange(editorState: EditorState, key: string): void;
  textAlignment: string;
}
