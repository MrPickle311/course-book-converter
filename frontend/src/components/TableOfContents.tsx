import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import { type Chapter } from '@/openapi';

interface Book {
  id: string;
  title: string;
  uploadDate: string;
  tableOfContents: Chapter[];
}

interface TableOfContentsProps {
  book: Book;
  onChapterSelect: (chapter: Chapter) => void;
}

export function TableOfContents({ book, onChapterSelect }: TableOfContentsProps) {
  const handleGenerateCourse = (chapter: Chapter) => {
    onChapterSelect(chapter);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Book Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {book.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Uploaded: {new Date(book.uploadDate).toLocaleDateString()}</span>
                <Badge variant="secondary">
                  {book.tableOfContents.length} chapters
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3>Table of Contents Extracted Successfully</h3>
              <p className="text-sm text-muted-foreground">
                Select any chapter below to generate an interactive course with notes and practice tasks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Table of Contents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {book.tableOfContents.map((chapter, index) => (
            <div
              key={chapter.chapterId}
              className="group border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <h4>{chapter.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Page {chapter.startPage}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>~15 min read</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleGenerateCourse(chapter)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Generate Course
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Course Generation Info */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3>What happens next?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  📝
                </div>
                <p>Comprehensive study notes will be generated from the chapter content</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  ✅
                </div>
                <p>Interactive tasks and quizzes will test your understanding</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}