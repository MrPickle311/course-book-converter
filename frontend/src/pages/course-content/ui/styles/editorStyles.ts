import type {Theme} from "@blocknote/mantine";
import type {GlobalToken} from "antd";

export const editorTheme = (token: GlobalToken): Theme => {
    return {
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
    }
};
