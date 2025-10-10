
import React, { useState, useEffect, useRef } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Clock, X, Image as ImageIcon, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface JobMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  alt?: string;
  duration?: string;
}

interface JobMediaCarouselProps {
  media: JobMedia[];
  title: string;
  className?: string;
}

const JobMediaCarousel: React.FC<JobMediaCarouselProps> = ({ media, title, className = "" }) => {
  const [selectedMedia, setSelectedMedia] = useState<JobMedia | null>(null);
  const [currentModalIndex, setCurrentModalIndex] = useState<number>(0);
  const [api, setApi] = useState<any>(null);
  const [modalApi, setModalApi] = useState<any>(null);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
  const [loadingMedia, setLoadingMedia] = useState<Set<string>>(new Set());
  const previousUrlsRef = useRef<Set<string>>(new Set());

  // Helper function to convert Google Storage URLs to public URLs if needed
  const getPublicUrl = (url: string): string => {
    // If it's already a public URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a gs:// URL, convert to public URL
    if (url.startsWith('gs://')) {
      const bucketAndPath = url.replace('gs://', '');
      const [bucket, ...pathParts] = bucketAndPath.split('/');
      const path = pathParts.join('/');
      return `https://storage.googleapis.com/${bucket}/${path}`;
    }
    
    return url;
  };

  // Helper function to handle media loading errors
  const handleMediaError = (url: string, type: 'image' | 'video') => {
    setFailedMedia(prev => new Set([...prev, url]));
    setLoadingMedia(prev => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  };

  // Helper function to handle media loading success
  const handleMediaLoad = (url: string) => {
    setLoadingMedia(prev => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  };

  // Filter out failed media
  const validMedia = media.filter(item => !failedMedia.has(item.url));

  // Initialize loading states for new media - only when URLs actually change
  useEffect(() => {
    if (media && media.length > 0) {
      const currentUrls = new Set(media.map(item => item.url));
      const previousUrls = previousUrlsRef.current;
      
      // Only reset if the URLs have actually changed
      const urlsChanged = currentUrls.size !== previousUrls.size || 
                         !Array.from(currentUrls).every(url => previousUrls.has(url));
      
      if (urlsChanged) {
        // Only set loading state for images, not videos (since videos use placeholders)
        const imageUrls = media.filter(item => item.type === 'image').map(item => item.url);
        const newLoadingMedia = new Set(imageUrls);
        setLoadingMedia(newLoadingMedia);
        setFailedMedia(new Set()); // Reset failed media when new media is received
        // Update the ref with current URLs
        previousUrlsRef.current = new Set(currentUrls);
      }
    }
  }, [media]);

  useEffect(() => {
    if (api) {
      // Add a small delay to ensure the carousel is properly initialized
      setTimeout(() => {
        api.reInit();
      }, 100);
    }
  }, [media, api]);

  // Check if we should show navigation buttons
  const shouldShowNavigation = validMedia.length > 1;


  const handleMediaClick = (mediaItem: JobMedia, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const index = validMedia.findIndex(item => item.url === mediaItem.url);
    setCurrentModalIndex(index);
    setSelectedMedia(mediaItem);
  };

  const handleCarouselClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleNavigationClick = (e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.stopPropagation();
    if (api) {
      if (direction === 'prev') {
        api.scrollPrev();
      } else {
        api.scrollNext();
      }
    }
  };

  const handleModalNavigation = (direction: 'prev' | 'next') => {
    if (modalApi) {
      if (direction === 'prev') {
        modalApi.scrollPrev();
      } else {
        modalApi.scrollNext();
      }
    }
  };

  const handleModalClose = () => {
    setSelectedMedia(null);
    setCurrentModalIndex(0);
  };

  if (!media || media.length === 0) {
    return (
      <div className={`w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-4xl ${className}`}>
        🏢
      </div>
    );
  }

  if (validMedia.length === 0) {
    return (
      <div className={`w-full h-48 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center text-4xl ${className}`}>
        ⚠️
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className}`} onClick={handleCarouselClick}>
        <Carousel 
          className="w-full"
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
            skipSnaps: false,
            dragFree: false,
            containScroll: "trimSnaps",
            slidesToScroll: 1,
          }}
        >
          <CarouselContent>
            {validMedia.map((item, index) => (
              <CarouselItem key={index} className="pl-1 pr-1">
                 <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <div 
                      className="w-full h-full cursor-pointer group"
                      onClick={(e) => handleMediaClick(item, e)}
                    >
                      {/* Loading indicator */}
                      {loadingMedia.has(item.url) && (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      
                      <img
                        src={getPublicUrl(item.url)}
                        alt={item.alt || `${title} workplace image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onLoad={() => handleMediaLoad(item.url)}
                        onError={(e) => {
                          // Hide image if it fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          handleMediaError(item.url, 'image');
                        }}
                        crossOrigin="anonymous"
                      />

                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Eye className="h-4 w-4 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="relative w-full h-full cursor-pointer group"
                      onClick={(e) => handleMediaClick(item, e)}
                    >
                      {/* Video thumbnail - use a placeholder background */}
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-xs">Video</div>
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                        <div className="bg-white rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform duration-200">
                          <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
                        </div>
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {shouldShowNavigation && (
            <>
              <CarouselPrevious 
                className="bg-white/90 hover:bg-white shadow-lg border-0 z-20 text-gray-700 hover:text-gray-900" 
                onClick={(e) => handleNavigationClick(e, 'prev')}
              />
              <CarouselNext 
                className="bg-white/90 hover:bg-white shadow-lg border-0 z-20 text-gray-700 hover:text-gray-900" 
                onClick={(e) => handleNavigationClick(e, 'next')}
              />
            </>
          )}
        </Carousel>
      </div>

      {/* Unified Media Modal with Navigation */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={handleModalClose}>
          <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-black [&>button]:bg-black [&>button]:bg-opacity-50 [&>button]:text-white [&>button]:hover:bg-opacity-70 [&>button]:rounded-full [&>button]:p-2 [&>button]:border-white [&>button]:border-opacity-30">
            <DialogTitle className="sr-only">Media Preview</DialogTitle>
            <div className="relative">
              {validMedia.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-1/2 left-4 z-20 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 rounded-full transform -translate-y-1/2"
                    onClick={() => handleModalNavigation('prev')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-1/2 right-4 z-20 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 rounded-full transform -translate-y-1/2"
                    onClick={() => handleModalNavigation('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              <Carousel 
                className="w-full"
                setApi={setModalApi}
                opts={{
                  align: "center",
                  loop: true,
                  skipSnaps: false,
                  dragFree: false,
                  containScroll: "trimSnaps",
                  slidesToScroll: 1,
                  startIndex: currentModalIndex,
                }}
              >
                <CarouselContent>
                  {validMedia.map((item, index) => (
                    <CarouselItem key={index}>
                      <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh]">
                        {item.type === 'video' ? (
                          <video
                            controls
                            autoPlay
                            className="w-full h-auto max-h-[80vh] rounded-lg"
                            src={getPublicUrl(item.url)}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={getPublicUrl(item.url)}
                            alt={item.alt || `${title} media ${index + 1}`}
                            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default JobMediaCarousel;
