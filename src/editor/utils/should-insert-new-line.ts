import { EditorState } from 'draft-js';
import { BlockType } from '../interface';

const shouldInsertNewLine = (editorState: EditorState): boolean => {
  const currentKey = editorState.getSelection().getAnchorKey();
  const contentState = editorState.getCurrentContent();
  const afterBlock = contentState.getBlockAfter(currentKey);
  const afterType = afterBlock?.getType();
  const block = editorState.getCurrentContent().getBlockForKey(currentKey);
  const blockText = block?.getText();
  // 如果当前是编辑器最后一行、或当前插入行是有文字的、或下一行是图片、链接卡片、分割线，就新增一行新的为了下次编辑
  return (
    !!blockText ||
    typeof afterBlock === 'undefined' ||
    afterType === BlockType.LinkCard ||
    afterType === BlockType.Atomic ||
    afterType === BlockType.Divider
  );
};

export default shouldInsertNewLine;
