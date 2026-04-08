import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Image as ImageIcon, Download, Play, Pause, 
  Wand2, Activity, Sliders, Layout, UploadCloud, 
  CheckCircle2, Loader2, Check, Sparkles, Scissors, 
  Zap, Video, MoveHorizontal, RefreshCw, ArrowRight, X, Type,
  Settings, Save, Upload, Key, AlertCircle, Maximize, Minimize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  // UX Scenario Steps: 'source' -> 'method' -> 'point' -> 'sync' -> 'export'
  const [activeStep, setActiveStep] = useState('source');
  
  // Step 1: Source Media
  const [creationMode, setCreationMode] = useState<'prompt' | 'upload'>('prompt');
  const [prompt, setPrompt] = useState('비 오는 날의 조용한 사이버펑크 헬스장');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const promptCheatKeys = [
    {
      category: "🎨 아트 스타일",
      items: [
        "실사풍, 8K 해상도, 극사실주의, 마스터피스",
        "시네마틱, 에픽 판타지, 언리얼 엔진 5 렌더링 스타일",
        "사이버펑크, 네온 시티, 미래지향적, SF 스타일",
        "스튜디오 지브리 스타일, 아름다운 애니메이션 아트, 생동감 넘치는",
        "미니멀리스트, 깔끔한 미학, 파스텔 톤, 부드러운 느낌"
      ]
    },
    {
      category: "💡 조명 및 색감",
      items: [
        "볼류메트릭 라이팅, 빛내림(God rays), 극적인 그림자",
        "어둡고 분위기 있는 조명, 로우 키, 시네마틱 라이팅",
        "골든 아워, 부드러운 햇살, 따뜻한 색감",
        "시네마틱 틸 앤 오렌지(Teal and orange) 컬러 그레이딩",
        "생동감 넘치는 네온 컬러, 빛나는, 생물 발광"
      ]
    },
    {
      category: "📸 카메라 및 구도",
      items: [
        "광각 샷, 배경을 보여주는 샷, 웅장한 스케일",
        "접사(매크로) 촬영, 얕은 피사계 심도, 보케 효과",
        "드론 뷰, 탑다운 시점, 조감도",
        "대칭 구도, 완벽하게 중앙에 맞춰진"
      ]
    },
    {
      category: "🎬 시네마그래프 특화",
      items: [
        "흐르는 물, 역동적인 움직임, 강물, 폭포",
        "피어오르는 연기, 분위기 있는, 짙은 안개",
        "떨어지는 빗방울, 젖은 표면, 빛 반사",
        "모락모락 피어오르는 커피 김, 아늑한 분위기, 따뜻한"
      ]
    }
  ];

  const handleCheatKeyClick = (cheatKey: string) => {
    setPrompt(prev => prev ? `${prev}, ${cheatKey}` : cheatKey);
    setIsPromptModalOpen(false);
  };

  // API Key Management State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // API Key Management Handlers
  const handleSaveToLocal = () => {
    if (!apiKey || !encryptionPassword) {
      alert("API Key와 암호화 비밀번호를 모두 입력해주세요.");
      return;
    }
    // Simple XOR + Base64 encryption for prototype
    let encrypted = '';
    for (let i = 0; i < apiKey.length; i++) {
      encrypted += String.fromCharCode(apiKey.charCodeAt(i) ^ encryptionPassword.charCodeAt(i % encryptionPassword.length));
    }
    const encoded = btoa(encodeURIComponent(encrypted));
    
    const blob = new Blob([JSON.stringify({ loopflow_api_key: encoded })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loopflow_keys.enc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFromLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!encryptionPassword) {
      alert("복호화를 위해 먼저 비밀번호를 입력해주세요.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const decoded = decodeURIComponent(atob(data.loopflow_api_key));
        let decrypted = '';
        for (let i = 0; i < decoded.length; i++) {
          decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ encryptionPassword.charCodeAt(i % encryptionPassword.length));
        }
        setApiKey(decrypted);
        alert("API Key를 성공적으로 불러왔습니다.");
      } catch (error) {
        alert("파일을 읽거나 복호화하는데 실패했습니다. 비밀번호를 확인해주세요.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestConnection = () => {
    if (!apiKey) {
      setTestStatus('error');
      return;
    }
    setTestStatus('testing');
    setTimeout(() => {
      if (apiKey.length > 5) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
      setTimeout(() => setTestStatus('idle'), 3000);
    }, 1500);
  };
  
  // Step 2: Loop Method
  const [loopMethod, setLoopMethod] = useState('Seamless AI');
  const [cinemagraphPrompt, setCinemagraphPrompt] = useState('물결만 자연스럽게 흐르도록 애니메이션');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Step 3: Loop Point
  const [loopPointMode, setLoopPointMode] = useState<'auto' | 'manual'>('manual');
  const [isAnalyzingLoop, setIsAnalyzingLoop] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(100);

  // Step 4: Overlay
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [titleColor, setTitleColor] = useState('#ffffff');
  const [artistColor, setArtistColor] = useState('#818cf8');
  const [textOpacity, setTextOpacity] = useState(80);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [textBehindSubject, setTextBehindSubject] = useState(false);

  // Step 5: Export
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [exportResolution, setExportResolution] = useState<'FHD' | '4K'>('FHD');
  const [loopCount, setLoopCount] = useState(1);
  
  // Global & Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [isOriginalPlaying, setIsOriginalPlaying] = useState(false);
  const [originalProgress, setOriginalProgress] = useState(0);
  const [originalCurrentTime, setOriginalCurrentTime] = useState(0);
  const [originalDuration, setOriginalDuration] = useState(0);
  const [mediaSrc, setMediaSrc] = useState<string | null>("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop");
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [isFullscreenOriginal, setIsFullscreenOriginal] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Playback control
  useEffect(() => {
    if (isPlaying) {
      if (mediaType === 'video' && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      if (videoRef.current) videoRef.current.pause();
    }
  }, [isPlaying, mediaType]);

  // Fallback progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && mediaType === 'image') {
      interval = setInterval(() => {
        setProgress((p) => {
          const newP = p >= 100 ? 0 : p + 0.5;
          setCurrentTime((newP / 100) * 5); // Assume 5 seconds for image loop
          setDuration(5);
          return newP;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, mediaType]);

  // Sync original video play state
  useEffect(() => {
    if (originalVideoRef.current && mediaType === 'video') {
      if (isOriginalPlaying) {
        originalVideoRef.current.play().catch(e => console.error(e));
      } else {
        originalVideoRef.current.pause();
      }
    }
  }, [isOriginalPlaying, mediaType]);

  // Original video time tracking
  useEffect(() => {
    const video = originalVideoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setOriginalCurrentTime(video.currentTime);
      setOriginalDuration(video.duration || 0);
      if (video.duration) {
        setOriginalProgress((video.currentTime / video.duration) * 100);
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [mediaType]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaSrc(url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setIsPlaying(false);
      setIsOriginalPlaying(false);
    }
  };

  const getBase64FromUrl = async (url: string): Promise<{ base64: string, mimeType: string }> => {
    if (url.startsWith('data:')) {
      const [header, data] = url.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      return { base64: data, mimeType };
    }
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const [header, data] = result.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        resolve({ base64: data, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAutoAnalyzePrompt = async () => {
    if (!mediaSrc || mediaType !== 'image') return;

    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsAnalyzingImage(true);
    try {
      const { base64, mimeType } = await getBase64FromUrl(mediaSrc);
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: mimeType,
              }
            },
            {
              text: "이 이미지를 분석해서 시네마그래프(일부분만 움직이는 영상)로 만들 때 가장 자연스럽고 멋진 움직임을 묘사하는 짧은 프롬프트를 작성해줘. 예를 들어 '물결이 잔잔하게 흐름', '연기가 모락모락 피어오름', '네온사인이 깜빡임' 처럼 움직여야 할 핵심 요소만 짚어줘. 다른 부가적인 설명 없이 딱 프롬프트 문장 하나만 한국어로 출력해."
            }
          ]
        }
      });

      if (response.text) {
        setCinemagraphPrompt(response.text.trim());
      }
    } catch (error) {
      console.error("Failed to analyze image:", error);
      alert("이미지 분석에 실패했습니다.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleAutoFindLoop = () => {
    setIsAnalyzingLoop(true);
    // Simulate AI finding the best loop point
    setTimeout(() => {
      setLoopStart(15);
      setLoopEnd(85);
      setIsAnalyzingLoop(false);
    }, 1500);
  };

  const handleGenerateCinemagraph = async () => {
    if (!mediaSrc || mediaType !== 'image') return;

    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsGeneratingVideo(true);
    setVideoProgress("비디오 생성 준비 중...");

    try {
      const { base64, mimeType } = await getBase64FromUrl(mediaSrc);
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `Cinemagraph, seamless loop, perfectly static camera, no zoom, no panning, no camera movement, single continuous shot, no cuts, no scene changes, consistent subject, smooth motion. ${cinemagraphPrompt}`,
        image: {
          imageBytes: base64,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16'
        }
      });

      while (!operation.done) {
        setVideoProgress("AI가 영상을 렌더링하고 있습니다... (약 1~2분 소요)");
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoProgress("영상 다운로드 중...");
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        setMediaSrc(videoUrl);
        setMediaType('video');
        setLoopMethod('Seamless AI');
        setActiveStep('point'); // Move to next step automatically
      } else {
        alert("비디오 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Video Generation Error:", error);
      alert("비디오 생성 중 오류가 발생했습니다. 유료 API 키가 필요할 수 있습니다.");
    } finally {
      setIsGeneratingVideo(false);
      setVideoProgress("");
    }
  };

  // REAL AI Image Generation using Gemini API
  const handleGenerateAI = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
          }
        }
      });
      
      let base64 = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64 = part.inlineData.data;
          break;
        }
      }
      
      if (base64) {
        setMediaSrc(`data:image/jpeg;base64,${base64}`);
        setMediaType('image');
      } else {
        alert("이미지 생성 결과가 없습니다.");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("AI 이미지 생성에 실패했습니다. API 키나 할당량을 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioSrc) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (total > 0) {
        setProgress((current / total) * 100);
      }
    }
  };

  // REAL Video Loop Trimming & Crossfade Preview
  useEffect(() => {
    let animationFrameId: number;
    let lastStateUpdateTime = 0;

    const checkVideoLoop = () => {
      if (mediaType === 'video' && videoRef.current && isPlaying) {
        const video = videoRef.current;
        const duration = video.duration;
        
        if (duration) {
          const startTime = (loopStart / 100) * duration;
          const endTime = (loopEnd / 100) * duration;
          
          // 1. Handle Crossfade Visuals
          if (loopMethod === 'Crossfade') {
            const fadeTime = Math.min(0.8, (endTime - startTime) * 0.2); // max 0.8s fade
            if (video.currentTime >= endTime - fadeTime) {
              video.style.opacity = Math.max(0, (endTime - video.currentTime) / fadeTime).toString();
            } else if (video.currentTime <= startTime + fadeTime) {
              video.style.opacity = Math.min(1, (video.currentTime - startTime) / fadeTime).toString();
            } else {
              video.style.opacity = '1';
            }
          } else {
            video.style.opacity = '1';
          }

          // 2. Handle Loop Trimming
          // If it's 0-100% and NOT crossfade, let native HTML5 loop handle it perfectly
          if (loopStart > 0 || loopEnd < 100 || loopMethod === 'Crossfade') {
            if (video.currentTime >= endTime) {
              video.currentTime = startTime;
            } else if (video.currentTime < startTime) {
              video.currentTime = startTime;
            }
          }

          // 3. Update Progress (Throttled to prevent stuttering)
          const now = Date.now();
          if (now - lastStateUpdateTime > 100) {
            const currentLoopProgress = ((video.currentTime - startTime) / (endTime - startTime)) * 100;
            setProgress(Math.max(0, Math.min(100, currentLoopProgress || 0)));
            setCurrentTime(Math.max(0, video.currentTime - startTime));
            setDuration(Math.max(0, endTime - startTime));
            lastStateUpdateTime = now;
          }
        }
      }
      animationFrameId = requestAnimationFrame(checkVideoLoop);
    };

    if (isPlaying) {
      checkVideoLoop();
    } else if (videoRef.current) {
      videoRef.current.style.opacity = '1';
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, mediaType, loopStart, loopEnd, loopMethod]);

  // REAL Export using MediaRecorder
  const startExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const wasPlaying = isPlaying;
    if (!isPlaying) {
      setIsPlaying(true);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const is4K = exportResolution === '4K';
    const width169 = is4K ? 3840 : 1920;
    const height169 = is4K ? 2160 : 1080;
    const width916 = is4K ? 2160 : 1080;
    const height916 = is4K ? 3840 : 1920;

    canvas.width = aspectRatio === '16:9' ? width169 : aspectRatio === '9:16' ? width916 : width169;
    canvas.height = aspectRatio === '16:9' ? height169 : aspectRatio === '9:16' ? height916 : height169;
    
    const stream = canvas.captureStream(30);
    
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: BlobPart[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const now = new Date();
      const dateStr = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0') + '_' + 
        String(now.getHours()).padStart(2, '0') + 
        String(now.getMinutes()).padStart(2, '0') + 
        String(now.getSeconds()).padStart(2, '0');
        
      a.download = `LoopFlow_${dateStr}.webm`;
      a.click();
      setIsExporting(false);
      if (!wasPlaying) {
        setIsPlaying(false);
      }
    };
    
    recorder.start();
    
    let singleLoopDuration = 5000; // Default 5 seconds for image
    if (mediaType === 'video' && videoRef.current) {
      const vidDuration = videoRef.current.duration;
      if (vidDuration) {
        const startTime = (loopStart / 100) * vidDuration;
        const endTime = (loopEnd / 100) * vidDuration;
        singleLoopDuration = (endTime - startTime) * 1000;
        videoRef.current.currentTime = startTime; // Reset to start of loop
      }
    }
    
    const recordDuration = singleLoopDuration * loopCount;
    
    const startTimeMs = Date.now();
    
    const renderFrame = () => {
      const now = Date.now();
      const elapsed = now - startTimeMs;
      
      setExportProgress(Math.min((elapsed / recordDuration) * 100, 100));
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const drawCover = (source: HTMLVideoElement | HTMLImageElement, sourceW: number, sourceH: number) => {
        const scale = Math.max(canvas.width / sourceW, canvas.height / sourceH);
        const drawW = sourceW * scale;
        const drawH = sourceH * scale;
        const drawX = (canvas.width - drawW) / 2;
        const drawY = (canvas.height - drawH) / 2;
        ctx.drawImage(source, drawX, drawY, drawW, drawH);
      };

      if (mediaType === 'video' && videoRef.current) {
        if (loopMethod === 'Crossfade') {
          ctx.globalAlpha = parseFloat(videoRef.current.style.opacity || '1');
        }
        drawCover(videoRef.current, videoRef.current.videoWidth, videoRef.current.videoHeight);
        ctx.globalAlpha = 1;
      } else if (mediaType === 'image') {
        const imgEl = document.getElementById('preview-image') as HTMLImageElement;
        if (imgEl) {
          drawCover(imgEl, imgEl.naturalWidth, imgEl.naturalHeight);
        }
      }

      // Draw Overlays
      if (showWatermark) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(watermarkText, canvas.width - 30, 40);
      }
      
      if (songTitle || artistName) {
        ctx.save();
        ctx.globalAlpha = textOpacity / 100;
        if (textBehindSubject) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.font = '900 120px sans-serif';
          ctx.fillStyle = titleColor;
          ctx.fillText(songTitle.toUpperCase(), canvas.width / 2, canvas.height / 2 - 20);
          
          ctx.font = 'bold 40px sans-serif';
          ctx.fillStyle = artistColor;
          ctx.fillText(artistName, canvas.width / 2, canvas.height / 2 + 60);
        } else {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          
          ctx.font = '900 48px sans-serif';
          ctx.fillStyle = titleColor;
          ctx.fillText(songTitle.toUpperCase(), 40, canvas.height - 80);
          
          ctx.font = 'bold 28px sans-serif';
          ctx.fillStyle = artistColor;
          ctx.fillText(artistName, 40, canvas.height - 40);
        }
        ctx.restore();
      }
      
      if (showProgressBar) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, canvas.height - 10, canvas.width * (elapsed / duration), 10);
      }
      
      if (elapsed < recordDuration) {
        requestAnimationFrame(renderFrame);
      } else {
        recorder.stop();
      }
    };
    
    renderFrame();
  };

  // Dynamic Beat Animation based on selected effect
  const getBeatAnimation = () => {
    return { scale: 1, filter: 'saturate(100%)' };
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = [
    { id: 'source', icon: <ImageIcon className="w-5 h-5" />, label: '1. Source' },
    { id: 'method', icon: <Wand2 className="w-5 h-5" />, label: '2. Loop Method' },
    { id: 'point', icon: <Scissors className="w-5 h-5" />, label: '3. Loop Point' },
    { id: 'overlay', icon: <Type className="w-5 h-5" />, label: '4. Overlay' },
    { id: 'export', icon: <Download className="w-5 h-5" />, label: '5. Export' }
  ];

  const ratios = [
    { id: '16:9', label: 'YouTube (16:9)', icon: <div className="w-6 h-4 border-2 border-current rounded-sm" /> },
    { id: '9:16', label: 'Shorts/Reels (9:16)', icon: <div className="w-4 h-6 border-2 border-current rounded-sm" /> },
    { id: '1:1', label: 'Instagram (1:1)', icon: <div className="w-5 h-5 border-2 border-current rounded-sm" /> }
  ];

  const getFullscreenWrapperStyle = (isFullscreen: boolean) => {
    if (!isFullscreen) return {};
    const maxHeight = 'calc(100vh - 200px)';
    if (aspectRatio === '16:9') return { width: `min(100%, calc(${maxHeight} * 16 / 9))` };
    if (aspectRatio === '9:16') return { width: `min(100%, calc(${maxHeight} * 9 / 16))` };
    return { width: `min(100%, ${maxHeight})` };
  };

  const getVideoContainerClasses = (isFullscreen: boolean) => {
    const base = "relative bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center w-full";
    if (aspectRatio === '16:9') return `${base} aspect-video`;
    if (aspectRatio === '9:16') {
      return isFullscreen ? `${base} aspect-[9/16]` : `${base} max-w-[360px] sm:max-w-[400px] aspect-[9/16] mx-auto`;
    }
    return isFullscreen ? `${base} aspect-square` : `${base} max-w-[500px] aspect-square mx-auto`;
  };

  return (
    <div className="h-screen overflow-hidden bg-neutral-950 text-neutral-200 flex font-sans selection:bg-indigo-500/30">
      {/* Hidden Inputs & Canvas */}
      <input type="file" accept="video/*,image/*" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Sidebar Navigation */}
      <aside className="w-24 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-6 gap-6 z-10">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
          <RefreshCw className="w-8 h-8 text-white" />
        </div>
        <nav className="flex flex-col gap-2 w-full px-3">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex flex-col items-center justify-center gap-2 w-full py-4 rounded-xl transition-all ${
                activeStep === step.id 
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' 
                  : 'text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300 border border-transparent'
              }`}
            >
              {step.icon}
              <span className="text-[10px] font-bold tracking-wider uppercase text-center leading-tight">
                {step.label.split('. ')[1]}
              </span>
            </button>
          ))}
        </nav>
        <div className="mt-auto w-full px-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center justify-center gap-2 w-full py-4 rounded-xl transition-all bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-transparent"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-center leading-tight">SETTINGS</span>
          </button>
        </div>
      </aside>

      {/* Main Editor Panel */}
      <div className="w-[400px] bg-neutral-900/50 border-r border-neutral-800 flex flex-col h-screen overflow-y-auto relative z-10 shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="p-8 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-xl sticky top-0 z-20">
          <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            LoopFlow
          </h1>
          <p className="text-sm text-neutral-400 mt-2 font-medium">"Your Music, Infinite Flow."</p>
        </div>

        <div className="p-8 flex-1">
          {/* STEP 1: SOURCE MEDIA */}
          {activeStep === 'source' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-indigo-400" /> Source Media
                </h2>
                <p className="text-xs text-neutral-400 mb-6">루프 영상의 기반이 될 이미지나 영상을 준비합니다.</p>
              </div>

              <div className="flex bg-neutral-800/50 p-1 rounded-xl border border-neutral-700/50">
                <button
                  onClick={() => setCreationMode('prompt')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    creationMode === 'prompt' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> AI Prompt
                </button>
                <button
                  onClick={() => setCreationMode('upload')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    creationMode === 'upload' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" /> Upload
                </button>
              </div>

              {creationMode === 'prompt' ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-white">Text-to-Image</label>
                      <button
                        onClick={() => setIsPromptModalOpen(true)}
                        className="text-xs flex items-center gap-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> 프롬프트 치트키
                      </button>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                      AI가 프롬프트를 분석하여 고품질 이미지를 생성합니다. 다음 단계에서 이 이미지를 영상으로 변환할 수 있습니다.
                    </p>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="예: 비 오는 날의 조용한 사이버펑크 헬스장..."
                      className="w-full h-32 bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !prompt}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    {isGenerating ? 'AI 이미지 생성 중...' : 'AI 이미지 생성'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Image/Video Upload</label>
                    <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                      본인이 직접 찍은 사진이나 영상을 업로드하여 무한 루프 배경으로 변환합니다.
                    </p>
                    <div 
                      onClick={() => mediaInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-neutral-800/50 hover:border-indigo-500/50 transition-colors cursor-pointer group"
                    >
                      <UploadCloud className="w-10 h-10 text-neutral-500 group-hover:text-indigo-400 transition-colors mb-4" />
                      <p className="text-sm font-bold text-neutral-300">클릭하여 미디어 업로드</p>
                      <p className="text-xs text-neutral-500 mt-2">MP4, JPG, PNG 지원</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-neutral-800">
                <button 
                  onClick={() => setActiveStep('method')}
                  className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Next: Loop Method <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOOP METHOD */}
          {activeStep === 'method' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <Wand2 className="w-5 h-5 text-indigo-400" /> Loop Method
                </h2>
                <p className="text-xs text-neutral-400 mb-6">원본 미디어를 어떻게 무한 루프 영상으로 만들지 선택합니다.</p>
                
                <div className="space-y-3">
                  {mediaType === 'image' ? (
                    <>
                      <button
                        onClick={() => setLoopMethod('Cinemagraph')}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          loopMethod === 'Cinemagraph'
                            ? 'bg-indigo-600/10 border-indigo-500'
                            : 'bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-sm ${loopMethod === 'Cinemagraph' ? 'text-indigo-400' : 'text-neutral-200'}`}>
                            Cinemagraph (시네마그래프)
                          </span>
                          {loopMethod === 'Cinemagraph' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <p className="text-xs text-neutral-500">정지된 이미지에서 특정 부분(물, 조명 등)만 애니메이션</p>
                      </button>
                      <button
                        onClick={() => setLoopMethod('Seamless AI')}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          loopMethod === 'Seamless AI'
                            ? 'bg-indigo-600/10 border-indigo-500'
                            : 'bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-sm ${loopMethod === 'Seamless AI' ? 'text-indigo-400' : 'text-neutral-200'}`}>
                            Seamless AI (전체 모션)
                          </span>
                          {loopMethod === 'Seamless AI' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <p className="text-xs text-neutral-500">이미지 전체에 자연스러운 움직임을 부여하여 영상화</p>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setLoopMethod('Crossfade')}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          loopMethod === 'Crossfade'
                            ? 'bg-indigo-600/10 border-indigo-500'
                            : 'bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-sm ${loopMethod === 'Crossfade' ? 'text-indigo-400' : 'text-neutral-200'}`}>
                            Crossfade (크로스페이드)
                          </span>
                          {loopMethod === 'Crossfade' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <p className="text-xs text-neutral-500">영상의 끝부분을 시작 부분과 자연스럽게 겹침</p>
                      </button>
                      <button
                        onClick={() => setLoopMethod('Direct')}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          loopMethod === 'Direct'
                            ? 'bg-indigo-600/10 border-indigo-500'
                            : 'bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-sm ${loopMethod === 'Direct' ? 'text-indigo-400' : 'text-neutral-200'}`}>
                            Direct Loop (직접 연결)
                          </span>
                          {loopMethod === 'Direct' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <p className="text-xs text-neutral-500">효과 없이 설정한 구간을 그대로 반복</p>
                      </button>
                    </>
                  )}
                </div>

                {mediaType === 'image' && (
                  <div className="mt-6 p-5 bg-neutral-800/80 rounded-xl border border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4 text-indigo-400" /> 비디오로 변환하기
                    </h4>
                    <p className="text-xs text-neutral-400 mb-4">현재 이미지를 선택한 방식({loopMethod})으로 영상화합니다.</p>
                    
                    {loopMethod === 'Cinemagraph' && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-semibold text-neutral-300">시네마그래프 프롬프트</label>
                          <button
                            onClick={handleAutoAnalyzePrompt}
                            disabled={isAnalyzingImage}
                            className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-2 py-1 rounded transition-colors font-bold disabled:opacity-50"
                          >
                            {isAnalyzingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI 자동 분석
                          </button>
                        </div>
                        <input
                          type="text"
                          value={cinemagraphPrompt}
                          onChange={(e) => setCinemagraphPrompt(e.target.value)}
                          placeholder="예: 폭포수만 흐르게 해줘, 커피 김이 모락모락 나게"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={handleGenerateCinemagraph}
                      disabled={isGeneratingVideo || (loopMethod === 'Cinemagraph' && !cinemagraphPrompt)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {isGeneratingVideo ? '영상 생성 중...' : 'AI 비디오 생성 시작'}
                    </button>
                    {videoProgress && <p className="text-xs text-indigo-400 mt-3 text-center font-medium">{videoProgress}</p>}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <button 
                  onClick={() => setActiveStep('point')}
                  disabled={mediaType === 'image'}
                  className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {mediaType === 'image' ? '비디오 변환을 먼저 진행해주세요' : 'Next: Loop Point'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOOP POINT */}
          {activeStep === 'point' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <Scissors className="w-5 h-5 text-indigo-400" /> Set Loop Point
                </h2>
                <p className="text-xs text-neutral-400 mb-6">동영상의 루프 구간을 설정합니다. 선택한 구간만 반복 재생됩니다.</p>
                
                <div className="flex bg-neutral-900 rounded-xl p-1 mb-6">
                  <button
                    onClick={() => setLoopPointMode('manual')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      loopPointMode === 'manual' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    수동 설정 (Manual)
                  </button>
                  <button
                    onClick={() => setLoopPointMode('auto')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      loopPointMode === 'auto' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    AI 자동 추출 (Auto)
                  </button>
                </div>

                {loopPointMode === 'auto' ? (
                  <div className="bg-neutral-800/50 p-6 rounded-xl border border-indigo-500/30 mb-6 flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-8 h-8 text-indigo-400 mb-3" />
                    <h3 className="text-sm font-bold text-white mb-2">AI 최적 루프 구간 분석</h3>
                    <p className="text-xs text-neutral-400 mb-4">
                      인공지능이 영상의 움직임을 분석하여 가장 자연스럽게 이어지는 완벽한 루프 구간을 자동으로 찾아냅니다.
                    </p>
                    <button
                      onClick={handleAutoFindLoop}
                      disabled={isAnalyzingLoop}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                    >
                      {isAnalyzingLoop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {isAnalyzingLoop ? '분석 중...' : '자동 추출 시작'}
                    </button>
                    {loopStart === 15 && loopEnd === 85 && !isAnalyzingLoop && (
                      <p className="text-xs text-green-400 mt-4 font-medium">✨ 완벽한 루프 구간을 찾았습니다! (15% ~ 85%)</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-neutral-800/50 p-5 rounded-xl border border-neutral-700/50 mb-6">
                    <div className="flex justify-between text-xs font-medium text-neutral-400 mb-3">
                      <span>Start: {loopStart}%</span>
                      <span>End: {loopEnd}%</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      <input 
                        type="range" min="0" max="100" value={loopStart} 
                        onChange={(e) => setLoopStart(Math.min(parseInt(e.target.value), loopEnd - 5))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <input 
                        type="range" min="0" max="100" value={loopEnd} 
                        onChange={(e) => setLoopEnd(Math.max(parseInt(e.target.value), loopStart + 5))}
                        className="w-full accent-indigo-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-neutral-500 text-center">
                  프리뷰 화면에서 재생 버튼을 눌러 설정한 구간이 자연스럽게 이어지는지 확인하세요.
                </p>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <button 
                  onClick={() => setActiveStep('overlay')}
                  className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Next: Overlay <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: OVERLAY */}
          {activeStep === 'overlay' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <Type className="w-5 h-5 text-indigo-400" /> Playlist Overlay
                </h2>
                <p className="text-xs text-neutral-400 mb-6">영상 위에 곡 정보와 워터마크, 프로그레스 바를 추가합니다.</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">곡 제목 (Song Title)</label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="예: DoberSound Mix"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">아티스트 (Artist)</label>
                    <input
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="예: DJ Doberman"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">제목 색상</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                      <span className="text-xs text-neutral-400 font-mono">{titleColor}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">아티스트 색상</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={artistColor} onChange={(e) => setArtistColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                      <span className="text-xs text-neutral-400 font-mono">{artistColor}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">텍스트 투명도 ({textOpacity}%)</label>
                    <input type="range" min="0" max="100" value={textOpacity} onChange={(e) => setTextOpacity(parseInt(e.target.value))} className="w-full accent-indigo-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer mt-2" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors">
                    <div>
                      <span className="block text-sm font-bold text-white">프로그레스 바 (Progress Bar)</span>
                      <span className="block text-xs text-neutral-400 mt-0.5">하단에 재생 진행 상태 표시</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${showProgressBar ? 'bg-indigo-500' : 'bg-neutral-600'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showProgressBar ? 'left-5' : 'left-1'}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={showProgressBar} onChange={(e) => setShowProgressBar(e.target.checked)} />
                  </label>

                  <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl hover:bg-neutral-800 transition-colors">
                    <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div>
                        <span className="block text-sm font-bold text-white">워터마크 (Watermark)</span>
                        <span className="block text-xs text-neutral-400 mt-0.5">우측 상단에 워터마크 표시</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${showWatermark ? 'bg-indigo-500' : 'bg-neutral-600'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showWatermark ? 'left-5' : 'left-1'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} />
                    </label>
                    {showWatermark && (
                      <div className="px-4 pb-4">
                        <input 
                          type="text" 
                          value={watermarkText} 
                          onChange={(e) => setWatermarkText(e.target.value)} 
                          placeholder="워터마크 텍스트 입력"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <label className="flex items-center justify-between p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors">
                    <div>
                      <span className="block text-sm font-bold text-white">인물 뒤쪽 텍스트 (3D 효과)</span>
                      <span className="block text-xs text-neutral-400 mt-0.5">텍스트를 피사체 뒤에 배치하는 트렌디한 효과</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${textBehindSubject ? 'bg-indigo-500' : 'bg-neutral-600'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${textBehindSubject ? 'left-5' : 'left-1'}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={textBehindSubject} onChange={(e) => setTextBehindSubject(e.target.checked)} />
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <button 
                  onClick={() => setActiveStep('export')}
                  className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Next: Export <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: EXPORT */}
          {activeStep === 'export' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <Layout className="w-5 h-5 text-indigo-400" /> Export Settings
                </h2>
                <p className="text-xs text-neutral-400 mb-6">플랫폼에 맞는 해상도로 최종 루프 영상을 추출합니다.</p>

                <div className="space-y-3 mb-8">
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">화면 비율 (Aspect Ratio)</label>
                  {ratios.map(ratio => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        aspectRatio === ratio.id
                          ? 'bg-indigo-600/10 border-indigo-500 text-white'
                          : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <div className={aspectRatio === ratio.id ? 'text-indigo-400' : 'text-neutral-500'}>
                        {ratio.icon}
                      </div>
                      <span className="font-bold text-sm">{ratio.label}</span>
                      {aspectRatio === ratio.id && <CheckCircle2 className="w-5 h-5 ml-auto text-indigo-500" />}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 mb-8">
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">출력 해상도 (Resolution)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportResolution('FHD')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        exportResolution === 'FHD'
                          ? 'bg-indigo-600/10 border-indigo-500 text-white'
                          : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="font-black text-lg">FHD</span>
                      <span className="text-[10px] text-neutral-500 mt-1">1080p</span>
                    </button>
                    <button
                      onClick={() => setExportResolution('4K')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        exportResolution === '4K'
                          ? 'bg-indigo-600/10 border-indigo-500 text-white'
                          : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="font-black text-lg">4K</span>
                      <span className="text-[10px] text-neutral-500 mt-1">2160p (고화질)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">반복 횟수 및 총 재생 시간</label>
                  <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-neutral-400">반복 횟수 (Loop Count)</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setLoopCount(Math.max(1, loopCount - 1))}
                          className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors"
                        >
                          -
                        </button>
                        <span className="font-mono text-lg w-8 text-center">{loopCount}</span>
                        <button 
                          onClick={() => setLoopCount(loopCount + 1)}
                          className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-700/50">
                      <span className="text-sm text-neutral-400">총 재생 시간 (Total Duration)</span>
                      <span className="font-mono text-lg text-indigo-400 font-bold">
                        {formatTime(duration * loopCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/50">
                <h3 className="text-sm font-bold text-white mb-3">Export Summary</h3>
                <ul className="text-xs text-neutral-400 space-y-2.5">
                  <li className="flex justify-between"><span>Source:</span> <span className="text-white font-medium">{creationMode === 'prompt' ? 'AI Generated' : 'User Upload'}</span></li>
                  <li className="flex justify-between"><span>Loop Method:</span> <span className="text-white font-medium">{loopMethod}</span></li>
                  <li className="flex justify-between">
                    <span>Resolution:</span> 
                    <span className="text-white font-medium">
                      {exportResolution} ({aspectRatio === '16:9' ? (exportResolution === '4K' ? '3840x2160' : '1920x1080') : aspectRatio === '9:16' ? (exportResolution === '4K' ? '2160x3840' : '1080x1920') : (exportResolution === '4K' ? '2160x2160' : '1080x1080')})
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total Duration:</span> 
                    <span className="text-white font-medium">
                      {formatTime(duration * loopCount)} ({loopCount} loops)
                    </span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={startExport}
                disabled={isExporting}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group text-lg tracking-wide"
              >
                {isExporting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                )}
                {isExporting ? 'Rendering...' : 'Export Loop'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-neutral-950 flex flex-col relative overflow-hidden">
        {/* Top bar */}
        <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-8 bg-neutral-900/50 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-neutral-400">Preview</span>
            <span className="px-2.5 py-1 bg-neutral-800 rounded-md text-xs text-neutral-300 font-mono font-medium">{aspectRatio}</span>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 pt-24 pb-24 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Grid background for canvas */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

          <div className="flex flex-col xl:flex-row items-center justify-center gap-8 w-full max-w-[1600px] mb-6">
            {/* Original Source */}
            <div className={isFullscreenOriginal ? "fixed inset-0 z-[100] bg-neutral-950 p-4 sm:p-8 flex flex-col items-center justify-center" : "flex flex-col items-center w-full max-w-3xl"}>
              <div 
                className="flex flex-col w-full transition-all duration-300"
                style={getFullscreenWrapperStyle(isFullscreenOriginal)}
              >
                <div className="flex justify-between items-center w-full mb-3 px-2">
                  <span className="text-sm font-bold text-neutral-400">원본 소스</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFullscreenOriginal(!isFullscreenOriginal);
                    }}
                    className="p-2 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors relative z-50 cursor-pointer"
                    title={isFullscreenOriginal ? "전체화면 닫기" : "전체화면 보기"}
                  >
                    {isFullscreenOriginal ? <Minimize className="w-5 h-5" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
                <div 
                  ref={originalContainerRef}
                  className={`w-full flex flex-col items-center justify-center bg-neutral-950 rounded-2xl ${isFullscreenOriginal ? 'flex-1 min-h-0' : ''}`}
                >
                  <div className={getVideoContainerClasses(isFullscreenOriginal)}>
                    {mediaType === 'video' ? (
                      <video 
                        ref={originalVideoRef}
                        src={mediaSrc || undefined} 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={mediaSrc || undefined} 
                        alt="Original Source" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  {/* Original Control Bar */}
                  {mediaType === 'video' && (
                    <div className="w-full bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl mt-4">
                      <button 
                        onClick={() => setIsOriginalPlaying(!isOriginalPlaying)}
                        className="w-10 h-10 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 shrink-0"
                      >
                        {isOriginalPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      
                      <div className="text-xs font-mono text-neutral-400 shrink-0 w-10 text-right">
                        {formatTime(originalCurrentTime)}
                      </div>
                      
                      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute top-0 left-0 bottom-0 bg-neutral-500 transition-all duration-100 ease-linear"
                          style={{ width: `${originalProgress}%` }}
                        />
                      </div>
                      
                      <div className="text-xs font-mono text-neutral-400 shrink-0 w-10">
                        {formatTime(originalDuration)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview with Settings */}
            <div className={isFullscreenPreview ? "fixed inset-0 z-[100] bg-neutral-950 p-4 sm:p-8 flex flex-col items-center justify-center" : "flex flex-col items-center w-full max-w-3xl"}>
              <div 
                className="flex flex-col w-full transition-all duration-300"
                style={getFullscreenWrapperStyle(isFullscreenPreview)}
              >
                <div className="flex justify-between items-center w-full mb-3 px-2">
                  <span className="text-sm font-bold text-neutral-400">설정 시 미리보기</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFullscreenPreview(!isFullscreenPreview);
                    }}
                    className="p-2 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors relative z-50 cursor-pointer"
                    title={isFullscreenPreview ? "전체화면 닫기" : "전체화면 보기"}
                  >
                    {isFullscreenPreview ? <Minimize className="w-5 h-5" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
                <div 
                  ref={previewContainerRef}
                  className={`w-full flex flex-col items-center justify-center bg-neutral-950 rounded-2xl ${isFullscreenPreview ? 'flex-1 min-h-0' : ''}`}
                >
                  <motion.div 
                    layout
                    className={getVideoContainerClasses(isFullscreenPreview)}
                  >
                  {/* Base Media */}
                  <motion.div 
                    className="absolute inset-0 bg-neutral-900"
                    animate={getBeatAnimation()}
                  >
                    {mediaType === 'video' ? (
                      <video 
                        ref={videoRef}
                        src={mediaSrc || undefined} 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-cover transition-opacity duration-75"
                      />
                    ) : (
                      <img 
                        id="preview-image"
                        src={mediaSrc || undefined} 
                        alt="Background" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.div>

                  {/* Cinemagraph Simulation Overlay */}
                  {activeStep === 'method' && loopMethod === 'Cinemagraph' && mediaType === 'image' && (
                    <div className="absolute inset-0 pointer-events-none border-4 border-dashed border-indigo-500/30 m-8 rounded-xl flex items-center justify-center">
                       <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
                         Cinemagraph Mask Area
                       </span>
                    </div>
                  )}

                  {/* Real-time Overlays */}
                  {showWatermark && (
                    <div className="absolute top-8 right-8 text-white/50 font-black text-2xl tracking-wider select-none pointer-events-none z-30">
                      {watermarkText}
                    </div>
                  )}
                  
                  {(songTitle || artistName) && (
                    <div 
                      className={`absolute pointer-events-none z-30 flex flex-col ${
                        textBehindSubject 
                          ? 'inset-0 items-center justify-center mix-blend-overlay' 
                          : 'bottom-12 left-10'
                      }`}
                      style={{ opacity: textOpacity / 100 }}
                    >
                      <span 
                        className={`font-black leading-none ${
                          textBehindSubject ? 'text-6xl sm:text-7xl md:text-8xl text-center' : 'text-3xl sm:text-4xl md:text-5xl mb-2'
                        }`}
                        style={{ color: titleColor }}
                      >
                        {songTitle.toUpperCase()}
                      </span>
                      <span 
                        className={`font-bold ${
                          textBehindSubject ? 'text-2xl sm:text-3xl md:text-4xl mt-4' : 'text-lg sm:text-xl md:text-2xl'
                        }`}
                        style={{ color: artistColor }}
                      >
                        {artistName}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar (Bottom) */}
                  {showProgressBar && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 backdrop-blur-sm z-30">
                      <div 
                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </motion.div>

                {/* Preview Control Bar */}
                <div className="w-full bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl mt-4">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 shrink-0"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  
                  <div className="text-xs font-mono text-neutral-400 shrink-0 w-10 text-right">
                    {formatTime(currentTime)}
                  </div>
                  
                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-indigo-500 transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="text-xs font-mono text-neutral-400 shrink-0 w-10">
                    {formatTime(duration)}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal Overlay */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-10 rounded-3xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="text-center space-y-6 relative z-10">
                {exportProgress < 100 ? (
                  <>
                    <div className="relative w-24 h-24 mx-auto">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-neutral-800" />
                        <circle 
                          cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                          className="text-indigo-500 transition-all duration-200 ease-out"
                          strokeDasharray={`${2 * Math.PI * 45}`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - exportProgress / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black text-white">{Math.round(exportProgress)}%</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Rendering Loop...</h3>
                      <p className="text-sm text-neutral-400 mt-2 font-medium">Applying {loopMethod}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-12 h-12 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Export Complete!</h3>
                      <p className="text-sm text-neutral-400 mt-2 font-medium">Your infinite loop is ready.</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Prompt Cheat Key Modal */}
      <AnimatePresence>
        {isPromptModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" /> 프롬프트 생성 치트키
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">원하는 스타일을 클릭하면 프롬프트에 자동으로 추가됩니다.</p>
                </div>
                <button 
                  onClick={() => setIsPromptModalOpen(false)}
                  className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                {promptCheatKeys.map((category, idx) => (
                  <div key={idx}>
                    <h4 className="text-sm font-bold text-indigo-300 mb-3">{category.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((item, itemIdx) => (
                        <button
                          key={itemIdx}
                          onClick={() => handleCheatKeyClick(item)}
                          className="text-left text-xs bg-neutral-800 hover:bg-indigo-600/20 border border-neutral-700 hover:border-indigo-500/50 text-neutral-300 hover:text-white px-3 py-2 rounded-lg transition-all"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings / API Key Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" /> Settings
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">외부 API Key 관리 (로컬 암호화 저장)</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-2">
                      <Key className="w-4 h-4" /> API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-2">암호화 비밀번호 (로컬 저장/불러오기용)</label>
                    <input
                      type="password"
                      value={encryptionPassword}
                      onChange={(e) => setEncryptionPassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveToLocal}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-neutral-700"
                  >
                    <Save className="w-4 h-4" /> 저장
                  </button>
                  <label className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-neutral-700 cursor-pointer">
                    <Upload className="w-4 h-4" /> 불러오기
                    <input type="file" accept=".enc" onChange={handleLoadFromLocal} className="hidden" />
                  </label>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {testStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    {testStatus === 'testing' ? '연결 테스트 중...' : '연결 테스트'}
                  </button>
                  
                  {testStatus === 'success' && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-xs">
                      <CheckCircle2 className="w-4 h-4" /> API 연결이 정상적으로 확인되었습니다.
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4" /> API 연결에 실패했습니다. 키를 확인해주세요.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
