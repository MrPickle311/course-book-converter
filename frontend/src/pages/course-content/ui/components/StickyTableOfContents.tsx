import { useEffect, useState } from "react";
import {Affix, Tree } from "antd";
import type { DataNode } from "antd/es/tree";
import  { type Block, BlockNoteEditor} from "@blocknote/core";

interface AntdStickyTableOfContentsProps {
    editor: BlockNoteEditor;
}

export const AntdStickyTableOfContents = (props: AntdStickyTableOfContentsProps) => {
    const [treeData, setTreeData] = useState<DataNode[]>([]);

    useEffect(() => {
        const updateTableOfContents = () => {
            const blocks = props.editor.document;

            const getMajorHeadings = () => {
                return blocks.filter((block: Block) =>
                    ['heading'].includes(block.type) && (block.props as any).level <= 3
                );
            }
            const headings = getMajorHeadings();

            const newTreeData: DataNode[] = [];
            const stack: { level: number, node: DataNode }[] = [];

            const getLevelOfHeading = (block: Block): number => {
                if (block.type === 'heading' && (block.props as any).level == 1) return 1;
                if (block.type === 'heading' && (block.props as any).level == 2) return 2;
                if (block.type === 'heading' && (block.props as any).level == 3) return 3;
                return 1;
            };

            headings.forEach((heading: Block) => {
                const level = getLevelOfHeading(heading);
                const getHeadingText = () => {
                    return Array.isArray(heading.content)
                        ? heading.content.map((c: any) => c.text || '').join('')
                        : (heading.content as any)?.text || '';
                }
                const text = getHeadingText();

                if (!text) {
                    return;
                }

                const node: DataNode = {
                    key: heading.id,
                    title: text,
                    children: []
                };

                const findRightParent = () => {
                    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                        stack.pop();
                    }
                }

                const putNodeInRightPlace = () => {
                    if (stack.length === 0) {
                        newTreeData.push(node);
                    } else {
                        const parent = stack[stack.length - 1].node;
                        if (parent.children) {
                            parent.children.push(node);
                        }
                    }

                    stack.push({level, node});
                }

                findRightParent();
                putNodeInRightPlace();
            });

            setTreeData(newTreeData);
        };

        updateTableOfContents();

        const cleanup = props.editor.onChange(() => {
            updateTableOfContents();
        });

        return () => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        };

    }, [props.editor]);

    const onSelect = (selectedKeys: any[]) => {
        if (selectedKeys.length > 0) {
            const key = selectedKeys[0];
            const element = document.querySelector(`[data-id="${key}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    if (treeData.length === 0) {
        return null;
    }

    return (
        <Affix offsetTop={100}
               style={{
                   maxHeight: 'calc(100vh - 120px)',
                   width: '250px'}}>
            <Tree
                treeData={treeData}
                showLine={true}
                defaultExpandAll
                onSelect={onSelect}
                blockNode
            />
        </Affix>
    );
};
