import { OrderedSet, List, is, Iterable } from 'immutable';
import type {
  ContentState,
  ContentBlock,
  Entity,
  EntityInstance,
  CharacterMetadata,
} from 'draft-js';
import type { DraftInlineStyle } from 'draft-js/lib/DraftInlineStyle';

import combineOrderedStyles from './combine-ordered-styles';
import normalizeAttributes from './normalize-attributes';
import styleToCSS from './style-to-css';

const BLOCK_TYPE = {
  // This is used to represent a normal text block (paragraph).
  UNSTYLED: 'unstyled',
  HEADER_ONE: 'header-one',
  HEADER_TWO: 'header-two',
  HEADER_THREE: 'header-three',
  HEADER_FOUR: 'header-four',
  HEADER_FIVE: 'header-five',
  HEADER_SIX: 'header-six',
  UNORDERED_LIST_ITEM: 'unordered-list-item',
  ORDERED_LIST_ITEM: 'ordered-list-item',
  BLOCKQUOTE: 'blockquote',
  PULLQUOTE: 'pullquote',
  CODE: 'code-block',
  ATOMIC: 'atomic',
};

const ENTITY_TYPE = {
  LINK: 'LINK',
  IMAGE: 'IMAGE',
  EMBED: 'embed',
};

const INLINE_STYLE = {
  BOLD: 'BOLD',
  CODE: 'CODE',
  ITALIC: 'ITALIC',
  STRIKETHROUGH: 'STRIKETHROUGH',
  UNDERLINE: 'UNDERLINE',
};
type AttrMap = { [key: string]: string };
type Attributes = { [key: string]: string };
type StyleDesc = { [key: string]: number | string };

type EntityKey = string | null;
type Style = OrderedSet<string>;
type StyleRange = [string, Style];
type EntityRange = [EntityKey, Array<StyleRange>];
type CharacterMetaList = List<CharacterMetadata>;
type RenderConfig = {
  element?: string;
  attributes?: Attributes;
  style?: StyleDesc;
};
type BlockRenderer = (block: ContentBlock) => string;
type BlockRendererMap = { [blockType: string]: BlockRenderer };

type StyleMap = { [styleName: string]: RenderConfig };

type BlockStyleFn = (block: ContentBlock) => RenderConfig;
type EntityStyleFn = (entity: Entity) => RenderConfig;
type InlineStyleFn = (style: DraftInlineStyle) => RenderConfig;

type Options = {
  inlineStyles?: StyleMap;
  inlineStyleFn?: InlineStyleFn;
  blockRenderers?: BlockRendererMap;
  blockStyleFn?: BlockStyleFn;
  entityStyleFn?: EntityStyleFn;
  defaultBlockTag?: string;
};

const EMPTY_SET: Style = OrderedSet();
const { BOLD, CODE, ITALIC, STRIKETHROUGH, UNDERLINE } = INLINE_STYLE;
const BREAK = '<br>';
const DATA_ATTRIBUTE = /^data-([a-z0-9-]+)$/;

const DEFAULT_STYLE_MAP = {
  [BOLD]: { element: 'strong' },
  [CODE]: { element: 'code' },
  [ITALIC]: { element: 'em' },
  [STRIKETHROUGH]: { element: 'del' },
  [UNDERLINE]: { element: 'u' },
};

// Order: inner-most style to outer-most.
// Example: <em><strong>foo</strong></em>
const DEFAULT_STYLE_ORDER = [BOLD, ITALIC, UNDERLINE, STRIKETHROUGH, CODE];

// Map entity data to element attributes.
const ENTITY_ATTR_MAP: { [entityType: string]: AttrMap } = {
  [ENTITY_TYPE.LINK]: {
    url: 'href',
    href: 'href',
    rel: 'rel',
    target: 'target',
    title: 'title',
    className: 'class',
    type: 'type',
  },
  [ENTITY_TYPE.IMAGE]: {
    src: 'src',
    height: 'height',
    width: 'width',
    alt: 'alt',
    className: 'class',
  },
};

// Map entity data to element attributes.
const getArr = (entityType: string, entity: EntityInstance): Attributes => {
  let attrMap = ENTITY_ATTR_MAP.hasOwnProperty(entityType) ? ENTITY_ATTR_MAP[entityType] : {};
  let data = entity.getData();

  let attrs: Record<string, string> = {};
  for (let dataKey of Object.keys(data)) {
    let dataValue = data[dataKey];
    if (attrMap.hasOwnProperty(dataKey)) {
      let attrKey = attrMap[dataKey];
      attrs[attrKey] = dataValue;
    } else if (DATA_ATTRIBUTE.test(dataKey)) {
      attrs[dataKey] = dataValue;
    }
  }

  return attrs;
};

function getStyleRanges(
  text: string,
  charMetaList: Iterable<number, CharacterMetadata>,
): Array<StyleRange> {
  let charStyle = EMPTY_SET;
  let ranges: Array<StyleRange> = [];
  let rangeStart = 0;
  for (let i = 0, len = text.length; i < len; i++) {
    const prevCharStyle = charStyle;
    let meta = charMetaList.get(i);
    charStyle = meta ? meta.getStyle() : EMPTY_SET;
    if (i > 0 && !is(charStyle, prevCharStyle)) {
      ranges.push([text.slice(rangeStart, i), prevCharStyle]);
      rangeStart = i;
    }
  }
  ranges.push([text.slice(rangeStart), charStyle]);
  return ranges;
}

function getEntityRanges(text: string, charMetaList: CharacterMetaList): Array<EntityRange> {
  let charEntity: string | null = null;
  let prevCharEntity: string | null = null;
  let ranges: Array<EntityRange> = [];
  let rangeStart = 0;
  for (let i = 0, len = text.length; i < len; i++) {
    prevCharEntity = charEntity;
    let meta: CharacterMetadata = charMetaList.get(i);
    charEntity = meta ? meta.getEntity() : null;
    if (i > 0 && charEntity !== prevCharEntity) {
      ranges.push([
        prevCharEntity,
        getStyleRanges(text.slice(rangeStart, i), charMetaList.slice(rangeStart, i)),
      ]);
      rangeStart = i;
    }
  }
  ranges.push([charEntity, getStyleRanges(text.slice(rangeStart), charMetaList.slice(rangeStart))]);
  return ranges;
}

// The reason this returns an array is because a single block might get wrapped
// in two tags.
function getTags(blockType: string, defaultBlockTag?: string): Array<string> {
  switch (blockType) {
    case BLOCK_TYPE.HEADER_ONE:
      return ['h1'];
    case BLOCK_TYPE.HEADER_TWO:
      return ['h2'];
    case BLOCK_TYPE.HEADER_THREE:
      return ['h3'];
    case BLOCK_TYPE.HEADER_FOUR:
      return ['h4'];
    case BLOCK_TYPE.HEADER_FIVE:
      return ['h5'];
    case BLOCK_TYPE.HEADER_SIX:
      return ['h6'];
    case BLOCK_TYPE.UNORDERED_LIST_ITEM:
    case BLOCK_TYPE.ORDERED_LIST_ITEM:
      return ['li'];
    case BLOCK_TYPE.BLOCKQUOTE:
      return ['blockquote'];
    case BLOCK_TYPE.CODE:
      return ['code'];
    case BLOCK_TYPE.ATOMIC:
      return ['figure'];
    default:
      if (defaultBlockTag === null) {
        return [];
      }
      return [defaultBlockTag || 'p'];
  }
}

function getWrapperTag(blockType: string): string | null {
  switch (blockType) {
    case BLOCK_TYPE.UNORDERED_LIST_ITEM:
      return 'ul';
    case BLOCK_TYPE.ORDERED_LIST_ITEM:
      return 'ol';
    case 'code-block':
      return 'pre';
    default:
      return null;
  }
}

class MarkupGenerator {
  // These are related to state.
  blocks: Array<ContentBlock> = [];
  contentState: ContentState;
  currentBlock!: number;
  output!: string;
  totalBlocks!: number;
  wrapperTag!: string | null;
  // These are related to user-defined options.
  options: Options;
  inlineStyles: StyleMap;
  inlineStyleFn: InlineStyleFn;
  styleOrder: Array<string>;

  constructor(contentState: ContentState, options?: Options) {
    if (options == null) {
      options = {};
    }
    this.contentState = contentState;
    this.options = options;
    let [inlineStyles, styleOrder] = combineOrderedStyles(options.inlineStyles || {}, [
      DEFAULT_STYLE_MAP,
      DEFAULT_STYLE_ORDER,
    ]);
    this.inlineStyles = inlineStyles;
    this.inlineStyleFn = options.inlineStyleFn!;
    this.styleOrder = styleOrder;
  }

  generate(): string {
    this.output = '';
    this.blocks = this.contentState.getBlocksAsArray();
    this.totalBlocks = this.blocks.length;
    this.currentBlock = 0;
    this.wrapperTag = null;
    while (this.currentBlock < this.totalBlocks) {
      this.processBlock();
    }
    this.closeWrapperTag();
    return this.output.trim();
  }

  processBlock() {
    let { blockRenderers, defaultBlockTag } = this.options;
    let block = this.blocks[this.currentBlock];
    let blockType = block.getType();
    let newWrapperTag = getWrapperTag(blockType);
    if (this.wrapperTag !== newWrapperTag) {
      if (this.wrapperTag) {
        this.closeWrapperTag();
      }
      if (newWrapperTag) {
        this.openWrapperTag(newWrapperTag);
      }
    }
    // Allow blocks to be rendered using a custom renderer.
    let customRenderer =
      blockRenderers != null && blockRenderers.hasOwnProperty(blockType)
        ? blockRenderers[blockType]
        : null;
    let customRendererOutput = customRenderer ? customRenderer(block) : null;
    // Renderer can return null, which will cause processing to continue as normal.
    if (customRendererOutput != null) {
      this.output += customRendererOutput;
      this.currentBlock += 1;
      return;
    }
    this.writeStartTag(block, defaultBlockTag);
    this.output += this.renderBlockContent(block);
    // Look ahead and see if we will nest list.
    let nextBlock = this.getNextBlock();
    if (canHaveDepth(blockType) && nextBlock && nextBlock.getDepth() === block.getDepth() + 1) {
      // This is a litle hacky: temporarily stash our current wrapperTag and
      // render child list(s).
      let thisWrapperTag = this.wrapperTag;
      this.wrapperTag = null;
      this.currentBlock += 1;
      this.processBlocksAtDepth(nextBlock.getDepth());
      this.wrapperTag = thisWrapperTag;
    } else {
      this.currentBlock += 1;
    }
    this.writeEndTag(block, defaultBlockTag || '');
  }

  processBlocksAtDepth(depth: number) {
    let block = this.blocks[this.currentBlock];
    while (block && block.getDepth() === depth) {
      this.processBlock();
      block = this.blocks[this.currentBlock];
    }
    this.closeWrapperTag();
  }

  getNextBlock(): ContentBlock {
    return this.blocks[this.currentBlock + 1];
  }

  writeStartTag(block: ContentBlock, defaultBlockTag?: string) {
    let tags = getTags(block.getType(), defaultBlockTag);
    let attrString;
    if (this.options.blockStyleFn) {
      let { attributes, style } = this.options.blockStyleFn(block) || {};
      // Normalize `className` -> `class`, etc.
      attributes = normalizeAttributes(attributes);
      if (style) {
        let styleAttr = styleToCSS(style);
        attributes =
          attributes == null ? { style: styleAttr } : { ...attributes, style: styleAttr };
      }
      attrString = stringifyAttrs(attributes);
    } else {
      attrString = '';
    }
    for (let tag of tags) {
      this.output += `<${tag}${attrString}>`;
    }
  }

  writeEndTag(block: ContentBlock, defaultBlockTag: string) {
    let tags = getTags(block.getType(), defaultBlockTag);
    let output = '';
    for (let tag of tags) {
      output = `</${tag}>` + output;
    }
    this.output += output;
  }

  openWrapperTag(wrapperTag: string) {
    this.wrapperTag = wrapperTag;
    this.output += `<${wrapperTag}>`;
  }

  closeWrapperTag() {
    let { wrapperTag } = this;
    if (wrapperTag) {
      this.output += `</${wrapperTag}>`;
      this.wrapperTag = null;
    }
  }

  withCustomInlineStyles(content: string, styleSet: DraftInlineStyle) {
    if (!this.inlineStyleFn) {
      return content;
    }

    const renderConfig = this.inlineStyleFn(styleSet);
    if (!renderConfig) {
      return content;
    }

    const { element = 'span', attributes, style } = renderConfig;
    const attrString = stringifyAttrs({
      ...attributes,
      style: (style && styleToCSS(style)) || '',
    });

    return `<${element}${attrString}>${content}</${element}>`;
  }

  renderBlockContent(block: ContentBlock): string {
    let blockType = block.getType();
    let text = block.getText();
    if (text === '') {
      // Prevent element collapse if completely empty.
      return BREAK;
    }
    text = this.preserveWhitespace(text);
    let charMetaList = block.getCharacterList();
    let entityPieces: Array<EntityRange> = getEntityRanges(text, charMetaList);
    return entityPieces
      .map(([entityKey, stylePieces]) => {
        let content: string = stylePieces
          .map(([_text, styleSet]) => {
            let tempContent = encodeContent(_text);
            for (let styleName of this.styleOrder) {
              // If our block type is CODE then don't wrap inline code elements.
              if (styleName === CODE && blockType === BLOCK_TYPE.CODE) {
                continue;
              }
              if (styleSet.has(styleName)) {
                let { element, attributes, style } = this.inlineStyles[styleName];
                if (element === null) {
                  element = 'span';
                }
                // Normalize `className` -> `class`, etc.
                attributes = normalizeAttributes(attributes);
                if (!!style) {
                  let styleAttr = styleToCSS(style);
                  attributes =
                    attributes == null ? { style: styleAttr } : { ...attributes, style: styleAttr };
                }
                let attrString = stringifyAttrs(attributes);
                tempContent = `<${element}${attrString}>${tempContent}</${element}>`;
              }
            }

            return this.withCustomInlineStyles(tempContent, styleSet);
          })
          .join('');
        let entity = entityKey ? this.contentState.getEntity(entityKey) : null;
        // Note: The `toUpperCase` below is for compatibility with some libraries that use lower-case for image blocks.
        let entityType = entity == null ? null : entity.getType().toUpperCase();
        let entityStyle;
        if (
          entity != null &&
          this.options.entityStyleFn &&
          (entityStyle = this.options.entityStyleFn(entity))
        ) {
          let { element, attributes, style } = entityStyle;
          element = element ?? 'span';
          // Normalize `className` -> `class`, etc.
          attributes = normalizeAttributes(attributes);
          if (style != null) {
            let styleAttr = styleToCSS(style);
            attributes =
              attributes == null ? { style: styleAttr } : { ...attributes, style: styleAttr };
          }
          let attrString = stringifyAttrs(attributes);
          // 处理img标签里面包含空span的bug
          return `<${element}${attrString}>${element === 'img' ? '' : content}</${element}>`;
        } else if (entity !== null && entityType === ENTITY_TYPE.LINK) {
          let attrs = getArr(entityType, entity);
          let attrString = stringifyAttrs(attrs);
          return `<a${attrString}>${content}</a>`;
        } else if (entity !== null && entityType === ENTITY_TYPE.IMAGE) {
          let attrs = getArr(entityType, entity);
          let attrString = stringifyAttrs(attrs);
          return `<img${attrString}/>`;
        }
        return content;
      })
      .join('');
  }

  preserveWhitespace(text: string): string {
    let length = text.length;
    // Prevent leading/trailing/consecutive whitespace collapse.
    let newText = new Array(length);
    for (let i = 0; i < length; i++) {
      if (text[i] === ' ' && (i === 0 || i === length - 1 || text[i - 1] === ' ')) {
        newText[i] = '\xA0';
      } else {
        newText[i] = text[i];
      }
    }
    return newText.join('');
  }
}

function stringifyAttrs(attrs?: Attributes) {
  if (attrs == null) {
    return '';
  }
  let parts = '';
  for (let name of Object.keys(attrs)) {
    let value = attrs[name];
    if (value != null) {
      parts += ` ${name}="${encodeAttr(value + '')}"`;
    }
  }
  return parts;
}

function canHaveDepth(blockType: string): boolean {
  switch (blockType) {
    case BLOCK_TYPE.UNORDERED_LIST_ITEM:
    case BLOCK_TYPE.ORDERED_LIST_ITEM:
      return true;
    default:
      return false;
  }
}

function encodeContent(text: string): string {
  return text
    .split('&')
    .join('&amp;')
    .split('<')
    .join('&lt;')
    .split('>')
    .join('&gt;')
    .split('\xA0')
    .join('&nbsp;');
}

function encodeAttr(text: string): string {
  return text
    .split('&')
    .join('&amp;')
    .split('<')
    .join('&lt;')
    .split('>')
    .join('&gt;')
    .split('"')
    .join('&quot;');
}

export default function stateToHTML(content: ContentState, options?: Options): string {
  return new MarkupGenerator(content, options).generate();
}
