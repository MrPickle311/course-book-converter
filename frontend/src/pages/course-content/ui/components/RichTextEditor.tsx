import { useEffect, useRef, useState } from "react";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView, type Theme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { theme } from "antd";
import "highlight.js/styles/github-dark.css";
import { BlockNoteSchema, createCodeBlockSpec } from "@blocknote/core";
import { codeBlockOptions } from "@blocknote/code-block";
import { AntdStickyTableOfContents } from "./StickyTableOfContents";


export interface RichTextEditorProps {
    content: string;
    onSave: (content: string) => void;
    isEditable?: boolean;
}

export const RichTextEditor = ({ content, onSave, isEditable = true }: RichTextEditorProps) => {
    const { token } = theme.useToken();
    const editor = useCreateBlockNote({
        domAttributes: {
            editor: {
                spellcheck: "false",
            },
        },
        schema: BlockNoteSchema.create().extend({
            blockSpecs: {
                codeBlock: createCodeBlockSpec(codeBlockOptions),
            }
        })
    });
    const isFirstRender = useRef(true);
    const timeoutRef = useRef<NodeJS.Timeout>(null);
    const [blocksLoaded, setBlocksLoaded] = useState(false); // To prevent empty flash

    useEffect(() => {
        const loadContent = async () => {
            if (content && isFirstRender.current) {
                const blocks = await editor.tryParseMarkdownToBlocks(content);
                editor.replaceBlocks(editor.document, blocks);
                isFirstRender.current = false;
                setBlocksLoaded(true);
            } else {
                setBlocksLoaded(true);
            }
        };
        loadContent();
    }, [content, editor]);

    const handleChange = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(async () => {
            const markdown = await editor.blocksToMarkdownLossy(editor.document);
            onSave(markdown);
        }, 1000);
    };

    const customTheme: Theme = {
        colors: {
            editor: {
                text: token.colorText,
                background: token.colorBgContainer,
            },
            menu: {
                text: token.colorText,
                background: token.colorBgElevated,
            },
            tooltip: {
                text: token.colorText,
                background: token.colorBgElevated,
            },
            hovered: {
                text: token.colorText,
                background: token.colorFillTertiary,
            },
            selected: {
                text: token.colorTextLightSolid,
                background: token.colorPrimary,
            },
            disabled: {
                text: token.colorTextDisabled,
                background: token.colorBgContainerDisabled,
            },
            shadow: token.boxShadow,
            border: token.colorBorder,
            sideMenu: token.colorTextSecondary,
            highlights: {
                gray: {
                    text: token.colorText,
                    background: token.colorFillSecondary,
                }
            },
        },
        borderRadius: token.borderRadius,
        fontFamily: token.fontFamily,
    };

    return (
        blocksLoaded && (
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <BlockNoteView
                        editor={editor}
                        editable={isEditable}
                        theme={customTheme}
                        onChange={handleChange}
                        sideMenu={true}
                        slashMenu={true}
                        data-spellcheck="false"
                    />
                </div>
                <AntdStickyTableOfContents editor={editor} />
            </div>
        )
    );
}
