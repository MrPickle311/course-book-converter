import {DefaultService, type GenerateCourseRequest} from "@/shared/api/openapi";

export const coursesApi = {

    generateCourse: async (chapterId: string, bookId: string): Promise<void> => {
        const req: GenerateCourseRequest = {
            chapterId: chapterId,
            uploadId: bookId
        };
        await DefaultService.generateCourse({ requestBody: req });
    },

    getCourseNotes: async (bookId: string, chapterId: string): Promise<string> => {
        return DefaultService.getChapterNotes({uploadId: bookId, chapterId});
    }
}