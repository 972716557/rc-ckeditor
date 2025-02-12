import { ClassicEditor } from 'ckeditor5';

export interface VideoUploadProps {
  editor?: ClassicEditor;
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
