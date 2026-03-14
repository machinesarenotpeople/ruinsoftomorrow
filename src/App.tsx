import { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon, Download, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

export default function App() {
  return <ImageEditor />;
}

function ImageEditor() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("abandoned buildings, empty streetscapes, rusted steel, derelict, urban exploration, ruin, decrepit, dilapidated, deserted, broken windows, dark windows, burnt out, ramshackle, homeless shelter, burnt-out car, wreckage, decay, debris, ruined, ruined signs, overgrown, worn down, eroded, corrosion, deterioration, dirt, mud, wear and tear, gravel, litter, trash, 8k, photorealistic, charred, smashed windows, blown-out windows, warzone, burnt-out, collapsed roof, every wall is realistically grimed, boarded windows, condemned buildings, crumbling, collapsed building, peeling paint, exposed rebar, rusted pipes, shattered glass, oxidized metal, twisted iron, water stains, rotting wood, neglected, forsaken, weathering, reclaimed by nature, dead weeds, desolate, structural failure, gritty");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setSelectedImageMimeType(file.type);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedImageMimeType) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Extract base64 data without the data:image/jpeg;base64, prefix
      const base64Data = selectedImage.split(',')[1];
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing. Please set it in your environment.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: selectedImageMimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let generatedImage = null;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            generatedImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
            break;
          }
        }
      }

      if (!generatedImage) {
        throw new Error("No image returned from the model.");
      }

      setResultImage(generatedImage);
      
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `urban-decay-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 pb-20">
      <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-12">
        
        <header className="space-y-4 pt-8">
          <h1 className="text-4xl sm:text-6xl font-display tracking-tighter leading-none uppercase">
            RUINS OF<br />TOMORROW
          </h1>
          <p className="text-white/60 text-sm uppercase tracking-widest font-medium">
            Choose a photo of a street, building or city
          </p>
        </header>

        <main className="space-y-10">
          {!selectedImage ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="group flex flex-col items-center justify-center gap-6 p-10 border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all aspect-square sm:aspect-auto sm:h-80"
              >
                <div className="w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Camera className="w-8 h-8 text-white/70" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-light text-xl tracking-wide uppercase font-display">Take Photo</p>
                </div>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center gap-6 p-10 border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all aspect-square sm:aspect-auto sm:h-80"
              >
                <div className="w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-8 h-8 text-white/70" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-light text-xl tracking-wide uppercase font-display">Upload Photo</p>
                </div>
              </button>
              
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={cameraInputRef}
                onChange={handleImageSelect}
              />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="relative overflow-hidden">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="w-full max-h-[60vh] object-contain"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => {
                    setSelectedImage(null);
                    setResultImage(null);
                  }}
                  className="absolute top-6 right-6 w-12 h-12 border border-white/30 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-white text-black font-medium py-5 px-8 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg tracking-wide uppercase font-display"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    RUINING...
                  </>
                ) : (
                  <>
                    Take me there
                  </>
                )}
              </button>
              
              {error && (
                <div className="p-5 border border-white/30 bg-white/10 text-white text-sm font-light space-y-2">
                  <p className="font-medium">{error}</p>
                  {/* @ts-ignore */}
                  {error.includes("Server configuration error") && (
                    <div className="text-xs opacity-70 font-mono mt-2 pt-2 border-t border-white/20">
                      <p>Debug Info:</p>
                      <ul className="list-disc pl-4 space-y-1 mt-1">
                        <li>Check your AI Studio Secrets panel.</li>
                        <li>Ensure secret is named: <span className="font-bold text-white">GEMINI_API_KEY</span></li>
                        <li>Ensure value starts with: <span className="font-bold text-white">AIza...</span></li>
                        <li>Try deleting and re-adding the secret.</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* Full Screen Result Modal */}
      <AnimatePresence>
        {resultImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <header className="flex items-center justify-between p-6 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
              <button 
                onClick={() => setResultImage(null)}
                className="w-12 h-12 border border-white/30 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-3 bg-white text-black px-8 py-3 font-medium hover:bg-white/90 transition-colors tracking-wide text-sm uppercase font-display"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD</span>
              </button>
            </header>
            
            <div className="flex-1 flex items-center justify-center p-4 sm:p-12">
              <motion.img 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                src={resultImage} 
                alt="Generated Result" 
                className="max-w-full max-h-full object-contain rounded-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
