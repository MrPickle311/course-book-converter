import {DefaultService} from "@/shared/api/openapi";
import type {BookDetail} from "@/entities/book/model/types.ts";

export const booksDetailsApi = {

    deleteBook: async (book: BookDetail): Promise<void> => {
        await DefaultService.deleteBook({ uploadId: book.id });
    }
};
