import React, { ComponentType, ReactElement } from 'react';
import { EditorPlugin } from '@draft-js-plugins/editor';
import { EditorState, ContentBlock } from 'draft-js';

import { addImage } from '../utils';
import ImageComponent, { ImageProps } from './image';
import createResizablePlugin from './resize';

export interface ImagePluginTheme {
  image?: string;
}

const defaultTheme: ImagePluginTheme = {};

export interface ImagePluginConfig {
  decorator?(component: ComponentType<ImageProps>): ComponentType<ImageProps>;
  theme?: ImagePluginTheme;
  imageComponent?: ComponentType<ImageProps>;
}

export type ImageEditorPlugin = EditorPlugin & {
  addImage: typeof addImage;
};

const createSetResizeData =
  (
    contentBlock: ContentBlock,
    {
      getEditorState,
    }: {
      getEditorState(): EditorState;
    },
  ) =>
  (data: Record<string, unknown>) => {
    const entityKey = contentBlock.getEntityAt(0);
    if (entityKey) {
      const editorState = getEditorState();
      const contentState = editorState.getCurrentContent();
      contentState.mergeEntityData(entityKey, data);
    }
  };

export default (config: ImagePluginConfig = {}): ImageEditorPlugin => {
  const theme = config.theme ? config.theme : defaultTheme;
  let ImageCom = config.imageComponent || ImageComponent;

  if (config.decorator) {
    ImageCom = config.decorator(Image);
  }
  const ThemedImage = (props: ImageProps): ReactElement => <ImageCom {...props} theme={theme} />;
  return {
    blockRendererFn: (block, { getEditorState, getEditorRef, setEditorState }) => {
      if (block.getType() === 'atomic') {
        const contentState = getEditorState().getCurrentContent();
        const entity = block.getEntityAt(0);
        if (!entity) return null;
        const type = contentState.getEntity(entity).getType();
        if (type === 'IMAGE' || type === 'image') {
          return {
            component: ThemedImage,
            editable: false,
            props: {
              getEditorRef,
              entityKey: entity,
              getEditorState,
              setEditorState,
              setResizeData: createSetResizeData(block, {
                getEditorState,
              }),
            },
          };
        }
        return null;
      }

      return null;
    },
    addImage,
  };
};

export const Image = ImageComponent;

export { createResizablePlugin };
