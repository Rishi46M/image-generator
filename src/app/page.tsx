'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Database, 
  Zap, 
  Loader2, 
  Trash2, 
  Download,
  Wand2,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  Info,
  Palette,
  Layers,
  Sun,
  Camera,
  ArrowRight,
  Star,
  History,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  description: string;
  keywords: string;
  promptHint: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  isFavorite: boolean;
}

interface GeneratedImage {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  imageData: string;
  retrievedContext: string | null;
  size: string;
  createdAt: string;
}

// Constants - move outside component to prevent recreation
const IMAGE_SIZES = [
  { value: '1024x1024', label: 'Square', icon: '□' },
  { value: '1344x768', label: 'Landscape', icon: '▭' },
  { value: '768x1344', label: 'Portrait', icon: '▯' },
  { value: '1440x720', label: 'Wide', icon: '▬' },
] as const;

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  style: Palette,
  mood: Sun,
  subject: Camera,
  lighting: Lightbulb,
  technique: Layers,
};

// Animation variants - defined outside to prevent recreation
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Skeleton Components
function PromptInputSkeleton() {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/20">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}

function KnowledgeBaseSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-1.5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImageGenerator() {
  // State
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [retrievedContext, setRetrievedContext] = useState<string[]>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [imageGallery, setImageGallery] = useState<GeneratedImage[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasSeeded, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Memoized derived data
  const categories = useMemo(() => 
    [...new Set(knowledgeBase.map(entry => entry.category))],
    [knowledgeBase]
  );

  const knowledgeByCategory = useMemo(() => {
    const map = new Map<string, KnowledgeEntry[]>();
    knowledgeBase.forEach(entry => {
      const entries = map.get(entry.category) || [];
      entries.push(entry);
      map.set(entry.category, entries);
    });
    return map;
  }, [knowledgeBase]);

  const stats = useMemo(() => ({
    knowledgeCount: knowledgeBase.length,
    galleryCount: imageGallery.length,
    templateCount: templates.length,
  }), [knowledgeBase.length, imageGallery.length, templates.length]);

  // Stable callback functions
  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch('/api/images?limit=20');
      const data = await res.json();
      if (data.success) {
        setImageGallery(data.data);
      }
    } catch {
      console.error('Failed to fetch gallery');
    }
  }, []);

  const fetchKnowledgeBase = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      if (data.success) {
        setKnowledgeBase(data.data);
        return data.data.length > 0;
      }
      return false;
    } catch {
      console.error('Failed to fetch knowledge base');
      return false;
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch {
      console.error('Failed to fetch templates');
    }
  }, []);

  const seedDatabase = useCallback(async () => {
    if (hasSeeded || isSeeding) return;
    
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsInitialized(true);
        await Promise.all([fetchKnowledgeBase(), fetchTemplates()]);
      }
    } catch {
      toast.error('Failed to initialize knowledge base');
    } finally {
      setIsSeeding(false);
    }
  }, [hasSeeded, isSeeding, fetchKnowledgeBase, fetchTemplates]);

  // Initial data fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [hasData] = await Promise.all([
          fetchKnowledgeBase(),
          fetchTemplates(),
          fetchGallery(),
        ]);
        
        // If no knowledge base data, seed it
        if (!hasData) {
          await seedDatabase();
        } else {
          setIsInitialized(true);
        }
      } catch {
        setError('Failed to load application data');
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [fetchKnowledgeBase, fetchTemplates, fetchGallery, seedDatabase]);

  const generateImage = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setRetrievedContext([]);
    setEnhancedPrompt('');
    setGeneratedImage(null);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: selectedSize }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedImage(data.data);
        setRetrievedContext(data.data.retrievedContext || []);
        setEnhancedPrompt(data.data.enhancedPrompt);
        fetchGallery();
        toast.success('Image generated successfully!');
      } else {
        setError(data.error || 'Failed to generate image');
        toast.error(data.error || 'Failed to generate image');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedSize, fetchGallery]);

  const deleteImage = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      const res = await fetch(`/api/images?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setImageGallery(prev => prev.filter(img => img.id !== id));
        if (generatedImage?.id === id) {
          setGeneratedImage(null);
        }
        toast.success('Image deleted');
      }
    } catch {
      toast.error('Failed to delete image');
    }
  }, [generatedImage?.id]);

  const downloadImage = useCallback((imageData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = `${filename}.png`;
    link.click();
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const applyTemplate = useCallback((template: PromptTemplate) => {
    setPrompt(template.template);
    promptRef.current?.focus();
    toast.success(`Template "${template.name}" loaded`);
  }, []);

  // Get knowledge entries by category - memoized
  const getKnowledgeByCategory = useCallback((category: string) => {
    return knowledgeByCategory.get(category) || [];
  }, [knowledgeByCategory]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PromptInputSkeleton />
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-36" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="aspect-square w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="space-y-6">
              <KnowledgeBaseSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !knowledgeBase.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b bg-gradient-to-r from-card via-card to-muted/30">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container mx-auto px-4 py-6 md:py-8 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 md:gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-2.5 md:p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600">
                  <Wand2 className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                  Image Generator
                </h1>
                <p className="text-muted-foreground mt-0.5 md:mt-1 flex items-center gap-2 text-sm md:text-base">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                  AI-powered image creation with intelligent context retrieval
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2 md:gap-3"
            >
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-muted/50 border text-xs md:text-sm">
                <Database className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="font-medium">{stats.knowledgeCount} Knowledge</span>
              </div>
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-muted/50 border text-xs md:text-sm">
                <History className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="font-medium">{stats.galleryCount} Created</span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="create" className="gap-2 text-sm">
                  <Sparkles className="h-4 w-4" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  Gallery ({stats.galleryCount})
                </TabsTrigger>
              </TabsList>

              {/* Create Tab */}
              <TabsContent value="create" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Prompt Input Card */}
                  <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3 md:pb-4">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        Describe Your Vision
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        Enter a prompt and RAG will enhance it with relevant artistic context
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4">
                      <div className="space-y-2">
                        <Textarea
                          ref={promptRef}
                          placeholder="e.g., A serene mountain landscape at golden hour..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={3}
                          className="resize-none text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        <Label className="text-xs md:text-sm font-medium">Image Dimensions</Label>
                        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                          {IMAGE_SIZES.map(size => (
                            <button
                              key={size.value}
                              onClick={() => setSelectedSize(size.value)}
                              className={`flex flex-col items-center gap-0.5 md:gap-1 p-2 md:p-3 rounded-lg border-2 transition-all ${
                                selectedSize === size.value
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-muted hover:border-muted-foreground/50'
                              }`}
                            >
                              <span className="text-base md:text-lg font-mono">{size.icon}</span>
                              <span className="text-[10px] md:text-xs font-medium">{size.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={generateImage} 
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full h-10 md:h-12 text-sm md:text-base font-medium"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                            Generate Image
                            <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Generated Image Display */}
                  <Card className={isGenerating || generatedImage ? 'border-primary/30' : ''}>
                    <CardHeader className="pb-2 md:pb-3">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <ImageIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        Generated Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnimatePresence mode="wait">
                        {isGenerating ? (
                          <motion.div
                            key="loading"
                            {...fadeInUp}
                            transition={{ duration: 0.3 }}
                            className="aspect-square bg-muted rounded-xl flex items-center justify-center"
                          >
                            <div className="text-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-3 md:mb-4" />
                              </motion.div>
                              <p className="text-muted-foreground font-medium text-sm md:text-base">Creating your image...</p>
                              <p className="text-xs md:text-sm text-muted-foreground/70 mt-1">RAG is enhancing your prompt</p>
                            </div>
                          </motion.div>
                        ) : generatedImage ? (
                          <motion.div
                            key="result"
                            {...scaleIn}
                            transition={{ duration: 0.3 }}
                            className="space-y-3 md:space-y-4"
                          >
                            <div className="aspect-square bg-muted rounded-xl overflow-hidden relative group">
                              <img
                                src={`data:image/png;base64,${generatedImage.imageData}`}
                                alt="Generated"
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 flex gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 h-8 md:h-9"
                                    onClick={() => downloadImage(generatedImage.imageData, generatedImage.id)}
                                  >
                                    <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                    Download
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 md:h-9 px-2 md:px-3"
                                    onClick={() => {
                                      setPrompt(generatedImage.originalPrompt);
                                    }}
                                  >
                                    <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* RAG Context */}
                            {retrievedContext.length > 0 && (
                              <div className="space-y-1.5 md:space-y-2">
                                <Label className="flex items-center gap-2 text-xs md:text-sm">
                                  <Lightbulb className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                                  Retrieved Context (RAG)
                                </Label>
                                <div className="flex flex-wrap gap-1 md:gap-1.5">
                                  {retrievedContext.map((ctx, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] md:text-xs font-normal">
                                      {ctx}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Enhanced Prompt */}
                            <div className="space-y-1.5 md:space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-xs md:text-sm">
                                  <Zap className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                                  Enhanced Prompt
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => copyToClipboard(enhancedPrompt)}
                                >
                                  {copied ? (
                                    <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 md:h-4 md:w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="p-2.5 md:p-3 bg-muted/50 rounded-lg text-xs md:text-sm leading-relaxed">
                                {enhancedPrompt}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="empty"
                            {...fadeInUp}
                            transition={{ duration: 0.3 }}
                            className="aspect-square bg-muted/50 rounded-xl flex items-center justify-center"
                          >
                            <div className="text-center p-4 md:p-6">
                              <ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30 mx-auto mb-3 md:mb-4" />
                              <p className="text-muted-foreground font-medium text-sm md:text-base">No image yet</p>
                              <p className="text-xs md:text-sm text-muted-foreground/60 mt-1">Enter a prompt to get started</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="mt-4 md:mt-6">
                <Card>
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <ImageIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      Your Creations
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">All generated images in this session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {imageGallery.length === 0 ? (
                      <div className="text-center py-12 md:py-16">
                        <ImageIcon className="h-16 w-16 md:h-20 md:w-20 text-muted-foreground/20 mx-auto mb-3 md:mb-4" />
                        <p className="text-muted-foreground font-medium text-sm md:text-base">No images generated yet</p>
                        <p className="text-xs md:text-sm text-muted-foreground/60 mt-1">Start creating to see your gallery</p>
                        <Button 
                          variant="outline" 
                          className="mt-3 md:mt-4"
                          onClick={() => setActiveTab('create')}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Your First Image
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {imageGallery.map((img, index) => (
                          <motion.div
                            key={img.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(index * 0.03, 0.3) }}
                            className="relative group aspect-square bg-muted rounded-lg md:rounded-xl overflow-hidden cursor-pointer"
                            onClick={() => {
                              setGeneratedImage(img);
                              setEnhancedPrompt(img.enhancedPrompt);
                              setRetrievedContext(img.retrievedContext ? JSON.parse(img.retrievedContext) : []);
                              setActiveTab('create');
                            }}
                          >
                            <img
                              src={`data:image/png;base64,${img.imageData}`}
                              alt="Generated"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3">
                                <p className="text-white text-[10px] md:text-xs line-clamp-2 mb-1.5 md:mb-2">{img.originalPrompt}</p>
                                <div className="flex gap-1.5 md:gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 h-7 md:h-8 text-[10px] md:text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadImage(img.imageData, img.id);
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 md:h-8 w-7 md:w-8 p-0"
                                    onClick={(e) => deleteImage(img.id, e)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Knowledge Base & Templates */}
          <div className="space-y-4 md:space-y-6">
            {/* Quick Templates */}
            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Zap className="h-4 w-4 text-primary" />
                  Quick Templates
                </CardTitle>
                <CardDescription className="text-xs">Click to use a template</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[140px] md:h-[200px] pr-3">
                  <div className="space-y-1.5 md:space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="w-full p-2 md:p-3 rounded-lg border text-left hover:border-primary/50 hover:bg-muted/50 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors">
                            {template.name}
                          </span>
                          {template.isFavorite && (
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 line-clamp-1">
                          {template.template}
                        </p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Knowledge Base */}
            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Knowledge Base
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={seedDatabase}
                    disabled={isSeeding}
                  >
                    {isSeeding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <CardDescription className="text-xs">RAG retrieves context from these entries</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px] md:h-[400px] pr-3">
                  <div className="space-y-3 md:space-y-4">
                    {categories.map(category => {
                      const IconComponent = CATEGORY_ICONS[category] || Info;
                      const entries = getKnowledgeByCategory(category);
                      
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                            <IconComponent className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                            <span className="font-medium text-xs md:text-sm capitalize">{category}</span>
                            <Badge variant="outline" className="text-[10px] md:text-xs px-1.5">
                              {entries.length}
                            </Badge>
                          </div>
                          <div className="space-y-1 md:space-y-1.5">
                            {entries.map(entry => (
                              <div
                                key={entry.id}
                                className="p-2 md:p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <p className="font-medium text-xs md:text-sm">{entry.title}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {entry.promptHint}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-primary/20">
              <CardContent className="pt-3 md:pt-4">
                <div className="flex gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 h-fit">
                    <Info className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <p className="font-medium text-xs md:text-sm">How RAG Enhances Your Images</p>
                    <ol className="text-[10px] md:text-xs text-muted-foreground space-y-1.5 md:space-y-2">
                      {[
                        'You provide a prompt',
                        'RAG finds relevant artistic context',
                        'LLM enhances with style details',
                        'AI generates a rich, detailed image',
                      ].map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5 md:gap-2">
            <Wand2 className="h-3 w-3 md:h-4 md:w-4" />
            Image Generator — Powered by AI
          </p>
          <div className="flex items-center gap-2 md:gap-4">
            <span>{stats.knowledgeCount} knowledge entries</span>
            <span className="hidden sm:inline">•</span>
            <span>{stats.galleryCount} images created</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
