import { EditorState } from 'draft-js';

export interface BlockProps {
  onChange: (editorState: EditorState) => void;
  editorState: EditorState;
  type: 'code' | 'blockquote' | 'ul' | 'ol' | 'divider' | 'table';
  tooltip?: string | React.ReactDOM | React.ReactElement;
  showTooltip?: boolean;
  icon?: string | React.ReactDOM | React.ReactElement;
}
