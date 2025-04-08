import { ContentState, CompositeDecorator, EditorState, SelectionState } from 'draft-js';

const addTable = (
  contentState: ContentState,
  editorState: EditorState,
  decorator: CompositeDecorator,
) => {
  const firstKey = contentState.getBlockMap().first().getKey();
  const undoStack = editorState.getUndoStack().push(contentState);
  const newState = EditorState.create({
    currentContent: contentState,
    undoStack,
    redoStack: editorState.getRedoStack(),
    decorator,
    selection: SelectionState.createEmpty(firstKey),
  });
  return newState;
};
export default addTable;
