import { EditorState } from 'draft-js';
import { DefaultControlProps } from '../interface';

export interface HistoryProps extends DefaultControlProps {
  editorState: EditorState;
  onChange(editorState: EditorState): void;
  type: 'undo' | 'redo' | 'clear';
  tooltip?: string | React.ReactDOM | React.ReactElement;
  showTooltip?: boolean;
  icon?: string | React.ReactDOM | React.ReactElement;
}
