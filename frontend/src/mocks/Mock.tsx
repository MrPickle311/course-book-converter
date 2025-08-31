// Types for structured notes
export type RichTextBlock = {
  type: 'richText';
  markdown: string;
  title?: string;
};

export type TableBlock = {
  type: 'table';
  title?: string;
  headers: string[];
  rows: string[][];
};

export type CodeBlock = {
  type: 'code';
  title?: string;
  language: string;
  code: string;
};

export type FigureBlock = {
  type: 'figure';
  caption?: string;
  // Path relative to src/mocks/
  src: string;
};

export type NoteBlock = RichTextBlock | TableBlock | CodeBlock | FigureBlock;

// Helper: a compact default set demonstrating all four content types
export const defaultDemoBlocks: NoteBlock[] = [
  {
    type: 'richText',
    title: 'Overview',
    markdown:
      '# Overview\n\nThis chapter introduces key concepts with rich text, a table, code, and figures.\n\n- Trade-offs and decision records (ADRs)\n- Fitness functions for automated governance\n- Reading performance graphs and metrics',
  },
  {
    type: 'table',
    title: 'Sample Metrics',
    headers: ['Metric', 'Meaning'],
    rows: [
      ['Throughput', 'Rate of work (ops/sec)'],
      ['Latency', 'Time per unit of work'],
      ['Scalability', 'How performance changes with added resources'],
    ],
  },
  {
    type: 'code',
    title: 'Sample Code Snippet',
    language: 'java',
    code: 'public class Example {\n  public static void main(String[] args) {\n    System.out.println("Hello, Notes!");\n  }\n}',
  },
  {
    type: 'figure',
    caption: 'Example figure',
    src: 'architecture-the-hard-parts/figure-1-1.png',
  },
];

// Architecture: The Hard Parts — Chapter 1 derived blocks (from chapter1_notes.md)
export const architectureTheHardParts: Record<string, NoteBlock[]> = {
  'Chapter 1': [
    {
      type: 'richText',
      title: 'No Best Practices — Only Trade-offs',
      markdown:
        '### Chapter 1: What Happens When There Are No “Best Practices”?\n\nArchitecture is about balancing trade-offs to reach the least-worst decision.\n\n- Document decisions using **ADRs** (context, decision, consequences)\n- Use **Architecture Fitness Functions** to automate governance\n- Differentiate **operational** (OLTP) and **analytical** data',
    },
    {
      type: 'table',
      title: 'Sysops Squad Monolith Components',
      headers: ['Component', 'Namespace', 'Responsibility'],
      rows: [
        ['Login', 'ss.login', 'Internal user and customer login/security'],
        ['Billing Payment', 'ss.billing.payment', 'Monthly billing and credit cards'],
        ['Customer Profile', 'ss.customer.profile', 'Maintain customer profile'],
        ['Ticket', 'ss.ticket', 'Ticket creation, maintenance, completion'],
      ],
    },
    {
      type: 'code',
      title: 'Detect Cycles with JDepend',
      language: 'java',
      code:
        'public class CycleTest {\n    private JDepend jdepend;\n\n    @BeforeEach\n    void init() {\n      jdepend = new JDepend();\n      jdepend.addDirectory("/path/to/persistence/classes");\n      jdepend.addDirectory("/path/to/web/classes");\n      jdepend.addDirectory("/path/to/thirdpartyjars");\n    }\n\n    @Test\n    void testAllPackages() {\n      Collection packages = jdepend.analyze();\n      assertEquals("Cycles exist", false, jdepend.containsCycles());\n    }\n}',
    },
    {
      type: 'figure',
      caption: 'Component cycle anti-pattern (Figure 1-1)',
      src: 'architecture-the-hard-parts/figure-1-1.png',
    },
  ],
  // Light samples for next chapters: use available figures and concise text
  'Chapter 2': [
    {
      type: 'richText',
      title: 'Chapter 2 Overview',
      markdown:
        'Key chapter insights with a focus on architectural characteristics and trade-offs.',
    },
    { type: 'figure', caption: 'Figure 2-1', src: 'architecture-the-hard-parts/figure-2-1.png' },
  ],
  'Chapter 3': [
    {
      type: 'richText',
      title: 'Chapter 3 Overview',
      markdown: 'Notes emphasizing modularity and bounded contexts.',
    },
    { type: 'figure', caption: 'Figure 3-1', src: 'architecture-the-hard-parts/figure-3-1.png' },
  ],
  'Chapter 4': [
    { type: 'richText', markdown: 'Notes on workflow and evolution of architecture.' },
    { type: 'figure', caption: 'Figure 4-1', src: 'architecture-the-hard-parts/figure-4-1.png' },
  ],
  'Chapter 5': [
    { type: 'richText', markdown: 'Notes on governance and fitness function composition.' },
    { type: 'figure', caption: 'Figure 5-1', src: 'architecture-the-hard-parts/figure-5-1.png' },
  ],
  'Chapter 6': [
    { type: 'richText', markdown: 'Notes on data and analytical architectures.' },
    { type: 'figure', caption: 'Figure 6-1', src: 'architecture-the-hard-parts/figure-6-1.png' },
  ],
};

// Optimizing Java — Chapter 1 derived blocks (from chapter1_notes.md)
export const optimizingJava: Record<string, NoteBlock[]> = {
  'Chapter 1': [
    {
      type: 'richText',
      title: 'Optimization as Experimental Science',
      markdown:
        'Treat performance tuning as science: define goals, measure baseline, hypothesize, change, re-measure. Avoid outdated tips; JVM behavior is dynamic.',
    },
    {
      type: 'table',
      title: 'Performance Metrics',
      headers: ['Metric', 'Definition'],
      rows: [
        ['Throughput', 'Rate of work (e.g., TPS)'],
        ['Latency', 'Time for a single operation'],
        ['Capacity', 'Concurrent work in the system'],
        ['Utilization', 'Resource use percentage'],
        ['Efficiency', 'Throughput per resource unit'],
        ['Scalability', 'Throughput vs added resources'],
      ],
    },
    {
      type: 'code',
      title: 'Simple Timing Harness (Java)',
      language: 'java',
      code:
        'public static long time(Runnable r, int iterations) {\n  long start = System.nanoTime();\n  for (int i = 0; i < iterations; i++) r.run();\n  return System.nanoTime() - start;\n}',
    },
    {
      type: 'figure',
      caption: 'Performance elbow (Figure 1-1)',
      src: 'optimizing_java/figure-1-1.png',
    },
  ],
  'Chapter 2': [
    { type: 'richText', markdown: 'Measurement methodology and benchmarking pitfalls.' },
    { type: 'figure', caption: 'Figure 2-1', src: 'optimizing_java/figure-2-1.png' },
  ],
  'Chapter 3': [
    { type: 'richText', markdown: 'Understanding GC behavior and memory patterns.' },
    { type: 'figure', caption: 'Figure 3-1', src: 'optimizing_java/figure-3-1.png' },
  ],
  'Chapter 4': [
    { type: 'richText', markdown: 'Concurrency and scaling on modern JVMs.' },
    { type: 'figure', caption: 'Figure 4-1', src: 'optimizing_java/figure-4-1.png' },
  ],
  'Chapter 5': [
    { type: 'richText', markdown: 'Case studies and anti-patterns in optimization.' },
    { type: 'figure', caption: 'Figure 5-1', src: 'optimizing_java/figure-5-1.png' },
  ],
};

// Utility to pick blocks given a chapter title/number. If no match, return a demo set.
export function getMockNotesByChapter(chapterTitle: string): NoteBlock[] {
  const normalized = chapterTitle.toLowerCase();
  // Try to infer chapter number from the title
  const chapterNumMatch = normalized.match(/chapter\s*(\d+)/);
  const chapterKey = chapterNumMatch ? `Chapter ${chapterNumMatch[1]}` : undefined;

  if (chapterKey && architectureTheHardParts[chapterKey]) {
    return architectureTheHardParts[chapterKey];
  }
  if (chapterKey && optimizingJava[chapterKey]) {
    return optimizingJava[chapterKey];
  }

  // Keyword-based routing
  if (normalized.includes('introduction') || normalized.includes('getting started')) {
    return architectureTheHardParts['Chapter 1'];
  }
  if (normalized.includes('advanced') || normalized.includes('best practices')) {
    return optimizingJava['Chapter 1'];
  }

  return defaultDemoBlocks;
}


