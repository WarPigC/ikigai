import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, Send } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SlideViewer({ fileUrl, onTimingUpdate, onAiQuery }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPdf, setIsPdf] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  
  // AI Assistant State
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Timer UI State
  const [currentSlideTime, setCurrentSlideTime] = useState(0);
  const [totalPresentationTime, setTotalPresentationTime] = useState(0);

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;

    const userMessage = { role: "user", content: aiQuery };
    
    // Save to backend via parent handler
    if (onAiQuery) {
      onAiQuery(aiQuery);
    }

    setChatHistory((prev) => [...prev, userMessage]);
    setAiQuery("");
    setIsAiLoading(true);

    try {
      const token = localStorage.getItem("care_token") || sessionStorage.getItem("care_token");
      
      const res = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          documentUrl: fileUrl,
          query: userMessage.content,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "assistant", content: "Error: " + data.message }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: "assistant", content: "Failed to connect to AI service." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

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
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        prevPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages, isPdf]);

  // Update time when slide changes or component unmounts
  useEffect(() => {
    startTimeRef.current = Date.now();
    setCurrentSlideTime(timingsRef.current[pageNumber] || 0);
    
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
    const newSlideTime = currentAcc + elapsedSecs;
    timingsRef.current = { 
      ...timingsRef.current, 
      [pageNumberRef.current]: newSlideTime 
    };
    
    startTimeRef.current = now;
    
    // Notify parent
    if (onTimingUpdate) {
      const timingsArray = Object.keys(timingsRef.current).map(key => ({
        slide: parseInt(key),
        duration: timingsRef.current[key]
      }));
      const totalDuration = Object.values(timingsRef.current).reduce((a, b) => a + b, 0);
      
      setCurrentSlideTime(newSlideTime);
      setTotalPresentationTime(totalDuration);
      
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
      // If it's a virtual tracker (iframe), we don't know max pages, so we allow infinite next.
      if (!isPdf || prev < numPages) {
        updateCurrentSlideTime();
        return prev + 1;
      }
      return prev;
    });
  };

  const renderAiPanel = () => (
    <>
      {/* Floating Button */}
      {!showAiPanel && (
        <button
          onClick={() => setShowAiPanel(true)}
          className="absolute bottom-16 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.8)] flex items-center gap-2 transition-all hover:scale-105 z-50 group border border-blue-500"
        >
          <Sparkles size={24} className="animate-pulse" />
          <span className="font-semibold hidden group-hover:inline pr-2 tracking-wide">Ask AI</span>
        </button>
      )}

      {/* AI Panel Drawer */}
      {showAiPanel && (
        <div className="absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white/95 backdrop-blur-xl border-l border-blue-100 shadow-[-10px_0_40px_rgba(37,99,235,0.1)] flex flex-col z-50 transition-all duration-300">
          <div className="p-5 border-b border-blue-50 bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center shrink-0">
            <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg">
              <Sparkles size={20} className="text-blue-600" /> Ask AI
            </h3>
            <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100/50 hover:bg-slate-200 rounded-lg p-1.5 transition-colors">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-white to-blue-50/30">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-500 mt-12 text-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Sparkles size={28} className="text-blue-500 opacity-80" />
                </div>
                <p className="max-w-[250px] leading-relaxed">Ask me to summarize this presentation, explain complex diagrams, or evaluate the novelty of the idea.</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none shadow-blue-500/20" : "bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-slate-200/50 leading-relaxed"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-3 shadow-sm shadow-slate-200/50">
                  <div className="w-4 h-4 border-2 border-t-blue-500 border-blue-100 rounded-full animate-spin"></div>
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAiSubmit} className="p-4 border-t border-slate-100 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about this presentation..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner transition-all placeholder:text-slate-400"
                disabled={isAiLoading}
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || isAiLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center shadow-md shadow-blue-500/20"
              >
                <Send size={18} className={aiQuery.trim() && !isAiLoading ? "translate-x-0.5 transition-transform" : ""} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );

  // Ensure legacy Cloudinary URLs without extension get .pptx for proper fallback
  let documentUrl = fileUrl || "";
  
  // Ensure the URL uses https, as Office Viewer requires https
  if (documentUrl && documentUrl.startsWith("http://")) {
    documentUrl = documentUrl.replace("http://", "https://");
  }

  const isDefinitelyNotPdf = documentUrl && !documentUrl.split("?")[0].toLowerCase().endsWith('.pdf');
  
  if (!isPdf || isDefinitelyNotPdf) {
    // Use Microsoft Office Viewer for PPT/PPTX as it natively supports slide-by-slide presentation mode
    // Append wdSlideId so that when pageNumber state changes, the iframe reloads to that slide!
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}&wdSlideId=${pageNumber}`;
    
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 text-slate-800 select-none relative overflow-hidden font-sans">
        <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-blue-100 shadow-[0_2px_10px_rgba(37,99,235,0.05)] z-10 relative">
          <div className="flex flex-col">
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Tracker Sync — Slide 
              <input 
                type="number" 
                value={pageNumber} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    updateCurrentSlideTime();
                    setPageNumber(val);
                  }
                }}
                className="w-12 text-center bg-slate-100 border border-slate-300 rounded px-1 py-0.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold tabular-nums">
                {currentSlideTime}s
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 tracking-wide font-medium">USE TOP BUTTONS OR ARROW KEYS TO NAVIGATE SLIDES</div>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-xs text-blue-600 font-semibold mr-1 hidden md:inline uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">
              Total: {totalPresentationTime}s
            </span>
            <button
              onClick={prevPage}
              disabled={pageNumber <= 1}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all shadow-sm"
              title="Previous Slide Time"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPage}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              title="Next Slide Time"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="w-full flex-1 relative bg-slate-100/50">
          <iframe
            src={officeViewerUrl}
            className="w-full h-full border-0 absolute inset-0"
            title="Presentation Viewer"
          />
        </div>
        {renderAiPanel()}
      </div>
    );
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 text-slate-800 select-none relative overflow-hidden font-sans">
      <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-blue-100 shadow-[0_2px_10px_rgba(37,99,235,0.05)] z-10 relative">
        <div className="flex flex-col">
          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            Slide {pageNumber} of {numPages || '-'}
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold tabular-nums">
              {currentSlideTime}s
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 tracking-wide font-medium flex items-center gap-2">
            CLICK NEXT TO LOG TIME
            <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded tabular-nums">Total: {totalPresentationTime}s</span>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="flex gap-1 border-r border-slate-200 pr-6 items-center">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-xs px-2.5 transition-colors shadow-sm"
              title="Zoom Out"
            >
              -
            </button>
            <span className="text-xs text-slate-600 font-semibold w-12 text-center flex items-center justify-center bg-slate-50 py-1 rounded">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-xs px-2.5 transition-colors shadow-sm"
              title="Zoom In"
            >
              +
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              disabled={pageNumber <= 1}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-100/50 relative">
        <Document
          file={documentUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center text-blue-600 h-full">
              <div className="w-10 h-10 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4 shadow-sm"></div>
              <p className="font-medium animate-pulse text-sm">Loading Presentation...</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            scale={scale}
            width={Math.min(window.innerWidth * 0.7, 1000)} // PDF width
            className="shadow-[0_0_40px_rgba(0,0,0,0.1)] rounded overflow-hidden"
          />
        </Document>
      </div>
      
      {renderAiPanel()}
      
      <div className="px-4 py-3 bg-white text-[11px] font-medium tracking-wide text-slate-500 uppercase text-center shrink-0 border-t border-blue-50 shadow-[0_-2px_10px_rgba(37,99,235,0.02)]">
        <span>Use <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mx-1 text-slate-700 shadow-sm">←</kbd> <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mx-1 text-slate-700 shadow-sm">→</kbd> keys to navigate and track time</span>
      </div>
    </div>
  );
}
