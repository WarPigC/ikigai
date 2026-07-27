import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function SlideViewer({ fileUrl, onTimingUpdate }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPdf, setIsPdf] = useState(true);
  const [error, setError] = useState(null);
  
  // Timing state refs to avoid React render cycle warnings
  const timingsRef = useRef({});
  const pageNumberRef = useRef(1);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // Sync state to ref
  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  // Listen to keyboard events for Left/Right navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        setPageNumber((prev) => {
          if (prev < numPages) {
            updateCurrentSlideTime();
            return prev + 1;
          }
          return prev;
        });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        setPageNumber((prev) => {
          if (prev > 1) {
            updateCurrentSlideTime();
            return prev - 1;
          }
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages]);

  // Update time when slide changes or component unmounts
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    // Setup interval to keep updating parent with latest timings
    intervalRef.current = setInterval(() => {
      updateCurrentSlideTime();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pageNumber]);

  const updateCurrentSlideTime = () => {
    const now = Date.now();
    const elapsedSecs = Math.floor((now - startTimeRef.current) / 1000);
    
    if (elapsedSecs < 1) return; // Optimize
    
    const currentAcc = timingsRef.current[pageNumberRef.current] || 0;
    timingsRef.current = { 
      ...timingsRef.current, 
      [pageNumberRef.current]: currentAcc + elapsedSecs 
    };
    
    startTimeRef.current = now;
    
    // Notify parent
    if (onTimingUpdate) {
      const timingsArray = Object.keys(timingsRef.current).map(key => ({
        slide: parseInt(key),
        duration: timingsRef.current[key]
      }));
      const totalDuration = Object.values(timingsRef.current).reduce((a, b) => a + b, 0);
      
      // Wrap in setTimeout to ensure we don't update parent state during a render cycle
      setTimeout(() => {
        onTimingUpdate(timingsArray, totalDuration);
      }, 0);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsPdf(true);
    startTimeRef.current = Date.now();
  };

  const onDocumentLoadError = (err) => {
    console.warn("Failed to load as PDF, falling back to iframe.", err);
    // Wrap in setTimeout to prevent "Cannot update component during render"
    setTimeout(() => {
      setIsPdf(false);
      setError(err.message);
    }, 0);
  };

  const prevPage = () => {
    setPageNumber((prev) => {
      if (prev > 1) {
        updateCurrentSlideTime();
        return prev - 1;
      }
      return prev;
    });
  };

  const nextPage = () => {
    setPageNumber((prev) => {
      if (prev < numPages) {
        updateCurrentSlideTime();
        return prev + 1;
      }
      return prev;
    });
  };

  // If the file is not a PDF (e.g. PPTX), fallback to Google Docs iframe
  // Cloudinary URLs might not have a .pdf extension, so we attempt to render them first.
  const isDefinitelyNotPdf = fileUrl && !fileUrl.toLowerCase().includes('.pdf') && !fileUrl.toLowerCase().includes('cloudinary');
  
  if (!isPdf || isDefinitelyNotPdf) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="bg-yellow-50 text-yellow-800 text-xs p-3 flex justify-between items-center border-b border-yellow-200">
          <span>⚠️ Slide-by-slide tracking is only available for PDF presentations. Please ask the team to upload a PDF.</span>
        </div>
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
          className="w-full h-full border-0"
          title="Presentation Viewer"
        />
      </div>
    );
  }

  // Ensure Cloudinary URLs have a .pdf extension for react-pdf to parse correctly
  let pdfUrl = fileUrl;
  if (pdfUrl && pdfUrl.includes('cloudinary') && !pdfUrl.toLowerCase().endsWith('.pdf') && !pdfUrl.toLowerCase().endsWith('.pptx')) {
    pdfUrl = `${pdfUrl}.pdf`;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white select-none">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="text-sm font-medium">Slide {pageNumber} of {numPages || '-'}</div>
        <div className="flex gap-2">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center text-gray-400 h-full">
              <div className="w-8 h-8 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin mb-4"></div>
              <p>Loading Presentation...</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={Math.min(window.innerWidth * 0.5, 1000)} // Responsive width based on panel size
            className="shadow-2xl"
          />
        </Document>
      </div>
      
      <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 text-center">
        <span>Use <kbd className="bg-gray-700 px-1 rounded mx-1">←</kbd> <kbd className="bg-gray-700 px-1 rounded mx-1">→</kbd> keys to navigate</span>
      </div>
    </div>
  );
}
