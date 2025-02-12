import { FC, useEffect, useState } from 'react';
import { ToolbarButtonProps } from './interface';
import classNames from 'classnames';
import './index.less';
import { Tooltip } from 'antd';

const ToolbarButton: FC<ToolbarButtonProps> = ({
  label,
  editor,
  commandName,
  commandValue,
  tooltip,
}) => {
  const command = editor ? editor.commands.get(commandName) : null;
  const [isOn, setIsOn] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  function handleValueChange() {
    if (typeof command?.value === 'boolean') {
      setIsOn(!!command.value);
    } else {
      setIsOn(commandValue === command?.value);
    }
  }

  function handleIsEnabledChange() {
    setIsEnabled(command!.isEnabled);
  }

  useEffect(() => {
    if (!command) {
      return;
    }

    command.on('change:value', handleValueChange);
    command.on('change:isEnabled', handleIsEnabledChange);

    handleValueChange();
    handleIsEnabledChange();

    return () => {
      command.off('change:value', handleValueChange);
      command.off('change:isEnabled', handleIsEnabledChange);
    };
  }, [command]);

  const className = classNames(
    'community-rich-editor-toolbar-item',
    !isEnabled && 'community-rich-editor-toolbar-item-disabled',
    isOn && 'community-rich-editor-toolbar-item-active',
  );

  return (
    <Tooltip
      title={tooltip}
      getPopupContainer={(triggerNode) => {
        return triggerNode.parentElement?.parentElement || triggerNode;
      }}
    >
      <span
        className={className}
        onClick={() => {
          if (commandValue) {
            editor?.execute(commandName, { value: commandValue });
          } else {
            editor?.execute(commandName);
          }

          editor?.editing.view.focus();
        }}
      >
        {label}
      </span>
    </Tooltip>
  );
};
export default ToolbarButton;
