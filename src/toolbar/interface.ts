import { ClassicEditor } from 'ckeditor5';
import { ReactNode } from 'react';

export interface ToolbarButtonProps {
  label: ReactNode;
  commandName: string;
  commandValue?: string;
  editor?: ClassicEditor;
  tooltip?: string;
}
