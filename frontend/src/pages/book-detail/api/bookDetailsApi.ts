import {DefaultService} from "@/shared/api/openapi";
import type {Book} from "@/entities/book/model/types.ts";

export const booksDetailsApi = {

    deleteBook: async (book: Book): Promise<void> => {
        await DefaultService.deleteBook({ uploadId: book.id });
    }
};
