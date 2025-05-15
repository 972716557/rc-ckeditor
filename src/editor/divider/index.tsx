import { CloseOutlined } from '@ant-design/icons';
import { EditorState, RichUtils } from 'draft-js';
import keyCommandPlainBackspace from 'draft-js/lib/keyCommandPlainBackspace.js';

import styles from './index.less';

interface DividerProps {
  blockProps?: {
    onChange?: (editorState: EditorState) => void;
    editorState?: EditorState;
  };
  readOnly?: boolean;
}

const Divider = (props: DividerProps) => {
  const { readOnly, blockProps = {} } = props;

  const onClick = () => {
    const { editorState, onChange } = blockProps;
    if (onChange && editorState) {
      let newState = RichUtils.onBackspace(editorState) as EditorState;
      newState = keyCommandPlainBackspace(newState);
      newState = EditorState.push(editorState, newState.getCurrentContent(), 'remove-range');
      onChange(newState);
    }
  };

  return (
    <div className={`${styles.divider} ${!readOnly ? styles.editable : ''}`}>
      {!readOnly && (
        <div className={styles.closed} onClick={onClick}>
          <CloseOutlined />
        </div>
      )}
      <hr />
    </div>
  );
};

export default Divider;
