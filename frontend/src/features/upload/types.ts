export type NoteContentType = 'text' | 'code' | 'picture' | 'table';

export interface NoteContent {
  type: NoteContentType;
  value: string;
}

export interface CourseNotes {
  title: string;
  contents: NoteContent[];
}

export interface CourseTasksStub {
  items: { title: string }[];
}

export interface CourseModule {
  title: string;
  notes: CourseNotes;
  tasks: CourseTasksStub;
}
