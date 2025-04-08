import { ReactDOM } from 'react';
import { DefaultShowControls } from '../constant';
import { ControlType, ShowControlsType } from '../interface';

const getShowControls = (
  showControls: ShowControlsType,
  excludeControls: ControlType[],
  type: ControlType,
): ReactDOM | boolean => {
  const renderControls = showControls || DefaultShowControls;
  if (type) {
    let show = renderControls.some((control) => control === type);
    let index = renderControls.findIndex((control) => control === type);
    if (index >= 0) {
      //@ts-ignore
      show = typeof renderControls[index] === 'object' ? renderControls?.[index]?.[type] : true;
    }
    if (excludeControls?.includes(type)) {
      show = false;
    }
    return show;
  }
  // 没有匹配到type
  return false;
};
export default getShowControls;
