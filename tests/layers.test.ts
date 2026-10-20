import { describe, expect, it } from 'vitest';
import { placementForFrame, placementForRow, zoneForPointer } from '../src/layout/layers';
import type { Doc } from '../src/layout/ops';
import type { DocNode } from '../src/store/types';

const comp = (id: string, componentId = 'heading'): DocNode => ({
  id,
  type: 'component',
  componentId,
  variant: 'h1',
});

/** f1: [sA [cA [gA [colA [a, b]]]], sB [cB [gB [colB []]]], masthead]   f2: [] */
function fixture(): Doc {
  const n = (id: string, type: DocNode['type'], children: string[] = []): DocNode => ({
    id,
    type,
    children,
  });
  return {
    frames: [
      {
        id: 'f1',
        name: 'One',
        kitId: 'nsw',
        device: 'iphone',
        width: 393,
        x: 0,
        y: 0,
        root: ['sA', 'sB', 'm'],
      },
      { id: 'f2', name: 'Two', kitId: 'nsw', device: 'iphone', width: 393, x: 500, y: 0, root: [] },
    ],
    nodes: {
      sA: n('sA', 'section', ['cA']),
      cA: n('cA', 'container', ['gA']),
      gA: n('gA', 'grid', ['colA']),
      colA: n('colA', 'column', ['a', 'b']),
      a: comp('a'),
      b: comp('b'),
      sB: n('sB', 'section', ['cB']),
      cB: n('cB', 'container', ['gB']),
      gB: n('gB', 'grid', ['colB']),
      colB: n('colB', 'column'),
      m: comp('m', 'masthead'),
    },
  };
}

describe('zones', () => {
  it('splits a row into before, inside and after', () => {
    expect(zoneForPointer(101, 100, 30)).toBe('before');
    expect(zoneForPointer(115, 100, 30)).toBe('inside');
    expect(zoneForPointer(129, 100, 30)).toBe('after');
  });
});

describe('where a layer drop lands', () => {
  const doc = fixture();

  it('reorders among siblings, using the index without the dragged node', () => {
    expect(placementForRow(doc, 'a', 'b', 'after')).toEqual({
      frameId: 'f1',
      parentId: 'colA',
      index: 1,
      chainFrom: null,
    });
    expect(placementForRow(doc, 'b', 'a', 'before')).toEqual({
      frameId: 'f1',
      parentId: 'colA',
      index: 0,
      chainFrom: null,
    });
    expect(placementForRow(doc, 'a', 'a', 'after')).toBeNull();
  });

  it('drops inside a container that can hold the node, at the end', () => {
    expect(placementForRow(doc, 'a', 'colB', 'inside')).toEqual({
      frameId: 'f1',
      parentId: 'colB',
      index: 0,
      chainFrom: null,
    });
    expect(placementForRow(doc, 'b', 'colA', 'inside')).toEqual({
      frameId: 'f1',
      parentId: 'colA',
      index: 1,
      chainFrom: null,
    });
  });

  it('falls back to before or after when "inside" is not allowed', () => {
    expect(placementForRow(doc, 'a', 'b', 'inside', 0.2)).toEqual({
      frameId: 'f1',
      parentId: 'colA',
      index: 0,
      chainFrom: null,
    });
    expect(placementForRow(doc, 'a', 'b', 'inside', 0.9)).toEqual({
      frameId: 'f1',
      parentId: 'colA',
      index: 2 - 1,
      chainFrom: null,
    });
  });

  it('refuses drops the tree rules forbid', () => {
    expect(placementForRow(doc, 'a', 'sB', 'before')).toBeNull(); // a component can't sit in the frame root
    expect(placementForRow(doc, 'a', 'cB', 'inside')).toBeNull(); // a container holds grids
    expect(placementForRow(doc, 'colA', 'colB', 'after')).toBeNull(); // columns don't move
  });

  it('refuses to drop a node into itself or its descendants', () => {
    expect(placementForRow(doc, 'sA', 'colA', 'inside')).toBeNull();
    expect(placementForRow(doc, 'sA', 'a', 'after')).toBeNull();
  });

  it('moves sections and full-width components among the frame root', () => {
    expect(placementForRow(doc, 'sB', 'sA', 'before')).toEqual({
      frameId: 'f1',
      parentId: null,
      index: 0,
      chainFrom: null,
    });
    expect(placementForRow(doc, 'm', 'sA', 'before')).toEqual({
      frameId: 'f1',
      parentId: null,
      index: 0,
      chainFrom: null,
    });
    expect(placementForRow(doc, 'sA', 'm', 'after')).toEqual({
      frameId: 'f1',
      parentId: null,
      index: 2,
      chainFrom: null,
    });
  });

  it('puts a node at the end of a frame when dropped on its row, if it belongs there', () => {
    expect(placementForFrame(doc, 'sA', 'f2')).toEqual({
      frameId: 'f2',
      parentId: null,
      index: 0,
      chainFrom: null,
    });
    expect(placementForFrame(doc, 'm', 'f1')).toEqual({
      frameId: 'f1',
      parentId: null,
      index: 2,
      chainFrom: null,
    });
    expect(placementForFrame(doc, 'a', 'f2')).toBeNull();
  });
});
