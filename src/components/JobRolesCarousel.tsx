
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const JobRolesCarousel = () => {
  const jobRoles = [
    { name: 'Electrician', count: 2847, icon: '⚡', category: 'Technical' },
    { name: 'Driver', count: 5432, icon: '🚗', category: 'Transport' },
    { name: 'Security Guard', count: 1923, icon: '🛡️', category: 'Security' },
    { name: 'Welder', count: 876, icon: '🔥', category: 'Technical' },
    { name: 'Tailor', count: 1234, icon: '✂️', category: 'Craft' },
    { name: 'Carpenter', count: 1567, icon: '🔨', category: 'Technical' },
    { name: 'Machine Operator', count: 3421, icon: '⚙️', category: 'Manufacturing' },
    { name: 'Sales Rep', count: 4532, icon: '💼', category: 'Sales' },
    { name: 'Plumber', count: 987, icon: '🔧', category: 'Technical' },
    { name: 'Mason', count: 756, icon: '🧱', category: 'Construction' },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Technical: 'bg-blue-100 text-blue-800',
      Transport: 'bg-green-100 text-green-800',
      Security: 'bg-red-100 text-red-800',
      Craft: 'bg-purple-100 text-purple-800',
      Manufacturing: 'bg-orange-100 text-orange-800',
      Sales: 'bg-pink-100 text-pink-800',
      Construction: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Popular Job Categories
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore opportunities across various sectors with thousands of openings
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {jobRoles.map((role, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border border-border"
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{role.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{role.name}</h3>
                <Badge 
                  variant="secondary" 
                  className={`mb-3 ${getCategoryColor(role.category)}`}
                >
                  {role.category}
                </Badge>
                <div className="text-2xl font-bold text-primary mb-1">
                  {role.count.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">openings</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="text-primary hover:text-primary/80 font-medium">
            View All Categories →
          </button>
        </div>
      </div>
    </section>
  );
};

export default JobRolesCarousel;
