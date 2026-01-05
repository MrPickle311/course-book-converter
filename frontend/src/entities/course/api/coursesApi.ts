import { CourseService, type GenerateCourseRequest } from "@/shared/api/openapi";

export const coursesApi = {

    generateCourse: async (chapterId: string, bookId: string): Promise<void> => {
        const req: GenerateCourseRequest = {
            chapterId: chapterId,
            uploadId: bookId
        };
        await CourseService.generateCourse({ requestBody: req });
    },

    getCourseNotes: async (bookId: string, chapterId: string): Promise<string> => {
        return CourseService.getChapterNotes({ uploadId: bookId, chapterId });
    },

    updateChapterNotes: async (bookId: string, chapterId: string, notes: string): Promise<void> => {
        await CourseService.updateChapterNotes({ uploadId: bookId, chapterId, requestBody: notes });
    },

    deleteCourse: async (bookId: string, chapterId: string): Promise<void> => {
        await CourseService.deleteCourse({ uploadId: bookId, chapterId });
    }
}