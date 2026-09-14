import { useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { classNames, formatFileSize } from '../../lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  label?: string;
  hint?: string;
}

export default function FileUpload({
  accept = 'image/*',
  multiple = false,
  maxSize = 5 * 1024 * 1024,
  files,
  onFilesChange,
  label = 'Upload images',
  hint = 'PNG, JPG, WEBP up to 5MB',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles).filter((f) => f.size <= maxSize);
    onFilesChange(multiple ? [...files, ...valid] : [valid[0]]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium text-white/70">{label}</label>}
      <div
        className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-white/30" />
        <div className="text-center">
          <p className="text-sm text-white/60">
            <span className="text-amber-500 font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-white/30 mt-1">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, idx) => (
            <div key={idx} className="relative group bg-white/5 rounded-lg p-3 flex items-center gap-3">
              <Image className="w-8 h-8 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{file.name}</p>
                <p className="text-xs text-white/40">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
