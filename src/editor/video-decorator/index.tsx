import React from 'react';
import { EditorPlugin } from '@draft-js-plugins/editor';
import Video from '../video';

export default function videoPlugin(): EditorPlugin {
  return {
    blockRendererFn: (block, { getEditorState, setEditorState }) => {
      if (block.getType() === 'atomic') {
        const contentState = getEditorState().getCurrentContent();
        const entityKey = block.getEntityAt(0);
        if (!entityKey) return null;
        const entity = contentState.getEntity(entityKey);
        const type = entity.getType();
        const { src } = entity.getData();
        if (type === 'VIDEO') {
          return {
            component: Video,
            editable: false,
            props: {
              src,
              getEditorState,
              setEditorState,
              entityKey,
            },
          };
        }
        return null;
      }

      return null;
    },
  };
}
