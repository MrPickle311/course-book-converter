import {UploadService, type ProcessPdfResponse} from "@/shared/api/openapi";

export const uploadApi = {

    processPdf: async (file: Blob): Promise<{  bookId: string }> => {
        console.log(file)
        const resp: ProcessPdfResponse = await UploadService.processPdf({ formData: { file } });
        return {
            bookId: resp.uploadId
        }
    }
}