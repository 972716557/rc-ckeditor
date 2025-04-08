import { EditorState, Modifier } from 'draft-js';
import { getEntityRange, getSelectionEntity } from 'draftjs-utils';

import { SaveType } from '../link/interface';

const addLink = (editorState: EditorState, data: SaveType) => {
  const { url, title } = data;
  let selection = editorState.getSelection();
  const entity = getSelectionEntity(editorState);

  if (entity) {
    const entityRange = getEntityRange(editorState, entity);
    selection = selection.merge({
      anchorOffset: entityRange.start,
      focusOffset: entityRange.end,
    });
  }
  const entityKey = editorState
    .getCurrentContent()
    .createEntity('LINK', 'MUTABLE', {
      url,
      target: '_blank',
      title,
    })
    .getLastCreatedEntityKey();

  let contentState = Modifier.replaceText(
    editorState.getCurrentContent(),
    selection,
    `${title}`,
    editorState.getCurrentInlineStyle(),
    entityKey,
  );
  const newEditorState = EditorState.push(editorState, contentState, 'insert-characters');

  return newEditorState;
};
export default addLink;
