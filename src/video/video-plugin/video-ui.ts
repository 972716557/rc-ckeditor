import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { MenuBarMenuListItemButtonView, ButtonView } from '@ckeditor/ckeditor5-ui';

export default class ESpaceVideoUI extends Plugin {
  public init(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('espaceVideo', () => {
      const buttonView = this._createButton(ButtonView);

      buttonView.set({
        tooltip: true,
      });

      return buttonView;
    });

    editor.ui.componentFactory.add('menuBar:espaceVideo', () => {
      return this._createButton(MenuBarMenuListItemButtonView);
    });
  }

  private _createButton<T extends typeof ButtonView | typeof MenuBarMenuListItemButtonView>(
    ButtonClass: T,
  ): InstanceType<T> {
    const editor = this.editor;
    const command = editor.commands.get('espaceVideo')!;
    const view = new ButtonClass(editor.locale) as InstanceType<T>;

    view.set({
      label: '插入视频',
      //   icon: icons.espaceVideo,
    });

    view.bind('isEnabled').to(command, 'isEnabled');

    // Execute the command.
    this.listenTo(view, 'execute', () => {
      editor.execute('espaceVideo');
      editor.editing.view.focus();
    });

    return view;
  }
}
