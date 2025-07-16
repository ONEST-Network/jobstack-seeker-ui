
import React, { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Clock, X, Image as ImageIcon, Eye } from 'lucide-react';

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
  const [selectedVideo, setSelectedVideo] = useState<JobMedia | null>(null);
  const [selectedImage, setSelectedImage] = useState<JobMedia | null>(null);
  const [api, setApi] = useState<any>(null);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
  const [loadingMedia, setLoadingMedia] = useState<Set<string>>(new Set());

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
    console.warn(`Failed to load ${type}:`, url);
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

  // Initialize loading states for new media
  useEffect(() => {
    if (media && media.length > 0) {
      const newLoadingMedia = new Set(media.map(item => item.url));
      setLoadingMedia(newLoadingMedia);
      setFailedMedia(new Set()); // Reset failed media when new media is received
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

  if (!media || media.length === 0) {
    return (
      <div className={`w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl ${className}`}>
        🏢
      </div>
    );
  }

  if (validMedia.length === 0) {
    return (
      <div className={`w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center text-2xl ${className}`}>
        ⚠️
      </div>
    );
  }

  const handleVideoClick = (videoItem: JobMedia, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVideo(videoItem);
  };

  const handleImageClick = (imageItem: JobMedia, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedImage(imageItem);
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
              <CarouselItem key={index}>
                <div className="relative w-full h-48 sm:h-56 bg-gray-100 rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <div 
                      className="w-full h-full cursor-pointer group"
                      onClick={(e) => handleImageClick(item, e)}
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
                      onClick={(e) => handleVideoClick(item, e)}
                    >
                      {/* Loading indicator */}
                      {loadingMedia.has(item.url) && (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      
                      <img
                        src={getPublicUrl(item.thumbnail || item.url)}
                        alt={item.alt || `${title} job video ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onLoad={() => handleMediaLoad(item.url)}
                        onError={(e) => {
                          // Hide thumbnail if it fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          handleMediaError(item.url, 'video');
                        }}
                      />
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

      {/* Video Modal */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogTitle className="sr-only">Video Preview</DialogTitle>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70"
                onClick={() => setSelectedVideo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <video
                controls
                autoPlay
                className="w-full h-auto rounded-lg"
                src={getPublicUrl(selectedVideo.url)}
                onError={(e) => {
                  console.error('Video failed to load:', selectedVideo.url);
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogTitle className="sr-only">Image Preview</DialogTitle>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={getPublicUrl(selectedImage.url)}
                alt={selectedImage.alt || `${title} workplace image`}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  console.error('Image failed to load:', selectedImage.url);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default JobMediaCarousel;
