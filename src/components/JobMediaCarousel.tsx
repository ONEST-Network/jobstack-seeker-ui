
import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Clock } from 'lucide-react';

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

  if (!media || media.length === 0) {
    return (
      <div className={`w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl ${className}`}>
        🏢
      </div>
    );
  }

  const handleVideoClick = (videoItem: JobMedia) => {
    setSelectedVideo(videoItem);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <Carousel className="w-full">
          <CarouselContent>
            {media.map((item, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.alt || `${title} workplace image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image if it fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => handleVideoClick(item)}
                    >
                      <img
                        src={item.thumbnail || item.url}
                        alt={item.alt || `${title} job video ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide thumbnail if it fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                        <div className="bg-white rounded-full p-3 shadow-lg">
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
          {media.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl">
            <video
              controls
              autoPlay
              className="w-full h-auto rounded-lg"
              src={selectedVideo.url}
              onError={(e) => {
                console.error('Video failed to load:', selectedVideo.url);
                // You could show an error message here
              }}
            >
              Your browser does not support the video tag.
            </video>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default JobMediaCarousel;
