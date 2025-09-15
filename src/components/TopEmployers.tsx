
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Users } from 'lucide-react';

const TopEmployers = () => {
  const employers = [
    {
      id: 1,
      name: 'Tata Motors',
      logo: '🚗',
      sector: 'Automotive',
      location: 'Mumbai, Maharashtra',
      openings: 245,
      employeeCount: '50K+',
      verified: true,
      rating: 4.2,
      description: 'Leading automotive manufacturer in India'
    },
    {
      id: 2,
      name: 'L&T Construction',
      logo: '🏗️',
      sector: 'Construction',
      location: 'Chennai, Tamil Nadu',
      openings: 189,
      employeeCount: '100K+',
      verified: true,
      rating: 4.1,
      description: 'Infrastructure and construction leader'
    },
    {
      id: 3,
      name: 'Bharti Airtel',
      logo: '📡',
      sector: 'Telecommunications',
      location: 'Delhi, Delhi',
      openings: 156,
      employeeCount: '20K+',
      verified: true,
      rating: 4.0,
      description: 'Leading telecom service provider'
    },
    {
      id: 4,
      name: 'Mahindra Group',
      logo: '🏭',
      sector: 'Manufacturing',
      location: 'Pune, Maharashtra',
      openings: 134,
      employeeCount: '75K+',
      verified: true,
      rating: 4.3,
      description: 'Diversified manufacturing conglomerate'
    },
    {
      id: 5,
      name: 'Asian Paints',
      logo: '🎨',
      sector: 'Chemicals',
      location: 'Mumbai, Maharashtra',
      openings: 98,
      employeeCount: '15K+',
      verified: true,
      rating: 4.4,
      description: 'Leading paint and coatings company'
    },
    {
      id: 6,
      name: 'ITC Limited',
      logo: '🏢',
      sector: 'FMCG',
      location: 'Kolkata, West Bengal',
      openings: 87,
      employeeCount: '30K+',
      verified: true,
      rating: 4.2,
      description: 'Diversified conglomerate company'
    },
    {
      id: 7,
      name: 'Wipro',
      logo: '💻',
      sector: 'IT Services',
      location: 'Bangalore, Karnataka',
      openings: 76,
      employeeCount: '250K+',
      verified: true,
      rating: 4.0,
      description: 'Global IT consulting and services'
    },
    {
      id: 8,
      name: 'JSW Steel',
      logo: '⚡',
      sector: 'Steel',
      location: 'Mumbai, Maharashtra',
      openings: 65,
      employeeCount: '40K+',
      verified: true,
      rating: 4.1,
      description: 'Leading steel manufacturing company'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Top Employers Hiring Now
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover opportunities with India's leading companies across various sectors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {employers.map((employer) => (
            <Card 
              key={employer.id} 
              className="hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border border-border group"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 
                                  rounded-lg flex items-center justify-center text-2xl
                                  group-hover:scale-110 transition-transform duration-300">
                      {employer.logo}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight">
                        {employer.name}
                      </h3>
                      {employer.verified && (
                        <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 text-xs">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    <span>{employer.sector}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{employer.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{employer.employeeCount} employees</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {employer.description}
                </p>

                {/* Openings */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {employer.openings}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Open Positions
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-medium">{employer.rating}</span>
                  </div>
                  <button className="text-primary hover:text-primary/80 text-sm font-medium
                                   transition-colors duration-200">
                    View Jobs →
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-white border border-primary text-primary hover:bg-primary 
                           hover:text-white px-8 py-3 rounded-lg font-medium transition-all duration-300
                           shadow-sm hover:shadow-md">
            View All Companies →
          </button>
        </div>
      </div>
    </section>
  );
};

export default TopEmployers;
