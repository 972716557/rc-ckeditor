import { EditorState, ContentBlock, SelectionState, ContentState } from 'draft-js';
import React, {
  ComponentType,
  CSSProperties,
  useCallback,
  useRef,
  useState,
  useMemo,
  Ref,
  useEffect,
} from 'react';

export interface WrappedComponentProps {
  blockProps: {
    setResizeData(value: { width: string; style: CSSProperties }): void;
    getEditorRef: () => { editor: HTMLDivElement };
    getEditorState: () => EditorState;
    setEditorState: (state: EditorState) => void;
    entityKey: string;
  };
  clicked: boolean;
  width: number;
  height: number;
  style?: CSSProperties;
  ref?: Ref<HTMLElement>;
  isDragging?: boolean;
  block: ContentBlock;
  selection: SelectionState;
  editorState: EditorState;
  onChange: (state: EditorState) => void;
  entityKey: string;
  contentState: ContentState;
}

interface BlockResizeDecoratorProps extends WrappedComponentProps {
  isResizable?: boolean;
}

type WrappedComponentType = ComponentType<WrappedComponentProps> & {
  WrappedComponent?: ComponentType<WrappedComponentProps>;
};

const getDisplayName = (WrappedComponent: WrappedComponentType): string => {
  const component = WrappedComponent.WrappedComponent || WrappedComponent;
  return component.displayName || component.name || 'Component';
};

const round = (x: number, steps: number): number => Math.ceil(x / steps) * steps;

export default () =>
  (WrappedComponent: WrappedComponentType): ComponentType<WrappedComponentProps> => {
    const BlockResizeDecorator = React.forwardRef<HTMLElement, BlockResizeDecoratorProps>(
      ({ blockProps, isResizable = true, ...elementProps }: BlockResizeDecoratorProps, ref) => {
        const [hoverPosition, setHoverPosition] = useState<Record<string, boolean>>({});
        const { setResizeData, getEditorRef, getEditorState, setEditorState, entityKey } =
          blockProps;
        const data = elementProps.contentState.getEntity(entityKey)?.getData();
        const editorState = getEditorState?.();
        const selection = editorState.getSelection();
        const selectionKey = selection.getAnchorKey();
        const [width, setWidth] = useState<string>();
        const [clicked, setClicked] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const wrapper = useRef<HTMLImageElement>(null);

        const onMouseLeave = useCallback(() => {
          if (!clicked) {
            setHoverPosition({});
          }
        }, [clicked]);

        const onMouseMove = useCallback((event: MouseEvent) => {
          const tolerance = 6;
          const b = wrapper.current!.getBoundingClientRect();
          const x = event.clientX - b.left;
          const y = event.clientY - b.top;

          const isTop = y < tolerance;
          const isLeft = x < tolerance;
          const isRight = x >= b.width - tolerance;
          const isBottom = y >= b.height - tolerance && y < b.height;

          const canResize = isTop || isLeft || isRight || isBottom;

          const newHoverPosition: Record<string, boolean> = {
            isTop,
            isLeft,
            isRight,
            isBottom,
            canResize,
          };
          setHoverPosition((oldHoverPosition) => {
            const hasNewHoverPositions = Object.keys(newHoverPosition).filter(
              (key) => oldHoverPosition[key] !== newHoverPosition[key],
            );
            if (hasNewHoverPositions.length) {
              return newHoverPosition;
            }
            return oldHoverPosition;
          });
        }, []);

        const onMouseDown = useCallback(
          (event: MouseEvent) => {
            if (!hoverPosition.canResize) {
              return;
            }

            event.preventDefault();
            const { isTop, isLeft, isRight, isBottom } = hoverPosition;

            const pane = wrapper.current!;
            const startX = event.clientX;
            const startY = event.clientY;
            const startWidth = parseInt(document.defaultView!.getComputedStyle(pane).width, 10);
            const startHeight = parseInt(document.defaultView!.getComputedStyle(pane).height, 10);

            let newWidth =
              typeof width === 'string' && width?.includes('%')
                ? width.slice(0, width.length - 1)
                : width || 0;
            let newHeight: number;
            // Do the actual drag operation
            const doDrag = (dragEvent: MouseEvent): void => {
              setIsDragging(true);
              const editorComp = getEditorRef();
              const editorNode = editorComp.editor;
              let _width =
                startWidth + (isLeft ? startX - dragEvent.clientX : dragEvent.clientX - startX);
              let _height =
                ((!isTop
                  ? startHeight + dragEvent.clientY - startY
                  : startHeight - dragEvent.clientY + startY) *
                  startWidth) /
                startHeight;
              // 存在负数,设置最小宽度为20
              _width = Math.min(editorNode.clientWidth, _width);
              _width = _width < 20 ? 20 : _width;
              _height = Math.min(editorNode.clientHeight, _height);
              _height = _height < 20 ? 20 : _height;

              const pecWidth = (100 / editorNode.clientWidth) * _width;
              const pecHeight = (100 / editorNode.clientHeight) * _height;
              if (isLeft || isRight) {
                newWidth = round(pecWidth, 1);
                setWidth(`${newWidth}%`);
              }

              if (isTop || isBottom) {
                newHeight = round(pecHeight, 1);
                setWidth(`${newHeight}%`);
              }
            };
            // Finished dragging
            const stopDrag = (): void => {
              document.removeEventListener('mousemove', doDrag, false);
              document.removeEventListener('mouseup', stopDrag, false);
              setIsDragging(false);
            };

            document.addEventListener('mousemove', doDrag, false);
            document.addEventListener('mouseup', stopDrag, false);
            setClicked(true);
          },
          [hoverPosition, width, blockProps],
        );

        const styles: CSSProperties = useMemo(() => {
          const _styles: CSSProperties = { position: 'relative' };
          if (selectionKey === elementProps?.block?.getKey()) {
            const { isTop, isLeft, isRight, isBottom } = hoverPosition;

            const widthValue = width;
            _styles.width = widthValue;

            if ((isRight && isBottom) || (isLeft && isTop)) {
              _styles.cursor = 'nwse-resize';
            } else if ((isRight && isTop) || (isBottom && isLeft)) {
              _styles.cursor = 'nesw-resize';
            } else if (isRight || isLeft) {
              _styles.cursor = 'ew-resize';
            } else if (isBottom || isTop) {
              _styles.cursor = 'ns-resize';
            } else {
              _styles.cursor = 'default';
            }
          }

          return _styles;
        }, [hoverPosition, width]);

        useEffect(() => {
          if (!isDragging && width && selectionKey === elementProps?.block?.getKey()) {
            setResizeData({ width, style: { ...data.style, width } });
          }
        }, [isDragging]);

        const interactionProps = {
          onMouseDown,
          onMouseMove,
          onMouseLeave,
        };

        return (
          <WrappedComponent
            {...elementProps}
            {...interactionProps}
            blockProps={blockProps}
            editorState={editorState}
            onChange={(value) => {
              setEditorState(value);
            }}
            entityKey={entityKey}
            isDragging={isDragging}
            ref={(node) => {
              wrapper.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            style={styles}
          />
        );
      },
    );

    BlockResizeDecorator.displayName = `BlockResize(${getDisplayName(WrappedComponent)})`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (BlockResizeDecorator as any).WrappedComponent =
      WrappedComponent.WrappedComponent || WrappedComponent;

    return BlockResizeDecorator;
  };
