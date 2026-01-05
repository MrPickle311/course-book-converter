import { OpenAPI } from "@/shared/api/openapi";

export const API_BASE_URL = 'http://localhost:8080';

export const configureApi = (): void => {
    OpenAPI.BASE = API_BASE_URL;
    OpenAPI.HEADERS = {
        Accept: 'application/json, text/plain, text/markdown, */*',
    } as any;
}