import { EditorState } from 'draft-js';
import { DefaultControlProps } from '../interface';

export interface InlineProps extends DefaultControlProps {
  editorState: EditorState;
  onChange(editorState: EditorState): void;
  type: 'bold' | 'italic' | 'underline' | 'del';
  tooltip?: string | React.ReactDOM | React.ReactElement;
  icon?: string | React.ReactDOM | React.ReactElement;
  showTooltip?: boolean;
}
