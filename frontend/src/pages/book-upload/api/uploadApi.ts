import {DefaultService, type ProcessPdfResponse} from "@/shared/api/openapi";
import type {Chapter} from "@/entities/book/model/types.ts";

export const uploadApi = {

    processPdf: async (file: Blob ): Promise<{isSuccess: boolean, chapters: Chapter[], bookId: string}> => {
        const resp: ProcessPdfResponse = await DefaultService.processPdf({ formData: {file} });
        return {
            isSuccess: resp.success,
            chapters: resp.data.chapters,
            bookId: resp.data.uploadId
        }
    }
}