import { EditorPlugin } from '@draft-js-plugins/editor';
import createDecorator from './createDecorator';

type ResizeEditorPlugin = EditorPlugin & {
  decorator: ReturnType<typeof createDecorator>;
};

export default (): ResizeEditorPlugin => {
  return {
    decorator: createDecorator(),
    blockRendererFn: (contentBlock, { getEditorState }) => {
      return {
        props: {
          getEditorState,
        },
      };
    },
  };
};
