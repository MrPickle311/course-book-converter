import {OpenAPI} from "@/shared/api/openapi";

export const configureApi = (): void => {
    OpenAPI.BASE = 'http://localhost:8080';
    OpenAPI.HEADERS = {
        Accept: 'application/json, text/plain, text/markdown, */*',
    } as any;
}