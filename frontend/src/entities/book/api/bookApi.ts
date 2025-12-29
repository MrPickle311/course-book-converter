import {BooksService} from "@/shared/api/openapi";
import {type Book, BookStatus} from "@/entities/book";
import type {Metrics} from "@/entities/metrics";

export const booksApi = {

    deleteBook: async (book: Book): Promise<void> => {
        await BooksService.deleteBook({ uploadId: book.id });
    },

    getBookDetails: async (bookId: string): Promise<Book> => {
        const detail = await BooksService.getBookById({ uploadId: bookId });
        return detail as unknown as Book;
    },

    getBooksList: async (page: number, pageSize: number): Promise<{ metrics: Metrics, books: Book[] }> => {
        const res = await BooksService.getBooksList({ page, pageSize });
        return {
            metrics: res.data.metrics as unknown as Metrics,
            books: res.data.items.map((bookSummary) => {
                return {
                    id : bookSummary.id,
                    chapters: [],
                    progressData: bookSummary.progressData,
                    lastUsedAt: bookSummary.lastUsedAt,
                    generatedCoursesCount: bookSummary.generatedCoursesCount,
                    status: bookSummary.status as unknown as BookStatus,
                    title: bookSummary.title,
                    uploadDate: bookSummary.uploadDate
                } as Book
            })
        };
    }
};
