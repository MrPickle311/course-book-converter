
import { useEffect, useState } from "react";
import { Tree } from "antd";
import type { DataNode } from "antd/es/tree";
import type { Block } from "@blocknote/core";

interface AntdStickyTableOfContentsProps {
    editor: any; // Using any for BlockNote editor as strictly typing it can be complex depending on installed versions
}

export const AntdStickyTableOfContents = ({ editor }: AntdStickyTableOfContentsProps) => {
    const [treeData, setTreeData] = useState<DataNode[]>([]);

    useEffect(() => {
        const updateToc = () => {
            // Get all blocks
            const blocks = editor.document;

            // Filter for headings
            // console.log(blocks.map((it: Block) => it.props))
            const headings = blocks.filter((block: Block) =>
                ['heading'].includes(block.type) && (block.props as any).level <= 3
            );

            const newTreeData: DataNode[] = [];
            const stack: { level: number, node: DataNode }[] = [];

            // Helper to get numeric level from heading type
            const getLevel = (block: Block): number => {
                if (block.type === 'heading' && (block.props as any).level == 1) return 1;
                if (block.type === 'heading' && (block.props as any).level == 2) return 2;
                if (block.type === 'heading' && (block.props as any).level == 3) return 3;
                return 1; // Default
            };

            headings.forEach((heading: Block) => {
                const level = getLevel(heading);
                // BlockNote structure for content: heading.content is typically an array of inline content objects.
                // We need to extract plain text.
                // @ts-ignore - BlockNote types for content can be tricky, typically it's an array or string depending on version
                const text = Array.isArray(heading.content)
                    ? heading.content.map((c: any) => c.text || '').join('')
                    : (heading.content as any)?.text || '';

                if (!text) return;

                const node: DataNode = {
                    key: heading.id,
                    title: text,
                    children: []
                };

                // Core Logic:
                // Find the correct parent in the stack.
                // We pop items from the stack that are deeper or equal level to current.
                // Example: if current is H2 (level 2), we want to be under an H1 (level 1).
                // So we pop H2s, H3s, etc. until we find an H1 or stack empty.

                // However, the stack should represent the current "path" of open parents.
                // If we have H1, H2, H3 in stack.
                // Next is H2.
                // We pop H3. Top is H2. We pop H2. Top is H1.
                // We push current H2 to H1's children.
                // Push H2 to stack.

                while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                    stack.pop();
                }

                if (stack.length === 0) {
                    newTreeData.push(node);
                } else {
                    const parent = stack[stack.length - 1].node;
                    if (parent.children) {
                        parent.children.push(node);
                    }
                }

                stack.push({ level, node });
            });

            setTreeData(newTreeData);
        };

        // Initial load
        updateToc();

        // Listen for changes
        // BlockNote's onChange in useCreateBlockNote handles updates, but we need to hook into the editor instance directly if possible
        // or rely on the parent re-rendering this component if 'editor' reference doesn't change but content does?
        // Actually, editor instance usually stays same. We need to subscribe.
        // BlockNote > 0.10 uses editor.onChange(callback)

        const cleanup = editor.onChange(() => {
            updateToc();
        });

        return () => {
            // cleanup if strictly needed, though editor.onChange usually returns void or unsubscribe
            // Check BlockNote docs or existing code patterns.
            // If it returns a function, call it.
            if (typeof cleanup === 'function') cleanup();
        };

    }, [editor]);

    const onSelect = (selectedKeys: any[]) => {
        if (selectedKeys.length > 0) {
            const key = selectedKeys[0];
            const element = document.querySelector(`[data-id="${key}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    if (treeData.length === 0) return null;

    return (
        <div style={{
            position: 'sticky',
            top: 100,
            maxHeight: 'calc(100vh - 120px)', // adjust for top offset and bottom padding
            overflowY: 'auto',
            width: '250px',
            paddingRight: '10px'
        }}>
            <Tree
                treeData={treeData}
                showLine={true}
                defaultExpandAll
                onSelect={onSelect}
                blockNode
            />
        </div>
    );
};
