import { Plugin } from 'ckeditor5/src/core.js';
import { Widget } from 'ckeditor5/src/widget.js';
import VideoEdit from './video-edit';
import VideoUI from './video-ui';

export default class ESpaceVideo extends Plugin {
  public static get requires() {
    return [VideoEdit, VideoUI, Widget] as const;
  }

  public static get pluginName() {
    return 'EspaceVideo' as const;
  }
}
