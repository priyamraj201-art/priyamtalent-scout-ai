import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Loader2, X, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import mammoth from 'mammoth';

interface ResumeUploadProps {
  resumeText: string;
  onResumeTextChange: (text: string) => void;
}

// Type for PDF.js library loaded from CDN
interface PDFPageTextContent {
  items: Array<{ str: string }>;
}

interface PDFPage {
  getTextContent: () => Promise<PDFPageTextContent>;
}

interface PDFDocument {
  numPages: number;
  getPage: (num: number) => Promise<PDFPage>;
}

interface PDFLoadingTask {
  promise: Promise<PDFDocument>;
}

interface PDFJSLib {
  getDocument: (params: { data: ArrayBuffer }) => PDFLoadingTask;
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
}

// Load PDF.js dynamically to avoid top-level await issues
const loadPdfJs = async (): Promise<PDFJSLib> => {
  if ((window as unknown as Record<string, PDFJSLib>).pdfjsLib) {
    return (window as unknown as Record<string, PDFJSLib>).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as unknown as Record<string, PDFJSLib>).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export function ResumeUpload({ resumeText, onResumeTextChange }: ResumeUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      let extractedText = '';
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        extractedText = await extractTextFromPDF(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        extractedText = await extractTextFromDocx(file);
      } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        toast.error('Legacy .doc format is not supported. Please convert to .docx or PDF.');
        setUploadedFile(null);
        setIsProcessing(false);
        return;
      } else {
        toast.error('Unsupported file format. Please upload a PDF or DOCX file.');
        setUploadedFile(null);
        setIsProcessing(false);
        return;
      }

      if (extractedText.trim()) {
        onResumeTextChange(extractedText);
        toast.success(`Resume extracted from ${file.name}`);
      } else {
        toast.error('Could not extract text from file. Please try pasting your resume text.');
        setUploadedFile(null);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file. Please try pasting your resume text.');
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File size must be less than 10MB');
          return;
        }
        processFile(file);
      }
    },
    [onResumeTextChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const clearFile = () => {
    setUploadedFile(null);
    onResumeTextChange('');
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          Your Resume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing file...</p>
            </div>
          ) : uploadedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileIcon className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? (
                  'Drop your resume here...'
                ) : (
                  <>
                    <span className="text-primary font-medium">Upload a file</span> or drag and
                    drop
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className="relative">
          <div className="absolute left-3 top-3 text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded">
            or paste text
          </div>
          <Textarea
            placeholder="Paste your resume text here..."
            value={resumeText}
            onChange={(e) => onResumeTextChange(e.target.value)}
            className="min-h-[200px] pt-10 resize-none bg-secondary/50 border-border focus:border-primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}
