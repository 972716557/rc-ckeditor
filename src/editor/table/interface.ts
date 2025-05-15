import { ContentState, EditorState } from 'draft-js';

export interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: string;
  record: Record<string, string | number>;
  handleSave: (data: Record<string, string | number>[]) => void;
  data: DataType[];
  onChangeData: (data: DataType[]) => void;
  columns: Record<string, string | number>[];
  onChangeColumns: (columns: Record<string, string | number>[]) => void;
  onFocus: (index: number, dataIndex: string) => void;
}

export interface DataType extends Record<string, string | number> {}
export interface TableProps {
  blockProps: {
    onChange: (editorState: EditorState) => void;
    editorState: EditorState;
    columns: Record<string, string | number>[];
    dataSource: DataType[];
    onStartEdit: () => void;
    onFinishEdit: (content: ContentState, state: EditorState) => void;
    blockKey: string;
  };
}
