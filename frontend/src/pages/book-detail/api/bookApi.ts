import { DefaultService } from "@/shared/api/openapi";
import type { Book } from "@/entities/book";
import type { Metrics } from "@/entities/metrics";

export const booksApi = {

    deleteBook: async (book: Book): Promise<void> => {
        await DefaultService.deleteBook({ uploadId: book.id });
    },

    getBookDetails: async (bookId: string): Promise<Book> => {
        const detail = await DefaultService.getBookById({ uploadId: bookId });
        return detail as unknown as Book;
    },

    getBooksList: async (page: number, pageSize: number): Promise<{ metrics: Metrics, books: Book[] }> => {
        const res = await DefaultService.getBooksList({ page, pageSize });
        return {
            metrics: res.data.metrics as unknown as Metrics,
            books: res.data.items as Book[]
        };
    }
};
