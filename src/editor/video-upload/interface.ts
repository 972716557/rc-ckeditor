import { EditorState } from 'draft-js';
import { DefaultControlProps } from '../interface';

export interface VideoUploadProps extends DefaultControlProps {
  editorState: EditorState;
  onChange(editorState: EditorState): void;
  isSaveImageWithFullPath?: boolean;
  imageUploadConfig?: {
    action: string;
    cdnUrl: string;
    getQnToken: (data: object) => Promise<any>;
  };
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
