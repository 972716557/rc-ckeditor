import { ClassicEditor } from 'ckeditor5';

export interface LinkProps {
  editor?: ClassicEditor;
  text?: string;
}
export interface LinkState {
  visible: boolean;
}

// 链接形式 普通链接 链接卡片
export enum LinkType {
  Link = 'link',
  LinkCard = 'link-card',
}

export interface SaveType {
  url: string;
  title: string;
  entityKey: string;
}
export interface DrawerProps {
  initialTitle?: string;
  initialUrl?: string;
  visible: boolean;
  onOk: (data: SaveType) => void;
  onCancel: () => void;
}
