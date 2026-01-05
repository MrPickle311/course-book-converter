import {useEffect, useRef, useState} from "react";
// @ts-ignore
import "@blocknote/core/fonts/inter.css";
import {BlockNoteView} from "@blocknote/mantine";
// @ts-ignore
import "@blocknote/mantine/style.css";
import {useCreateBlockNote} from "@blocknote/react";
import {Flex, theme} from "antd";
// @ts-ignore
import "highlight.js/styles/github-dark.css";
import {BlockNoteSchema, createCodeBlockSpec} from "@blocknote/core";
import {codeBlockOptions} from "@blocknote/code-block";
import {AntdStickyTableOfContents} from "./StickyTableOfContents";
import {editorTheme} from "@/pages/course-content/ui/styles/editorStyles.ts";


export interface RichTextEditorProps {
    content: string;
    onSave: (content: string) => void;
    isEditable?: boolean;
}

export const RichTextEditor =(props: RichTextEditorProps) => {
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
    const [blocksLoaded, setBlocksLoaded] = useState(false);

    useEffect(function loadContent () {
            if (props.content && isFirstRender.current) {
                const blocks = editor.tryParseMarkdownToBlocks(props.content);
                editor.replaceBlocks(editor.document, blocks);
                isFirstRender.current = false;
                setBlocksLoaded(true);
            } else {
                setBlocksLoaded(true);
            }
    }, [props.content, editor]);

    const handleChange = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(async () => {
            const markdown = editor.blocksToMarkdownLossy(editor.document);
            props.onSave(markdown);
        }, 1000);
    };


    return (
        blocksLoaded && (
            <Flex gap={'24px'} align={'flex-start'}>
                <Flex flex={1}>
                    <BlockNoteView
                        editor={editor}
                        editable={props.isEditable}
                        theme={editorTheme(token)}
                        onChange={handleChange}
                        sideMenu={true}
                        slashMenu={true}
                        data-spellcheck="false"
                    />
                </Flex>
                <AntdStickyTableOfContents editor={editor} />
            </Flex>
        )
    );
}
