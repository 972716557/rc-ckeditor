import { EditorState } from 'draft-js';
import { CSSProperties } from 'react';
import { LinkType } from '../link/interface';

export interface EditPopoverProps {
  editorState: EditorState;
  onChange: (editorState: EditorState) => void;
}

export interface DataType {
  style?: CSSProperties;
  url?: string;
  title?: string;
  type?: LinkType;
  width?: string | number;
  id?: string;
}
export interface SelectionStateType {
  entityKey?: string;
  data: DataType;
  blockType?: string;
}
