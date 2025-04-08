import {
  ContentState,
  ContentBlock,
  CharacterMetadata,
  DraftInlineStyle,
  DraftBlockRenderMap,
} from 'draft-js';
import { ContentBlockNode } from 'draft-js/lib/ContentBlockNode';
import { DraftEntityMapObject as EntityMap } from 'draft-js/lib/DraftEntity';
import classnames from 'classnames';
import { List, Map, OrderedSet, Iterable } from 'immutable';
import { random } from 'lodash';

import { LinkType } from '../link/interface';
import { splitStyle } from './index';

type BlockNodeRecord = ContentBlock | ContentBlockNode;

const seenKeys: Record<string, any> = {};
const MULTIPLIER = Math.pow(2, 24);

export function generateRandomKey(): string {
  let key;
  while (key === undefined || seenKeys.hasOwnProperty(key) || !isNaN(+key)) {
    key = Math.floor(random(0, 1, true) * MULTIPLIER).toString(32);
  }
  seenKeys[key] = true;
  return key;
}

function gkx(name: string) {
  if (typeof window !== 'undefined' && window?.__DRAFT_GKX) {
    return !!window.__DRAFT_GKX[name];
  }
  return false;
}
function isHTMLAnchorElement(node?: Node): boolean {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'A';
}

function getSafeBodyFromHTML(html: string) {
  let doc;
  let root = null;
  // Provides a safe context
  if (
    document.implementation &&
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    document.implementation.createHTMLDocument
  ) {
    doc = document.implementation.createHTMLDocument('foo');
    doc.documentElement.innerHTML = html;
    root = doc.getElementsByTagName('body')[0];
  }
  return root;
}

function isElement(node?: Node): boolean {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return node.nodeType === Node.ELEMENT_NODE;
}

function isHTMLBRElement(node?: Node): boolean {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'BR';
}

function isHTMLImageElement(node?: Node): boolean {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'IMG';
}
function isHTMLVideoElement(node?: Node): boolean {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'VIDEO';
}

function isHTMLElement(node?: Node): boolean {
  if (!node || !node.ownerDocument) {
    return false;
  }
  if (!node.ownerDocument.defaultView) {
    return node instanceof HTMLElement;
  }
  if (node instanceof node.ownerDocument.defaultView.HTMLElement) {
    return true;
  }
  return false;
}

const experimentalTreeDataSupport = gkx('draft_tree_data_support');

const NBSP = '&nbsp;';
const SPACE = ' ';

// used for replacing characters in HTML
const REGEX_CR = /\r/g;
const REGEX_LF = /\n/g;
const REGEX_LEADING_LF = /^\n/g;
const REGEX_NBSP = new RegExp(NBSP, 'g');
const REGEX_CARRIAGE = /&#13;?/g;
const REGEX_ZWS = /&#8203;?/g;

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
const boldValues = ['bold', 'bolder', '500', '600', '700', '800', '900'];
const notBoldValues = ['light', 'lighter', 'normal', '100', '200', '300', '400'];

const anchorAttr = ['classnames', 'href', 'rel', 'target', 'title'];
const imgAttr = ['alt', 'classnames', 'height', 'src', 'width', 'style'];

const knownListItemDepthClasses = {
  [classnames('public/DraftStyleDefault/depth0')]: 0,
  [classnames('public/DraftStyleDefault/depth1')]: 1,
  [classnames('public/DraftStyleDefault/depth2')]: 2,
  [classnames('public/DraftStyleDefault/depth3')]: 3,
  [classnames('public/DraftStyleDefault/depth4')]: 4,
};

const HTMLTagToRawInlineStyleMap: Map<string, string> = Map({
  b: 'BOLD',
  code: 'CODE',
  del: 'STRIKETHROUGH',
  em: 'ITALIC',
  i: 'ITALIC',
  s: 'STRIKETHROUGH',
  strike: 'STRIKETHROUGH',
  strong: 'BOLD',
  u: 'UNDERLINE',
  mark: 'HIGHLIGHT',
});

type BlockTypeMap = Map<string, string | Array<string>>;

const buildBlockTypeMap = (blockRenderMap: DraftBlockRenderMap): BlockTypeMap => {
  const blockTypeMap: Record<string, any | any[] | string[]> = {};
  blockRenderMap.mapKeys((blockType, desc: any) => {
    const elements = [desc?.element];
    if (desc.aliasedElements !== undefined) {
      elements.push(...desc.aliasedElements);
    }
    elements.forEach((element) => {
      if (blockTypeMap[element] === undefined) {
        blockTypeMap[element] = blockType;
      } else if (typeof blockTypeMap[element] === 'string') {
        blockTypeMap[element] = [blockTypeMap[element], blockType];
      } else {
        blockTypeMap[element].push(blockType);
      }
    });
  });

  return Map(blockTypeMap);
};

const detectInlineStyle = (node: Node): string | null => {
  if (isHTMLElement(node)) {
    const element: HTMLElement = node as unknown as HTMLElement;
    // Currently only used to detect preformatted inline code
    if (element.style.fontFamily.includes('monospace')) {
      return 'CODE';
    }
  }
  return null;
};

/**
 * If we're pasting from one DraftEditor to another we can check to see if
 * existing list item depth classes are being used and preserve this style
 */
const getListItemDepth = (node: HTMLElement, depth: number = 0): number => {
  Object.keys(knownListItemDepthClasses).some((depthClass) => {
    if (node.classList.contains(depthClass)) {
      depth = knownListItemDepthClasses[depthClass];
    }
  });
  return depth;
};

/**
 * Return true if the provided HTML Element can be used to build a
 * Draftjs-compatible link.
 */
const isValidAnchor = (node: Node) => {
  if (!isHTMLAnchorElement(node)) {
    return false;
  }
  const anchorNode: HTMLAnchorElement = node as unknown as HTMLAnchorElement;

  if (!anchorNode.href) {
    return false;
  }

  try {
    // Just checking whether we can actually create a URI
    const _ = anchorNode.href;
    return true;
  } catch {
    return false;
  }
};

/**
 * Return true if the provided HTML Element can be used to build a
 * Draftjs-compatible video.
 */
const isValidVideo = (node: Node): boolean => {
  if (!isHTMLVideoElement(node)) {
    return false;
  }
  const videoNode: HTMLVideoElement = node as unknown as HTMLVideoElement;
  return !!(
    videoNode.attributes.getNamedItem('src') && videoNode.attributes.getNamedItem('src')?.value
  );
};

/**
 * Return true if the provided HTML Element can be used to build a
 * Draftjs-compatible image.
 */
const isValidImage = (node: Node): boolean => {
  if (!isHTMLImageElement(node)) {
    return false;
  }
  const imageNode: HTMLImageElement = node as unknown as HTMLImageElement;
  return !!(
    imageNode.attributes.getNamedItem('src') && imageNode.attributes.getNamedItem('src')?.value
  );
};

/**
 * Try to guess the inline style of an HTML element based on its css
 * styles (font-weight, font-style and text-decoration).
 */
const styleFromNodeAttributes = (node: Node, style: DraftInlineStyle): DraftInlineStyle => {
  if (!isHTMLElement(node)) {
    return style;
  }

  const htmlElement: HTMLElement = node as unknown as HTMLElement;
  const fontWeight = htmlElement.style.fontWeight;
  const fontStyle = htmlElement.style.fontStyle;
  const textDecoration = htmlElement.style.textDecoration;

  return style.withMutations((tempStyle) => {
    if (boldValues.indexOf(fontWeight) >= 0) {
      tempStyle.add('BOLD');
    } else if (notBoldValues.indexOf(fontWeight) >= 0) {
      tempStyle.remove('BOLD');
    }

    if (fontStyle === 'italic') {
      tempStyle.add('ITALIC');
    } else if (fontStyle === 'normal') {
      tempStyle.remove('ITALIC');
    }

    if (textDecoration === 'underline') {
      tempStyle.add('UNDERLINE');
    }
    if (textDecoration === 'line-through') {
      tempStyle.add('STRIKETHROUGH');
    }
    if (textDecoration === 'none') {
      tempStyle.remove('UNDERLINE');
      tempStyle.remove('STRIKETHROUGH');
    }
  });
};

/**
 * Determine if a nodeName is a list type, 'ul' or 'ol'
 */
const isListNode = (nodeName?: string | null): boolean => nodeName === 'ul' || nodeName === 'ol';

/**
 *  ContentBlockConfig is a mutable data structure that holds all
 *  the information required to build a ContentBlock and an array of
 *  all the child nodes (childConfigs).
 *  It is being used a temporary data structure by the
 *  ContentBlocksBuilder class.
 */
type ContentBlockConfig = {
  characterList: List<CharacterMetadata>;
  data?: Map<any, any>;
  depth?: number;
  key: string;
  text: string;
  type: string;
  children: List<string>;
  parent?: string | null;
  prevSibling?: string | null;
  nextSibling?: string | null;
  childConfigs: Array<ContentBlockConfig>;
};
type ArgType = string | undefined | null;

class ContentBlocksBuilder {
  characterList: List<CharacterMetadata> = List();
  currentBlockType: string = 'unstyled';
  currentDepth: number = 0;
  currentEntity?: string | null = null;
  currentText: string = '';
  wrapper?: string | null = null;

  // Describes the future ContentState as a tree of content blocks
  blockConfigs: Array<ContentBlockConfig> = [];

  // The content blocks generated from the blockConfigs
  contentBlocks: Array<BlockNodeRecord> = [];

  // Entity map use to store links and images found in the HTML nodes
  contentState: ContentState = ContentState.createFromText('');

  // Map HTML tags to draftjs block types and disambiguation function
  blockTypeMap: BlockTypeMap;
  disambiguate: (arg0: string | null, arg1: ArgType) => string | null;

  constructor(
    blockTypeMap: BlockTypeMap,
    disambiguate: (arg0: string | null, arg1: ArgType) => string | null,
  ) {
    this.clear();
    this.blockTypeMap = blockTypeMap;
    this.disambiguate = disambiguate;
  }

  /**
   * Clear the internal state of the ContentBlocksBuilder
   */
  clear(): void {
    this.characterList = List();
    this.blockConfigs = [];
    this.currentBlockType = 'unstyled';
    this.currentDepth = 0;
    this.currentEntity = null;
    this.currentText = '';
    this.contentState = ContentState.createFromText('');
    this.wrapper = null;
    this.contentBlocks = [];
  }

  /**
   * Add an HTMLElement to the ContentBlocksBuilder
   */
  addDOMNode(node: Node): ContentBlocksBuilder {
    this.contentBlocks = [];
    this.currentDepth = 0;
    // Converts the HTML node to block config
    this.blockConfigs.push(...this._toBlockConfigs([node], OrderedSet()));

    // There might be some left over text in the builder's
    // internal state, if so make a ContentBlock out of it.
    // this._trimCurrentText();
    if (this.currentText !== '') {
      this.blockConfigs.push(this._makeBlockConfig());
    }
    // for chaining
    return this;
  }

  /**
   * Return the ContentBlocks and the EntityMap that corresponds
   * to the previously added HTML nodes.
   */
  getContentBlocks(): {
    contentBlocks?: Array<BlockNodeRecord>;
    entityMap: EntityMap;
  } {
    if (this.contentBlocks.length === 0) {
      if (experimentalTreeDataSupport) {
        this._toContentBlocks(this.blockConfigs);
      } else {
        this._toFlatContentBlocks(this.blockConfigs);
      }
    }
    return {
      contentBlocks: this.contentBlocks,
      entityMap: this.contentState.getEntityMap(),
    };
  }

  _makeBlockConfig(config?: Object): ContentBlockConfig {
    const key = (config && (config as any)?.key) || generateRandomKey();
    const block = {
      key,
      type: this.currentBlockType,
      text: this.currentText,
      characterList: this.characterList,
      depth: this.currentDepth,
      parent: null,
      children: List<string>(),
      prevSibling: null,
      nextSibling: null,
      childConfigs: [],
      ...config,
    };
    this.characterList = List<CharacterMetadata>();
    this.currentBlockType = 'unstyled';
    this.currentText = '';
    return block;
  }

  _toBlockConfigs(nodes: Array<Node>, style: DraftInlineStyle): Array<ContentBlockConfig> {
    const blockConfigs = [];
    for (let node of nodes) {
      const nodeName = node.nodeName.toLowerCase();
      if (nodeName === 'body' || isListNode(nodeName)) {
        // body, ol and ul are 'block' type nodes so create a block config
        // with the text accumulated so far (if any)
        this._trimCurrentText();
        if (this.currentText !== '') {
          blockConfigs.push(this._makeBlockConfig());
        }

        // body, ol and ul nodes are ignored, but their children are inlined in
        // the parent block config.
        const wasCurrentDepth = this.currentDepth;
        const wasWrapper = this.wrapper;
        if (isListNode(nodeName)) {
          this.wrapper = nodeName;
          if (isListNode(wasWrapper)) {
            this.currentDepth++;
          }
        }
        blockConfigs.push(...this._toBlockConfigs(Array.from(node.childNodes), style));
        this.currentDepth = wasCurrentDepth;
        this.wrapper = wasWrapper;
        continue;
      }

      let blockType = this.blockTypeMap.get(nodeName);
      if (blockType !== undefined) {
        // 'block' type node means we need to create a block config
        // with the text accumulated so far (if any)
        const tempElement = node as unknown as HTMLElement;
        const type = tempElement?.attributes?.getNamedItem('type')?.value;
        blockType = type || blockType;

        this._trimCurrentText();
        if (this.currentText !== '') {
          blockConfigs.push(this._makeBlockConfig());
        }

        const wasCurrentDepth = this.currentDepth;
        const wasWrapper = this.wrapper;
        this.wrapper = nodeName === 'pre' ? 'pre' : this.wrapper;

        if (typeof blockType !== 'string') {
          blockType = this.disambiguate(nodeName, this.wrapper) || blockType[0] || 'unstyled';
        }

        if (
          !experimentalTreeDataSupport &&
          isHTMLElement(node) &&
          (blockType === 'unordered-list-item' || blockType === 'ordered-list-item')
        ) {
          const htmlElement: HTMLElement = node as unknown as HTMLElement;
          this.currentDepth = getListItemDepth(htmlElement, this.currentDepth);
        }

        const key = generateRandomKey();
        const childConfigs = this._toBlockConfigs(Array.from(node.childNodes), style);
        this._trimCurrentText();
        if (blockType === LinkType.LinkCard) {
          const url = tempElement?.attributes?.getNamedItem('url')?.value;
          const title = tempElement?.attributes?.getNamedItem('title')?.value;
          const id = tempElement?.attributes?.getNamedItem('id')?.value;
          blockConfigs.push(
            this._makeBlockConfig({
              key,
              childConfigs,
              type: blockType,
              data: Map({ url, title, id }),
            }),
          );
        } else if (blockType === 'table') {
          const dataSource = tempElement?.attributes?.getNamedItem('dataSource')?.value || '';
          const columns = tempElement?.attributes?.getNamedItem('columns')?.value || '';
          blockConfigs.push(
            this._makeBlockConfig({
              key,
              childConfigs,
              type: blockType,
              data: Map({ dataSource: JSON.parse(dataSource), columns: JSON.parse(columns) }),
            }),
          );
        } else {
          const styleData = tempElement?.attributes?.getNamedItem('style')?.value || '';
          const textAlign = splitStyle(styleData, 'text-align');
          blockConfigs.push(
            this._makeBlockConfig({
              key,
              childConfigs,
              type: blockType,
              data: textAlign ? Map({ textAlign }) : Map(),
            }),
          );
        }

        this.currentDepth = wasCurrentDepth;
        this.wrapper = wasWrapper;
        continue;
      }

      if (nodeName === '#text') {
        this._addTextNode(node, style);
        continue;
      }
      if (nodeName === 'br') {
        this._addBreakNode(node, style);
        continue;
      }

      if (isValidImage(node)) {
        this._addImgNode(node, style);
        continue;
      }
      if (isValidVideo(node)) {
        this._addVideoNode(node, style);
        continue;
      }

      if (isValidAnchor(node)) {
        this._addAnchorNode(node, blockConfigs, style);
        continue;
      }
      let newStyle = style;
      if (HTMLTagToRawInlineStyleMap.has(nodeName)) {
        newStyle = newStyle.add(HTMLTagToRawInlineStyleMap.get(nodeName));
      }
      newStyle = styleFromNodeAttributes(node, newStyle);
      const inlineStyle = detectInlineStyle(node);
      if (inlineStyle != null) {
        newStyle = newStyle.add(inlineStyle);
      }

      if (nodeName === 'span' || nodeName === 'code') {
        const styleString =
          (node as unknown as HTMLElement)?.attributes?.getNamedItem('style')?.value || '';
        const tempFontSize = splitStyle(styleString, 'font-size');
        const tempColor = splitStyle(styleString, 'color');
        if (tempFontSize) {
          newStyle = newStyle.add(`fontsize-${tempFontSize.slice(0, 2)}`);
        }
        if (tempColor) {
          newStyle = newStyle.add(`color-${tempColor}`);
        }
      }
      blockConfigs.push(...this._toBlockConfigs(Array.from(node.childNodes), newStyle));
    }
    return blockConfigs;
  }

  /**
   * Append a string of text to the internal buffer.
   */
  _appendText(text: string, style: DraftInlineStyle) {
    this.currentText += text;
    const characterMetadata = CharacterMetadata.create({
      style,
      // @ts-ignore
      entity: this.currentEntity,
    });
    this.characterList = this.characterList.push(...Array(text.length).fill(characterMetadata));
  }

  /**
   * Trim the text in the internal buffer.
   */
  _trimCurrentText() {
    const l = this.currentText.length;
    let begin = l - this.currentText.trimStart().length;
    let end = this.currentText.trimEnd().length;

    // We should not trim whitespaces for which an entity is defined.
    let entity = this.characterList.findEntry(
      (characterMetadata) => characterMetadata?.getEntity() !== null,
    );
    begin = entity !== undefined ? Math.min(begin, entity[0]) : begin;

    entity = this.characterList
      .reverse()
      .findEntry((characterMetadata) => characterMetadata?.getEntity() !== null);
    end = entity !== undefined ? Math.max(end, l - entity[0]) : end;

    if (begin > end) {
      this.currentText = '';
      this.characterList = List();
    } else {
      this.currentText = this.currentText.slice(begin, end);
      this.characterList = this.characterList.slice(
        begin,
        end,
      ) as unknown as List<CharacterMetadata>;
    }
  }

  /**
   * Add the content of an HTML text node to the internal state
   */
  _addTextNode(node: Node, style: DraftInlineStyle) {
    let text = node.textContent || '';
    const trimmedText = text?.trim();
    // If we are not in a pre block and the trimmed content is empty,
    // normalize to a single space.
    if (trimmedText === '' && this.wrapper !== 'pre') {
      text = ' ';
    }

    if (this.wrapper !== 'pre') {
      // Trim leading line feed, which is invisible in HTML
      text = text?.replace(REGEX_LEADING_LF, '');

      // Can't use empty string because MSWord
      text = text.replace(REGEX_LF, SPACE);
    }

    this._appendText(text, style);
  }

  _addBreakNode(node: Node, style: DraftInlineStyle) {
    if (!isHTMLBRElement(node)) {
      return;
    }
    this._appendText('\n', style);
  }

  /**
   * Add the content of an HTML img node to the internal state
   */
  _addImgNode(node: Node, style: DraftInlineStyle) {
    if (!isHTMLImageElement(node)) {
      return;
    }
    const image: HTMLImageElement = node as unknown as HTMLImageElement;
    const entityConfig: Record<string, string> = {};

    imgAttr.forEach((attr) => {
      const _imageAttribute = image.getAttribute(attr);
      if (_imageAttribute) {
        entityConfig[attr] = _imageAttribute;
      }
    });
    const imageAttribute = image.getAttribute('style') || '';
    const arr = imageAttribute
      .trim()
      .split(';')
      .filter((item) => !!item.trim());

    const tempStyle: { textAlign?: string; width?: string } = {};
    arr.forEach(function (attr) {
      const temp = attr && attr.split(':');
      if (temp[0] === 'text-align') {
        tempStyle.textAlign = temp[1].trim();
      }
    });
    this.contentState = this.contentState.createEntity('IMAGE', 'IMMUTABLE', {
      ...entityConfig,
      style: { ...tempStyle, width: entityConfig.width },
    });
    this.currentText += ' ';
    this.currentEntity = this.contentState.getLastCreatedEntityKey();
    this.characterList = List();
    const characterMetadata = CharacterMetadata.create({
      style,
      entity: this.currentEntity,
    });
    this.characterList = this.characterList.push(characterMetadata);
    this.currentBlockType = 'atomic';
    this.currentEntity = null;
  }

  /**
   * Add the content of an HTML video node to the internal state
   */
  _addVideoNode(node: Node, style: DraftInlineStyle) {
    if (!isHTMLVideoElement(node)) {
      return;
    }
    const video: HTMLImageElement = node as unknown as HTMLImageElement;
    const entityConfig: Record<string, string> = {};

    imgAttr.forEach((attr) => {
      const _videoAttribute = video.getAttribute(attr);
      if (_videoAttribute) {
        entityConfig[attr] = _videoAttribute;
      }
    });
    this.contentState = this.contentState.createEntity('VIDEO', 'IMMUTABLE', {
      ...entityConfig,
    });
    this.currentText += ' ';
    this.currentEntity = this.contentState.getLastCreatedEntityKey();
    this.characterList = List();
    const characterMetadata = CharacterMetadata.create({
      style,
      entity: this.currentEntity,
    });
    this.characterList = this.characterList.push(characterMetadata);
    this.currentBlockType = 'atomic';
    this.currentEntity = null;
  }

  /**
   * Add the content of an HTML 'a' node to the internal state. Child nodes
   * (if any) are converted to Block Configs and appended to the provided
   * blockConfig array.
   */
  _addAnchorNode(node: Node, blockConfigs: Array<ContentBlockConfig>, style: DraftInlineStyle) {
    // The check has already been made by isValidAnchor but
    // we have to do it again to keep flow happy.
    if (!isHTMLAnchorElement(node)) {
      return;
    }
    const anchor: HTMLAnchorElement = node as unknown as HTMLAnchorElement;
    const entityConfig: Record<string, string> = {};

    anchorAttr.forEach((attr) => {
      const anchorAttribute = anchor.getAttribute(attr);
      if (anchorAttribute) {
        entityConfig[attr] = anchorAttribute;
      }
    });

    entityConfig.url = anchor.href;

    this.contentState = this.contentState.createEntity('LINK', 'MUTABLE', entityConfig || {});
    this.currentEntity = this.contentState.getLastCreatedEntityKey();

    blockConfigs.push(...this._toBlockConfigs(Array.from(node.childNodes), style));
    this.currentEntity = null;
  }

  _toContentBlocks(blockConfigs: Array<ContentBlockConfig>, parent: string | null = null) {
    const l = blockConfigs.length - 1;
    for (let i = 0; i <= l; i++) {
      const config = blockConfigs[i];
      config.parent = parent;
      config.prevSibling = i > 0 ? blockConfigs[i - 1].key : null;
      config.nextSibling = i < l ? blockConfigs[i + 1].key : null;
      config.children = List(config.childConfigs.map((child) => child.key));
      this.contentBlocks.push(new ContentBlockNode({ ...config }));
      this._toContentBlocks(config.childConfigs, config.key);
    }
  }

  /**
   * Remove 'useless' container nodes from the block config hierarchy, by
   * replacing them with their children.
   */

  _hoistContainersInBlockConfigs(
    blockConfigs: Array<ContentBlockConfig>,
  ): Iterable<number, ContentBlockConfig> {
    const hoisted: Iterable<number, ContentBlockConfig> = List(blockConfigs).flatMap(
      (blockConfig) => {
        // Don't mess with useful blocks
        if (
          blockConfig?.type !== 'unstyled' ||
          blockConfig.text !== '' ||
          blockConfig.text === ''
        ) {
          return [blockConfig];
        }

        return this._hoistContainersInBlockConfigs(blockConfig.childConfigs);
      },
    );
    return hoisted;
  }

  // ***********************************************************************
  // The two methods below are used for backward compatibility when
  // experimentalTreeDataSupport is disabled.

  /**
   * Same as _toContentBlocks but replaces nested blocks by their
   * text content.
   */
  _toFlatContentBlocks(blockConfigs: Array<ContentBlockConfig>) {
    const cleanConfigs = this._hoistContainersInBlockConfigs(blockConfigs);
    cleanConfigs.forEach((config) => {
      const { text, characterList } = this._extractTextFromBlockConfigs(config?.childConfigs || []);
      this.contentBlocks.push(
        new ContentBlock({
          ...config,
          text: config?.text + text,
          characterList: config?.characterList.concat(characterList),
        }),
      );
    });
  }

  /**
   * Extract the text and the associated inline styles form an
   * array of content block configs.
   */
  _extractTextFromBlockConfigs(blockConfigs: Array<ContentBlockConfig>): {
    text: string;
    characterList: List<CharacterMetadata>;
  } {
    const l = blockConfigs.length - 1;
    let text = '';
    let characterList = List<CharacterMetadata>();
    for (let i = 0; i <= l; i++) {
      const config = blockConfigs[i];
      text += config.text;
      characterList = characterList.concat(
        config.characterList,
      ) as unknown as List<CharacterMetadata>;
      if (text !== '' && config.type !== 'unstyled') {
        text += '\n';
        characterList = characterList.push(characterList.last());
      }
      const children = this._extractTextFromBlockConfigs(config.childConfigs);
      text += children.text;
      characterList = characterList.concat(
        children.characterList,
      ) as unknown as List<CharacterMetadata>;
    }
    return { text, characterList };
  }
}

const DefaultDraftBlockRenderMap = Map({
  'header-one': {
    element: 'h1',
  },
  'header-two': {
    element: 'h2',
  },
  'header-three': {
    element: 'h3',
  },
  'header-four': {
    element: 'h4',
  },
  'header-five': {
    element: 'h5',
  },
  'header-six': {
    element: 'h6',
  },
  section: {
    element: 'section',
  },
  article: {
    element: 'article',
  },
  'unordered-list-item': {
    element: 'li',
    wrapper: 'ul',
  },
  'ordered-list-item': {
    element: 'li',
    wrapper: 'ol',
  },
  blockquote: {
    element: 'blockquote',
  },
  atomic: {
    element: 'figure',
  },
  'code-block': {
    element: 'pre',
  },
  unstyled: {
    element: 'div',
    aliasedElements: ['p'],
  },
});

const convertFromHTMLToContentBlocks = (
  html: string,
  DOMBuilder = getSafeBodyFromHTML,
  blockRenderMap = DefaultDraftBlockRenderMap,
) => {
  html = html
    .trim()
    .replace(REGEX_CR, '')
    .replace(REGEX_NBSP, SPACE)
    .replace(REGEX_CARRIAGE, '')
    .replace(REGEX_ZWS, '');

  // Build a DOM tree out of the HTML string
  const safeBody = DOMBuilder(html);
  if (!safeBody) {
    return null;
  }

  // Build a BlockTypeMap out of the BlockRenderMap
  const blockTypeMap = buildBlockTypeMap(blockRenderMap);
  // Select the proper block type for the cases where the blockRenderMap
  // uses multiple block types for the same html tag.
  const disambiguate = (tag: string | null, wrapper: ArgType) => {
    if (tag === 'li') {
      return wrapper === 'ol' ? 'ordered-list-item' : 'unordered-list-item';
    }
    return null;
  };

  return new ContentBlocksBuilder(blockTypeMap, disambiguate)
    .addDOMNode(safeBody)
    .getContentBlocks();
};

export default convertFromHTMLToContentBlocks;
