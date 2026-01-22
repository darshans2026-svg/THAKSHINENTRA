import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import './HierarchicalSelector.css'; // For styling (see below)

const HierarchicalSelector = ({
  data, // Initial root data array
  fetchChildren, // Async function: (parentId) => Promise<Node[]>
  onSelect, // Callback: (selectedNodes) => void
  multiSelect = false, // Enable multi-select
  height = 400, // Container height for virtual list
  itemSize = 30, // Height per item
}) => {
  const [treeData, setTreeData] = useState(data || []);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [loadingIds, setLoadingIds] = useState(new Set());

  // Flatten tree for virtual scrolling (only visible nodes)
  const flattenedData = useMemo(() => {
    const flatten = (nodes, depth = 0) => {
      const result = [];
      nodes.forEach(node => {
        result.push({ ...node, depth });
        if (expandedIds.has(node.id) && node.children) {
          result.push(...flatten(node.children, depth + 1));
        }
      });
      return result;
    };
    return flatten(treeData);
  }, [treeData, expandedIds]);

  // Handle expand/collapse
  const toggleExpand = useCallback(async (node) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(node.id)) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
      // Load children if not already loaded
      if (!node.children && node.hasChildren) {
        setLoadingIds(prev => new Set(prev).add(node.id));
        try {
          const children = await fetchChildren(node.id);
          setTreeData(prev => updateNodeChildren(prev, node.id, children));
        } catch (error) {
          console.error('Failed to load children:', error);
        } finally {
          setLoadingIds(prev => {
            const updated = new Set(prev);
            updated.delete(node.id);
            return updated;
          });
        }
      }
    }
    setExpandedIds(newExpanded);
  }, [expandedIds, fetchChildren]);

  // Handle selection
  const toggleSelect = useCallback((node) => {
    const newSelected = new Set(selectedIds);
    if (multiSelect) {
      if (newSelected.has(node.id)) {
        newSelected.delete(node.id);
      } else {
        newSelected.add(node.id);
      }
    } else {
      newSelected.clear();
      newSelected.add(node.id);
    }
    setSelectedIds(newSelected);
    onSelect?.(Array.from(newSelected).map(id => findNodeById(treeData, id)));
  }, [selectedIds, multiSelect, onSelect, treeData]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e, node, index) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (node.hasChildren) toggleExpand(node);
        else toggleSelect(node);
        break;
      case 'ArrowRight':
        if (node.hasChildren && !expandedIds.has(node.id)) toggleExpand(node);
        break;
      case 'ArrowLeft':
        if (expandedIds.has(node.id)) toggleExpand(node);
        break;
      case 'ArrowDown':
        // Focus next item (handled by react-window)
        break;
      case 'ArrowUp':
        // Focus previous item
        break;
      default:
        break;
    }
  }, [toggleExpand, toggleSelect, expandedIds]);

  // Render individual item
  const Item = ({ index, style }) => {
    const node = flattenedData[index];
    const isSelected = selectedIds.has(node.id);
    const isExpanded = expandedIds.has(node.id);
    const isLoading = loadingIds.has(node.id);

    return (
      <div
        style={style}
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        role="treeitem"
        aria-expanded={node.hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={node.depth + 1}
        tabIndex={0}
        onClick={() => node.hasChildren ? toggleExpand(node) : toggleSelect(node)}
        onKeyDown={(e) => handleKeyDown(e, node, index)}
      >
        <span style={{ paddingLeft: `${node.depth * 20}px` }}>
          {node.hasChildren && (
            <button
              className="expand-btn"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              onClick={(e) => { e.stopPropagation(); toggleExpand(node); }}
            >
              {isLoading ? '...' : isExpanded ? '▼' : '▶️'}
            </button>
          )}
          {node.label}
        </span>
      </div>
    );
  };

  return (
    <div className="hierarchical-selector" role="tree" aria-label="Hierarchical Selector">
      <List
        height={height}
        itemCount={flattenedData.length}
        itemSize={itemSize}
        width="100%"
      >
        {Item}
      </List>
    </div>
  );
};

// Helper: Update node children in tree
const updateNodeChildren = (nodes, parentId, children) => {
  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, parentId, children) };
    }
    return node;
  });
};

// Helper: Find node by ID
const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export default React.memo(HierarchicalSelector);