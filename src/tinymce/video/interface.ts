import type { Editor as TinyMCEEditor } from 'tinymce';

export interface VideoUploadProps {
  editor?: TinyMCEEditor;
}

export interface UploadVideoResult {
  fileId: string;
  video: {
    url: string;
  };
  cover: {
    url: string;
  };
}
